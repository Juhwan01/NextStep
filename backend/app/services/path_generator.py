import asyncio
import logging
from collections import defaultdict
from pathlib import Path
from typing import Optional

from app.services.ai_service import AIService, AIServiceError
from app.services.graph_service import GraphService
from app.services.job_interpreter import JobInterpreterService
from app.services.user_state import UserStateService
from app.schemas.ai import JobInterpretation, UserAssessment, SkillExplanation
from app.schemas.skill import SkillNode, SubGraph
from app.schemas.path import (
    PathNode, PathEdge, PathMetadata, GeneratedPath, DualPath,
)

logger = logging.getLogger(__name__)

EXPLANATION_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "path_explanation.txt"
AUGMENTATION_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "graph_augmentation.txt"


class PathGeneratorService:
    """
    Core orchestrator: generates personalized dual learning paths.
    Combines AI interpretation + Neo4j graph traversal + AI explanations.
    """

    def __init__(
        self,
        ai_service: AIService,
        graph_service: GraphService,
        job_interpreter: JobInterpreterService,
        user_state_service: UserStateService,
    ):
        self.ai = ai_service
        self.graph = graph_service
        self.job_interpreter = job_interpreter
        self.user_state = user_state_service
        # Ensure user_state has graph context for prerequisite-aware assessment
        if not self.user_state.graph_service:
            self.user_state.graph_service = graph_service
        self._explanation_prompt = EXPLANATION_PROMPT_PATH.read_text(encoding="utf-8")
        self._augmentation_prompt = AUGMENTATION_PROMPT_PATH.read_text(encoding="utf-8")

    async def generate_paths(self, job_input: str, current_state: str) -> DualPath:
        """
        Main entry: generate both fast_track and fundamentals paths.

        1. Interpret job -> required skills
        2. Match skills to graph + Assess user state (parallel)
        3. Augment if needed
        4. Build both paths in parallel
        5. Generate explanations (parallel batches)
        6. Return DualPath
        """
        # Step 1: Interpret the job
        interpretation = await self.job_interpreter.interpret(job_input)
        logger.info(f"Job interpreted: {interpretation.title} ({len(interpretation.required_skills)} skills)")

        # Step 2: Match to graph + Assess user state (parallel)
        match_task = self.job_interpreter.match_to_graph(interpretation)
        assess_task = self.user_state.assess(current_state, interpretation, [
            s.name for s in interpretation.required_skills + interpretation.optional_skills
        ][:30])
        match_result, raw_assessment = await asyncio.gather(match_task, assess_task)

        # Post-process: propagate prerequisites (React알면 → JS도 자동 인정)
        assessment = await self.user_state.propagate_prerequisites(raw_assessment)

        matched = match_result["matched"]
        unmatched = match_result["unmatched"]

        # Step 2b: Augment graph with missing skills (only if many unmatched and few matched)
        total_required = len(interpretation.required_skills)
        if unmatched and (len(unmatched) > 2 or len(matched) < total_required * 0.5):
            logger.info(f"Augmenting graph with {len(unmatched)} new skills (matched {len(matched)}/{total_required})")
            await self._augment_graph(unmatched)
            match_result = await self.job_interpreter.match_to_graph(interpretation)
            matched = match_result["matched"]
        elif unmatched:
            logger.info(f"Skipping augmentation for {len(unmatched)} skills (matched {len(matched)}/{total_required} is sufficient)")

        # Get target skill IDs
        target_skill_ids = [m["graph_node"].id for m in matched]
        if not target_skill_ids:
            raise ValueError("No skills could be matched to the graph. Please try a more specific job description.")

        # Re-assess with actual matched skill names for accurate assessment
        available_names = [m["graph_node"].name for m in matched]

        # Build skill name -> id mapping for determining known skills
        skill_name_to_id = {m["graph_node"].name.lower(): m["graph_node"].id for m in matched}
        known_skill_ids = set(self.user_state.determine_start_nodes(assessment, skill_name_to_id))

        # Step 4: Get the full subgraph
        subgraph = await self.graph.get_subgraph_for_skills(target_skill_ids, depth=3)

        # Step 5: Build both paths in parallel
        fast_track_task = self._build_path(
            subgraph, target_skill_ids, known_skill_ids, matched, "fast_track"
        )
        fundamentals_task = self._build_path(
            subgraph, target_skill_ids, known_skill_ids, matched, "fundamentals"
        )
        fast_track_path, fundamentals_path = await asyncio.gather(fast_track_task, fundamentals_task)

        # Step 6: Apply cached explanations only — missing ones are lazy-loaded via API
        all_node_ids = set()
        all_node_ids.update(n.id for n in fast_track_path.nodes)
        all_node_ids.update(n.id for n in fundamentals_path.nodes)

        cached = await self.graph.get_skill_explanations(list(all_node_ids))
        explanations = cached

        # Apply whatever is cached; frontend lazy-loads the rest
        fast_track_path = self._apply_explanations(fast_track_path, explanations)
        fundamentals_path = self._apply_explanations(fundamentals_path, explanations)

        return DualPath(
            fast_track=fast_track_path,
            fundamentals=fundamentals_path,
            shared_graph={
                "nodes": [n.model_dump() for n in subgraph.nodes],
                "edges": [
                    {
                        "source": e.from_id,
                        "target": e.to_id,
                        "type": e.type,
                        "on_recommended_path": False,
                        "strength": e.strength,
                    }
                    for e in subgraph.edges
                ],
            },
        )

    async def _build_path(
        self,
        subgraph: SubGraph,
        target_skill_ids: list[str],
        known_skill_ids: set[str],
        matched: list[dict],
        path_type: str,
    ) -> GeneratedPath:
        """Build a single path (fast_track or fundamentals)."""
        # Build adjacency for topological sort
        adj = defaultdict(list)  # prerequisite -> [dependents]
        in_degree = defaultdict(int)
        all_node_ids = {n.id for n in subgraph.nodes}
        node_map = {n.id: n for n in subgraph.nodes}

        for edge in subgraph.edges:
            if edge.type == "PREREQUISITE_OF" and edge.from_id in all_node_ids and edge.to_id in all_node_ids:
                adj[edge.from_id].append(edge.to_id)
                in_degree[edge.to_id] += 1

        # Determine which nodes to include
        if path_type == "fast_track":
            # Only include target skills + strong prerequisites (strength >= 0.5)
            include_ids = set(target_skill_ids)
            changed = True
            while changed:
                changed = False
                for edge in subgraph.edges:
                    if (
                        edge.type == "PREREQUISITE_OF"
                        and edge.to_id in include_ids
                        and edge.from_id not in include_ids
                        and edge.strength >= 0.5
                    ):
                        include_ids.add(edge.from_id)
                        changed = True
        else:
            # Fundamentals: include all prerequisites regardless of strength
            include_ids = set(target_skill_ids)
            changed = True
            while changed:
                changed = False
                for edge in subgraph.edges:
                    if (
                        edge.type == "PREREQUISITE_OF"
                        and edge.to_id in include_ids
                        and edge.from_id not in include_ids
                    ):
                        include_ids.add(edge.from_id)
                        changed = True

        # Remove already-known skills
        path_node_ids = include_ids - known_skill_ids

        # Collect skipped skill names for metadata
        skipped_skill_names = [
            node_map[sid].name_ko for sid in known_skill_ids
            if sid in node_map
        ]

        # Topological sort of remaining nodes (prioritize lower difficulty first)
        sorted_ids = self._topological_sort(path_node_ids, subgraph.edges, node_map)

        # Build path nodes
        importance_map = {}
        for m in matched:
            importance_map[m["graph_node"].id] = m["requirement"].importance

        path_nodes = []
        total_hours = 0
        for order, node_id in enumerate(sorted_ids):
            if node_id not in node_map:
                continue
            skill = node_map[node_id]
            status = "not_started"
            if order == 0:
                status = "recommended_next"

            path_nodes.append(PathNode(
                id=skill.id,
                name=skill.name,
                name_ko=skill.name_ko,
                category=skill.category,
                difficulty=skill.difficulty,
                market_demand=skill.market_demand,
                estimated_hours=skill.estimated_hours,
                description=skill.description,
                status=status,
                order=order,
                explanation={"why_needed": "", "job_relevance": "", "connection_to_next": ""},
            ))
            total_hours += skill.estimated_hours

        # Build path edges: only the PRIMARY learning chain glows blue.
        # For each node, only the closest predecessor edge(s) are highlighted.
        # This creates a clean sequential chain instead of a web of edges.
        path_id_set = {n.id for n in path_nodes}
        order_map = {n.id: n.order for n in path_nodes}

        # For each target node, find closest predecessor (highest order among prereqs)
        primary_chain = set()  # set of (source_id, target_id)
        for node in path_nodes:
            # Find all PREREQUISITE_OF edges pointing TO this node from other path nodes
            prereqs_with_order = []
            for edge in subgraph.edges:
                if (edge.type == "PREREQUISITE_OF"
                        and edge.to_id == node.id
                        and edge.from_id in path_id_set):
                    prereqs_with_order.append(
                        (edge.from_id, order_map.get(edge.from_id, -1))
                    )

            if not prereqs_with_order:
                continue

            # Keep only the closest predecessor(s) — highest order = most recent in sequence
            max_order = max(p[1] for p in prereqs_with_order)
            for prereq_id, prereq_order in prereqs_with_order:
                if prereq_order == max_order:
                    primary_chain.add((prereq_id, node.id))

        # Also ensure start → first reachable nodes are connected
        start_ids = {n.id for n in path_nodes if n.order == 0}
        for edge in subgraph.edges:
            if (edge.type == "PREREQUISITE_OF"
                    and edge.from_id in start_ids
                    and edge.to_id in path_id_set
                    and order_map.get(edge.to_id, 0) == 1):
                primary_chain.add((edge.from_id, edge.to_id))

        path_edges = []
        for edge in subgraph.edges:
            if edge.from_id in path_id_set and edge.to_id in path_id_set:
                is_primary = (edge.from_id, edge.to_id) in primary_chain
                path_edges.append(PathEdge(
                    source=edge.from_id,
                    target=edge.to_id,
                    type=edge.type,
                    on_recommended_path=is_primary,
                    strength=edge.strength,
                ))

        # Add LEARNING_SEQUENCE edges: connect consecutive-order nodes.
        # These represent the learning path order, independent of graph prerequisites.
        existing_edge_keys = {(e.source, e.target) for e in path_edges}
        order_to_ids: dict[int, list[str]] = {}
        for n in path_nodes:
            order_to_ids.setdefault(n.order, []).append(n.id)
        sorted_orders = sorted(order_to_ids.keys())

        for i in range(len(sorted_orders) - 1):
            curr_ids = order_to_ids[sorted_orders[i]]
            next_ids = order_to_ids[sorted_orders[i + 1]]
            for cid in curr_ids:
                for nid in next_ids:
                    if (cid, nid) not in existing_edge_keys:
                        path_edges.append(PathEdge(
                            source=cid,
                            target=nid,
                            type="LEARNING_SEQUENCE",
                            on_recommended_path=True,
                            strength=0.8,
                        ))
                        existing_edge_keys.add((cid, nid))

        # Calculate concurrent groups (skills with same topological depth)
        concurrent_groups = self._calculate_concurrent_groups(path_id_set, subgraph.edges)

        # Determine goal node: highest-importance target skill with highest order
        goal_node_id = ""
        if path_nodes:
            target_path_nodes = [n for n in path_nodes if n.id in set(target_skill_ids)]
            if target_path_nodes:
                # Pick the target skill with highest order (deepest in path)
                goal_node_id = max(target_path_nodes, key=lambda n: (n.order, importance_map.get(n.id, 0))).id
            else:
                goal_node_id = path_nodes[-1].id

        metadata = PathMetadata(
            total_hours=total_hours,
            total_nodes=len(path_nodes),
            skipped_count=len(known_skill_ids),
            skipped_skills=skipped_skill_names,
            path_type=path_type,
            job_title="",
            concurrent_groups=concurrent_groups,
            goal_node_id=goal_node_id,
        )

        return GeneratedPath(nodes=path_nodes, edges=path_edges, metadata=metadata)

    def _topological_sort(
        self,
        node_ids: set[str],
        edges: list,
        node_map: dict[str, SkillNode] | None = None,
    ) -> list[str]:
        """
        Kahn's algorithm for topological sorting.
        When multiple nodes have in_degree=0, prioritize by:
        1. Lower difficulty first (foundational skills before advanced ones)
        2. Alphabetical ID as tiebreaker
        """
        adj = defaultdict(list)
        in_degree = defaultdict(int)

        for edge in edges:
            if edge.type == "PREREQUISITE_OF" and edge.from_id in node_ids and edge.to_id in node_ids:
                adj[edge.from_id].append(edge.to_id)
                in_degree[edge.to_id] += 1

        def sort_key(nid: str) -> tuple:
            if node_map and nid in node_map:
                return (node_map[nid].difficulty, nid)
            return (0.5, nid)

        # Initialize queue with nodes having no prerequisites
        queue = [nid for nid in node_ids if in_degree[nid] == 0]
        queue.sort(key=sort_key)
        result = []

        while queue:
            node = queue.pop(0)
            result.append(node)
            for neighbor in adj[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
            queue.sort(key=sort_key)

        # Add any remaining nodes (in case of cycles)
        remaining = node_ids - set(result)
        result.extend(sorted(remaining))

        return result

    def _calculate_concurrent_groups(self, node_ids: set[str], edges: list) -> list[list[str]]:
        """
        Group skills by topological depth level.
        Skills at the same depth can be learned in parallel.
        """
        # Build prerequisite graph within path nodes
        prereq_of: dict[str, set[str]] = defaultdict(set)
        for edge in edges:
            if edge.type == "PREREQUISITE_OF" and edge.from_id in node_ids and edge.to_id in node_ids:
                prereq_of[edge.to_id].add(edge.from_id)

        # Calculate depth for each node (longest path from any root)
        depths: dict[str, int] = {}

        def get_depth(nid: str) -> int:
            if nid in depths:
                return depths[nid]
            prereqs = prereq_of.get(nid, set())
            if not prereqs:
                depths[nid] = 0
                return 0
            depth = max(get_depth(p) for p in prereqs) + 1
            depths[nid] = depth
            return depth

        for nid in node_ids:
            get_depth(nid)

        # Group by depth
        depth_groups: dict[int, list[str]] = defaultdict(list)
        for nid, d in sorted(depths.items(), key=lambda x: x[1]):
            depth_groups[d].append(nid)

        return [group for _, group in sorted(depth_groups.items()) if len(group) > 0]

    async def _augment_graph(self, unmatched_skills: list) -> None:
        """Use AI to create missing skills in the graph."""
        try:
            existing_skills = await self.graph.get_full_graph(limit=100)
            existing_names = [s.name for s in existing_skills.nodes]
            new_names = [s.name for s in unmatched_skills]

            system_prompt = self._augmentation_prompt.replace(
                "{existing_skills}", ", ".join(existing_names[:50])
            ).replace("{new_skill_names}", ", ".join(new_names))

            result = await self.ai.complete_json(
                system_prompt=system_prompt,
                user_prompt=f"Evaluate these skills for addition to the graph: {', '.join(new_names)}",
            )

            # Create new skill nodes
            for skill_data in result.get("new_skills", []):
                from app.schemas.skill import SkillCreate
                skill_create = SkillCreate(
                    name=skill_data["name"],
                    name_ko=skill_data.get("name_ko", skill_data["name"]),
                    category=skill_data.get("category", "tool"),
                    difficulty=skill_data.get("difficulty", 0.5),
                    market_demand=skill_data.get("market_demand", 0.5),
                    estimated_hours=skill_data.get("estimated_hours", 40),
                    description=skill_data.get("description", ""),
                    source="ai_generated",
                )
                await self.graph.create_skill(skill_create)

            # Create new relationships
            for rel_data in result.get("new_relationships", []):
                from app.schemas.skill import RelationshipCreate
                # Need to find IDs by name
                from_skills = await self.graph.get_skills_by_names([rel_data["from_skill"]])
                to_skills = await self.graph.get_skills_by_names([rel_data["to_skill"]])
                if from_skills and to_skills:
                    rel = RelationshipCreate(
                        from_id=from_skills[0].id,
                        to_id=to_skills[0].id,
                        type=rel_data.get("type", "RELATED_TO"),
                        strength=rel_data.get("strength", 0.5),
                    )
                    await self.graph.create_relationship(rel)

            logger.info(f"Graph augmented with {len(result.get('new_skills', []))} skills")

        except AIServiceError as e:
            logger.warning(f"Graph augmentation failed, continuing with existing graph: {e}")

    async def _generate_explanations(
        self, skill_ids: list[str], subgraph: SubGraph, job_title: str
    ) -> dict[str, dict]:
        """Generate AI explanations for all path skills in a single API call."""
        node_map = {n.id: n for n in subgraph.nodes}
        explanations = {}

        valid_ids = [sid for sid in skill_ids if sid in node_map]
        if not valid_ids:
            return explanations

        skill_names = [node_map[sid].name for sid in valid_ids]
        system_prompt = self._explanation_prompt.replace("{job_title}", job_title)
        user_prompt = (
            f"Generate explanations for these skills in the learning path:\n"
            f"{', '.join(skill_names)}\n\nSkill IDs: {', '.join(valid_ids)}"
        )

        try:
            result = await self.ai.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.6,
                max_tokens=8000,
            )
            for exp in result.get("explanations", []):
                explanations[exp["skill_id"]] = {
                    "why_needed": exp.get("why_needed", ""),
                    "job_relevance": exp.get("job_relevance", ""),
                    "connection_to_next": exp.get("connection_to_next", ""),
                }
        except AIServiceError:
            logger.warning("Explanation generation failed, using empty explanations")
            for sid in valid_ids:
                explanations[sid] = {
                    "why_needed": "",
                    "job_relevance": "",
                    "connection_to_next": "",
                }

        return explanations

    async def generate_explanation_for_skill(
        self, skill_id: str, job_title: str, skill_name: str
    ) -> dict[str, str]:
        """Generate explanation for a single skill on-demand (lazy loading)."""
        system_prompt = self._explanation_prompt.replace("{job_title}", job_title)
        user_prompt = (
            f"Generate explanations for these skills in the learning path:\n"
            f"{skill_name}\n\nSkill IDs: {skill_id}"
        )
        try:
            result = await self.ai.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.6,
            )
            for exp in result.get("explanations", []):
                if exp.get("skill_id") == skill_id:
                    return {
                        "why_needed": exp.get("why_needed", ""),
                        "job_relevance": exp.get("job_relevance", ""),
                        "connection_to_next": exp.get("connection_to_next", ""),
                    }
        except AIServiceError:
            logger.warning(f"On-demand explanation failed for {skill_id}")

        return {"why_needed": "설명을 생성할 수 없습니다.", "job_relevance": "", "connection_to_next": ""}

    def _apply_explanations(self, path: GeneratedPath, explanations: dict) -> GeneratedPath:
        """Apply generated explanations to path nodes (immutable)."""
        updated_nodes = []
        for node in path.nodes:
            exp = explanations.get(
                node.id,
                {"why_needed": "", "job_relevance": "", "connection_to_next": ""},
            )
            updated_nodes.append(PathNode(
                **{**node.model_dump(), "explanation": exp}
            ))
        return GeneratedPath(nodes=updated_nodes, edges=path.edges, metadata=path.metadata)

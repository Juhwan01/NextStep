from typing import Optional
from neo4j import AsyncDriver
import uuid

from app.schemas.skill import (
    SkillNode, SkillCreate, Relationship, RelationshipCreate,
    Category, SubGraph,
)


class GraphService:
    def __init__(self, neo4j_driver: AsyncDriver) -> None:
        self.driver = neo4j_driver

    async def get_skill(self, skill_id: str) -> Optional[SkillNode]:
        """Fetch a single skill node by ID."""
        query = "MATCH (s:Skill {id: $id}) RETURN s"
        async with self.driver.session() as session:
            result = await session.run(query, id=skill_id)
            record = await result.single()
            if record:
                return SkillNode(**dict(record["s"]))
            return None

    async def search_skills(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> list[SkillNode]:
        """Full-text search on skill names."""
        cypher = """
        MATCH (s:Skill)
        WHERE toLower(s.name) CONTAINS toLower($query)
           OR toLower(s.name_ko) CONTAINS toLower($query)
        """
        if category:
            cypher += " AND s.category = $category"
        cypher += " RETURN s LIMIT $limit"

        params: dict = {"query": query, "limit": limit}
        if category:
            params["category"] = category

        async with self.driver.session() as session:
            result = await session.run(cypher, **params)
            records = await result.data()
            return [SkillNode(**record["s"]) for record in records]

    async def get_skill_prerequisites(
        self, skill_id: str, depth: int = 5
    ) -> list[SkillNode]:
        """Get all prerequisites recursively up to depth."""
        query = (
            "MATCH (target:Skill {id: $id})"
            "<-[:PREREQUISITE_OF*1.." + str(depth) + "]-(prereq:Skill) "
            "RETURN DISTINCT prereq"
        )
        async with self.driver.session() as session:
            result = await session.run(query, id=skill_id)
            records = await result.data()
            return [SkillNode(**record["prereq"]) for record in records]

    async def get_skills_by_ids(self, skill_ids: list[str]) -> list[SkillNode]:
        """Batch fetch skills by IDs."""
        query = "MATCH (s:Skill) WHERE s.id IN $ids RETURN s"
        async with self.driver.session() as session:
            result = await session.run(query, ids=skill_ids)
            records = await result.data()
            return [SkillNode(**record["s"]) for record in records]

    async def get_skills_by_names(self, names: list[str]) -> list[SkillNode]:
        """Match skills by name (case-insensitive)."""
        query = """
        MATCH (s:Skill)
        WHERE toLower(s.name) IN $names OR toLower(s.name_ko) IN $names
        RETURN s
        """
        lower_names = [n.lower() for n in names]
        async with self.driver.session() as session:
            result = await session.run(query, names=lower_names)
            records = await result.data()
            return [SkillNode(**record["s"]) for record in records]

    async def find_shortest_path(
        self, from_id: str, to_id: str
    ) -> list[SkillNode]:
        """Find shortest path between two skills."""
        query = """
        MATCH path = shortestPath(
            (start:Skill {id: $from_id})-[:PREREQUISITE_OF|LEADS_TO*]-(end:Skill {id: $to_id})
        )
        RETURN [n IN nodes(path) | n] as path_nodes
        """
        async with self.driver.session() as session:
            result = await session.run(query, from_id=from_id, to_id=to_id)
            record = await result.single()
            if record:
                return [SkillNode(**dict(n)) for n in record["path_nodes"]]
            return []

    async def get_subgraph_for_skills(
        self, skill_ids: list[str], depth: int = 2
    ) -> SubGraph:
        """Get nodes + edges for visualization around given skills."""
        query = (
            "MATCH (s:Skill) WHERE s.id IN $ids "
            "WITH collect(s) as seeds "
            "UNWIND seeds as seed "
            "OPTIONAL MATCH (seed)-[:PREREQUISITE_OF|RELATED_TO|LEADS_TO*0.."
            + str(depth)
            + "]->(related:Skill) "
            "WITH seed, collect(DISTINCT related) as rels "
            "WITH collect(seed) + reduce(acc = [], r IN collect(rels) | acc + r) as all_nodes "
            "UNWIND all_nodes as node "
            "WITH DISTINCT node "
            "WHERE node IS NOT NULL "
            "WITH collect(node) as nodes "
            "UNWIND nodes as n "
            "OPTIONAL MATCH (n)-[r]->(other:Skill) WHERE other IN nodes "
            "WITH nodes, n, r, other "
            "RETURN head(nodes) as _dummy, nodes, "
            "collect(DISTINCT CASE WHEN other IS NOT NULL THEN "
            "{from_id: n.id, to_id: other.id, type: type(r), strength: coalesce(r.strength, 1.0)} END) as edges"
        )
        async with self.driver.session() as session:
            result = await session.run(query, ids=skill_ids)
            record = await result.single()

            nodes: list[SkillNode] = []
            edges: list[Relationship] = []
            if record:
                for n in record["nodes"]:
                    if n is not None:
                        nodes.append(SkillNode(**dict(n)))
                for e in record["edges"]:
                    if e and e.get("from_id") and e.get("to_id"):
                        edges.append(
                            Relationship(
                                from_id=e["from_id"],
                                to_id=e["to_id"],
                                type=e.get("type", "RELATED_TO"),
                                strength=e.get("strength", 1.0),
                            )
                        )
            return SubGraph(nodes=nodes, edges=edges)

    async def get_job_skills(self, job_title: str) -> list[dict]:
        """Get skills required for a job (if job exists in graph)."""
        query = """
        MATCH (j:Job)-[r:REQUIRES_SKILL]->(s:Skill)
        WHERE toLower(j.title) CONTAINS toLower($title)
           OR toLower(j.title_ko) CONTAINS toLower($title)
        RETURN s, r.importance as importance, r.level_needed as level_needed
        ORDER BY r.importance DESC
        """
        async with self.driver.session() as session:
            result = await session.run(query, title=job_title)
            records = await result.data()
            return [
                {
                    "skill": SkillNode(**record["s"]),
                    "importance": record["importance"],
                    "level_needed": record["level_needed"],
                }
                for record in records
            ]

    async def create_skill(self, skill: SkillCreate) -> SkillNode:
        """Create a new skill node."""
        skill_id = (
            f"skill_{skill.name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:6]}"
        )
        query = """
        CREATE (s:Skill {
            id: $id, name: $name, name_ko: $name_ko, category: $category,
            difficulty: $difficulty, market_demand: $market_demand,
            estimated_hours: $estimated_hours, description: $description,
            source: $source, created_at: datetime()
        })
        RETURN s
        """
        async with self.driver.session() as session:
            result = await session.run(query, id=skill_id, **skill.model_dump())
            record = await result.single()
            return SkillNode(**dict(record["s"]))

    ALLOWED_REL_TYPES = {"PREREQUISITE_OF", "RELATED_TO", "PART_OF", "LEADS_TO"}

    async def create_relationship(self, rel: RelationshipCreate) -> bool:
        """Create a relationship between two skills."""
        if rel.type not in self.ALLOWED_REL_TYPES:
            raise ValueError(f"Invalid relationship type: {rel.type}. Allowed: {self.ALLOWED_REL_TYPES}")
        query = (
            "MATCH (a:Skill {id: $from_id}), (b:Skill {id: $to_id}) "
            f"CREATE (a)-[r:{rel.type} {{strength: $strength, description: $description, "
            "source: 'admin', created_at: datetime()}]->(b) "
            "RETURN r"
        )
        async with self.driver.session() as session:
            result = await session.run(
                query,
                from_id=rel.from_id,
                to_id=rel.to_id,
                strength=rel.strength,
                description=rel.description or "",
            )
            record = await result.single()
            return record is not None

    async def delete_skill(self, skill_id: str) -> bool:
        """Delete a skill and all its relationships."""
        query = """
        MATCH (s:Skill {id: $id})
        DETACH DELETE s
        RETURN count(s) as deleted
        """
        async with self.driver.session() as session:
            result = await session.run(query, id=skill_id)
            record = await result.single()
            return bool(record and record["deleted"] > 0)

    async def get_all_categories(self) -> list[Category]:
        """Get all category nodes."""
        query = "MATCH (c:Category) RETURN c ORDER BY c.name"
        async with self.driver.session() as session:
            result = await session.run(query)
            records = await result.data()
            return [Category(**record["c"]) for record in records]

    async def get_full_graph(self, limit: int = 200) -> SubGraph:
        """Get the entire graph for admin visualization (limited)."""
        query = """
        MATCH (s:Skill)
        WITH s LIMIT $limit
        OPTIONAL MATCH (s)-[r]->(other:Skill)
        RETURN collect(DISTINCT s) as nodes,
               collect(DISTINCT {from_id: s.id, to_id: other.id, type: type(r),
                                 strength: coalesce(r.strength, 1.0)}) as edges
        """
        async with self.driver.session() as session:
            result = await session.run(query, limit=limit)
            record = await result.single()
            nodes = [SkillNode(**dict(n)) for n in (record["nodes"] or [])]
            edges = [
                Relationship(
                    from_id=e["from_id"],
                    to_id=e["to_id"],
                    type=e["type"],
                    strength=e["strength"],
                )
                for e in (record["edges"] or [])
                if e.get("from_id") and e.get("to_id")
            ]
            return SubGraph(nodes=nodes, edges=edges)

    async def merge_skill(
        self, name: str, properties: dict
    ) -> tuple[SkillNode, bool]:
        """Create skill if not exists, return (skill, was_created)."""
        skill_id = (
            f"skill_{name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:6]}"
        )
        query = """
        MERGE (s:Skill {name: $name})
        ON CREATE SET s.id = $id, s.name_ko = $name_ko, s.category = $category,
                      s.difficulty = $difficulty, s.market_demand = $market_demand,
                      s.estimated_hours = $estimated_hours, s.description = $description,
                      s.source = $source, s.created_at = datetime()
        RETURN s, s.id = $id as was_created
        """
        params = {"id": skill_id, "name": name, **properties}
        async with self.driver.session() as session:
            result = await session.run(query, **params)
            record = await result.single()
            return SkillNode(**dict(record["s"])), bool(record["was_created"])

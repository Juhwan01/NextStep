import logging
from difflib import SequenceMatcher
from pathlib import Path

from app.services.ai_service import AIService, AIServiceError
from app.services.graph_service import GraphService
from app.schemas.ai import JobInterpretation, SkillRequirement

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "job_interpretation.txt"


class JobInterpreterService:
    """Interprets free-text job input into structured skill requirements.

    Uses graph context injection: the full skill catalog is included in the
    prompt so the AI selects from known skills rather than hallucinating.
    """

    def __init__(self, ai_service: AIService, graph_service: GraphService):
        self.ai_service = ai_service
        self.graph_service = graph_service
        self._prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    async def interpret(self, job_input: str) -> JobInterpretation:
        """
        1. Load skill catalog from Neo4j
        2. Inject into prompt
        3. AI selects from known skills
        """
        if not job_input or not job_input.strip():
            raise ValueError("Job input cannot be empty")
        if len(job_input) > 500:
            raise ValueError("Job input too long (max 500 characters)")

        # Inject graph context into prompt
        skill_catalog = await self.graph_service.serialize_for_prompt()
        system_prompt = self._prompt_template.replace("{skill_catalog}", skill_catalog)

        result = await self.ai_service.complete_json(
            system_prompt=system_prompt,
            user_prompt=f"사용자 입력: {job_input}",
            temperature=0,
        )

        return JobInterpretation(
            title=result.get("title", job_input),
            title_ko=result.get("title_ko", job_input),
            industry=result.get("industry", "tech"),
            required_skills=[SkillRequirement(**s) for s in result.get("required_skills", [])],
            optional_skills=[SkillRequirement(**s) for s in result.get("optional_skills", [])],
            experience_level=result.get("experience_level", "entry"),
            summary=result.get("summary", ""),
        )

    async def match_to_graph(self, interpretation: JobInterpretation) -> dict:
        """
        Match interpreted skills against existing graph nodes.

        Since the AI now selects from the catalog, most skills should match
        exactly. Fuzzy matching is kept as a safety net.

        Returns: {"matched": [...], "unmatched": [...]}
        """
        existing_skills = await self.graph_service.get_full_graph(limit=300)
        all_existing = existing_skills.nodes

        # Build lookup maps
        name_map: dict[str, object] = {}
        for skill in all_existing:
            name_map[skill.name.lower()] = skill
            name_map[skill.name_ko.lower()] = skill

        matched = []
        unmatched = []
        matched_ids: set[str] = set()

        for skill_req in interpretation.required_skills + interpretation.optional_skills:
            graph_skill = self._find_best_match(skill_req.name, name_map, all_existing)
            if graph_skill and graph_skill.id not in matched_ids:
                matched.append({"requirement": skill_req, "graph_node": graph_skill})
                matched_ids.add(graph_skill.id)
            elif graph_skill is None:
                unmatched.append(skill_req)

        logger.info(f"Graph match: {len(matched)} matched, {len(unmatched)} unmatched")
        return {"matched": matched, "unmatched": unmatched}

    def _find_best_match(self, req_name: str, name_map: dict, all_skills: list) -> object | None:
        """Find the best matching skill. Exact match first, then fuzzy."""
        lower_name = req_name.lower().strip()

        # 1. Exact match (primary — AI should produce these with graph context)
        if lower_name in name_map:
            return name_map[lower_name]

        # 2. Fuzzy match as safety net (threshold >= 0.8, stricter than before)
        best_score = 0.0
        best_skill = None
        for skill in all_skills:
            for candidate in [skill.name.lower(), skill.name_ko.lower()]:
                score = SequenceMatcher(None, lower_name, candidate).ratio()
                if score > best_score:
                    best_score = score
                    best_skill = skill

        if best_score >= 0.8:
            logger.info(f"Fuzzy matched '{req_name}' -> '{best_skill.name}' (score={best_score:.2f})")
            return best_skill

        logger.warning(f"No match found for '{req_name}' (best fuzzy: {best_score:.2f})")
        return None

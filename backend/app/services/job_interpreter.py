import logging
from pathlib import Path

from app.services.ai_service import AIService, AIServiceError
from app.services.graph_service import GraphService
from app.schemas.ai import JobInterpretation, SkillRequirement

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "job_interpretation.txt"


class JobInterpreterService:
    """Interprets free-text job input into structured skill requirements."""

    def __init__(self, ai_service: AIService, graph_service: GraphService):
        self.ai_service = ai_service
        self.graph_service = graph_service
        self._system_prompt = PROMPT_PATH.read_text(encoding="utf-8")

    async def interpret(self, job_input: str) -> JobInterpretation:
        """
        1. Validate input
        2. Send to OpenAI
        3. Parse structured response
        """
        if not job_input or not job_input.strip():
            raise ValueError("Job input cannot be empty")
        if len(job_input) > 500:
            raise ValueError("Job input too long (max 500 characters)")

        result = await self.ai_service.complete_json(
            system_prompt=self._system_prompt,
            user_prompt=f"User input: {job_input}",
            temperature=0.5,
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
        Returns: {"matched": [...], "unmatched": [...]}
        """
        all_skill_names = [s.name for s in interpretation.required_skills + interpretation.optional_skills]

        existing_skills = await self.graph_service.get_skills_by_names(all_skill_names)
        existing_names = {s.name.lower() for s in existing_skills}

        matched = []
        unmatched = []

        for skill_req in interpretation.required_skills + interpretation.optional_skills:
            if skill_req.name.lower() in existing_names:
                graph_skill = next(s for s in existing_skills if s.name.lower() == skill_req.name.lower())
                matched.append({"requirement": skill_req, "graph_node": graph_skill})
            else:
                unmatched.append(skill_req)

        return {"matched": matched, "unmatched": unmatched}

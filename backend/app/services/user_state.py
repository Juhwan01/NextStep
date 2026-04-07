import logging
from pathlib import Path

from app.services.ai_service import AIService
from app.schemas.ai import UserAssessment, SkillAssessment, JobInterpretation

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "user_assessment.txt"


class UserStateService:
    """Assesses user's current skill levels from free-text description."""

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self._system_prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    async def assess(
        self,
        current_state: str,
        job_interpretation: JobInterpretation,
        available_skill_names: list[str],
    ) -> UserAssessment:
        """
        1. Build prompt with target skills
        2. Send to OpenAI
        3. Parse assessment
        """
        if not current_state or not current_state.strip():
            # Default: assume complete beginner
            return UserAssessment(
                assessed_skills=[],
                overall_level="beginner",
                starting_point_ids=[],
                summary="No current state provided. Assuming beginner level.",
            )

        target_skills = ", ".join(available_skill_names[:30])  # Limit to prevent token overflow
        system_prompt = self._system_prompt_template.replace("{target_skills}", target_skills)

        result = await self.ai_service.complete_json(
            system_prompt=system_prompt,
            user_prompt=f"User's current state: {current_state}",
            temperature=0.3,  # Lower temperature for more consistent assessments
        )

        assessed_skills = [
            SkillAssessment(**s) for s in result.get("assessed_skills", [])
        ]

        return UserAssessment(
            assessed_skills=assessed_skills,
            overall_level=result.get("overall_level", "beginner"),
            starting_point_ids=[],  # Will be filled by PathGenerator
            summary=result.get("summary", ""),
        )

    def determine_start_nodes(
        self, assessment: UserAssessment, skill_id_map: dict[str, str]
    ) -> list[str]:
        """
        Determine which skills the user can skip (already knows)
        and which are good starting points.

        Returns list of skill IDs where user should START learning
        (skills they don't yet know but whose prerequisites they've met).
        """
        known_skills = set()
        for assessed in assessment.assessed_skills:
            if assessed.proficiency >= 0.5:  # Intermediate or above
                skill_name_lower = assessed.skill_name.lower()
                if skill_name_lower in skill_id_map:
                    known_skills.add(skill_id_map[skill_name_lower])

        return list(known_skills)

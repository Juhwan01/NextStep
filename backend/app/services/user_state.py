import logging
from pathlib import Path

from app.services.ai_service import AIService
from app.services.graph_service import GraphService
from app.schemas.ai import UserAssessment, SkillAssessment, JobInterpretation

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "user_assessment.txt"


class UserStateService:
    """Assesses user's current skill levels with full graph context.

    The skill tree (nodes + prerequisites + difficulty) is injected into
    the prompt so the AI can make accurate assessments based on prerequisite
    chains (e.g., "knows React" implies "knows JavaScript").
    """

    def __init__(self, ai_service: AIService, graph_service: GraphService | None = None):
        self.ai_service = ai_service
        self.graph_service = graph_service
        self._prompt_template = PROMPT_PATH.read_text(encoding="utf-8")

    async def assess(
        self,
        current_state: str,
        job_interpretation: JobInterpretation,
        available_skill_names: list[str],
    ) -> UserAssessment:
        """
        1. Load full skill tree from Neo4j
        2. Inject into prompt alongside target skills
        3. AI assesses with prerequisite-aware reasoning
        """
        if not current_state or not current_state.strip():
            return UserAssessment(
                assessed_skills=[],
                overall_level="beginner",
                starting_point_ids=[],
                summary="현재 상태가 입력되지 않았습니다. 입문자로 간주합니다.",
            )

        # Inject full skill tree context
        skill_tree = ""
        if self.graph_service:
            skill_tree = await self.graph_service.serialize_for_prompt()

        target_skills = ", ".join(available_skill_names)
        system_prompt = (
            self._prompt_template
            .replace("{skill_tree}", skill_tree)
            .replace("{target_skills}", target_skills)
        )

        result = await self.ai_service.complete_json(
            system_prompt=system_prompt,
            user_prompt=f"사용자의 현재 상태: {current_state}",
            temperature=0,
        )

        assessed_skills = [
            SkillAssessment(**s) for s in result.get("assessed_skills", [])
        ]

        return UserAssessment(
            assessed_skills=assessed_skills,
            overall_level=result.get("overall_level", "beginner"),
            starting_point_ids=[],
            summary=result.get("summary", ""),
        )

    async def propagate_prerequisites(
        self, assessment: UserAssessment
    ) -> UserAssessment:
        """Post-process AI assessment using graph prerequisite propagation.

        If the user knows a skill (proficiency >= 0.5), all its prerequisites
        are automatically raised to at least the same level. This prevents
        logical contradictions like "knows React but not JavaScript".
        """
        if not self.graph_service:
            return assessment

        graph = await self.graph_service.get_full_graph(limit=300)

        # Build prerequisite map: skill_name → [prerequisite_names]
        id_to_name = {n.id: n.name.lower() for n in graph.nodes}
        prereq_map: dict[str, list[str]] = {}  # target → [prerequisites]
        for e in graph.edges:
            if e.type == "PREREQUISITE_OF":
                target_name = id_to_name.get(e.to_id)
                prereq_name = id_to_name.get(e.from_id)
                if target_name and prereq_name:
                    prereq_map.setdefault(target_name, []).append(prereq_name)

        # Build proficiency lookup from AI assessment
        proficiency = {a.skill_name.lower(): a.proficiency for a in assessment.assessed_skills}

        # Propagate: if user knows a skill, all prerequisites get at least that level
        changed = True
        while changed:
            changed = False
            for skill_name, prereqs in prereq_map.items():
                skill_prof = proficiency.get(skill_name, 0.0)
                if skill_prof < 0.5:
                    continue
                for prereq_name in prereqs:
                    current = proficiency.get(prereq_name, 0.0)
                    if current < skill_prof:
                        proficiency[prereq_name] = skill_prof
                        changed = True

        # Rebuild assessed_skills with propagated values
        existing_names = {a.skill_name.lower() for a in assessment.assessed_skills}
        updated_skills = []
        for a in assessment.assessed_skills:
            new_prof = proficiency.get(a.skill_name.lower(), a.proficiency)
            status = (
                "expert" if new_prof >= 0.8 else
                "advanced" if new_prof >= 0.6 else
                "intermediate" if new_prof >= 0.4 else
                "beginner" if new_prof >= 0.2 else "unknown"
            )
            updated_skills.append(SkillAssessment(
                skill_name=a.skill_name,
                proficiency=new_prof,
                status=status,
                evidence=a.evidence if new_prof == a.proficiency else f"{a.evidence} (선행관계 전파로 상향)",
            ))

        # Add prerequisite skills not originally assessed by AI
        for name, prof in proficiency.items():
            if name not in existing_names and prof >= 0.5:
                updated_skills.append(SkillAssessment(
                    skill_name=name,
                    proficiency=prof,
                    status="intermediate" if prof < 0.6 else "advanced",
                    evidence="선행관계 전파: 상위 스킬 숙련도 기반 자동 판정",
                ))

        return UserAssessment(
            assessed_skills=updated_skills,
            overall_level=assessment.overall_level,
            starting_point_ids=assessment.starting_point_ids,
            summary=assessment.summary,
        )

    def determine_start_nodes(
        self, assessment: UserAssessment, skill_id_map: dict[str, str]
    ) -> list[str]:
        """
        Determine which skills the user can skip (already knows).
        Returns list of skill IDs the user has mastered (proficiency >= 0.5).
        """
        known_skills = set()
        for assessed in assessment.assessed_skills:
            if assessed.proficiency >= 0.5:
                skill_name_lower = assessed.skill_name.lower()
                if skill_name_lower in skill_id_map:
                    known_skills.add(skill_id_map[skill_name_lower])

        return list(known_skills)

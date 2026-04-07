import logging
from difflib import SequenceMatcher
from pathlib import Path

from app.services.ai_service import AIService, AIServiceError
from app.services.graph_service import GraphService
from app.schemas.ai import JobInterpretation, SkillRequirement

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "job_interpretation.txt"

# Common aliases: key = alias (lowercase), value = canonical name (lowercase)
SKILL_ALIASES: dict[str, str] = {
    "react.js": "react",
    "reactjs": "react",
    "vue": "vue.js",
    "vuejs": "vue.js",
    "next": "next.js",
    "nextjs": "next.js",
    "js": "javascript",
    "ts": "typescript",
    "node": "node.js",
    "nodejs": "node.js",
    "express": "node.js",
    "expressjs": "node.js",
    "postgres": "postgresql",
    "pg": "postgresql",
    "mysql": "sql",
    "mongo": "mongodb",
    "k8s": "kubernetes",
    "kube": "kubernetes",
    "tf": "terraform",
    "ansible": "ansible",
    "py": "python",
    "golang": "go",
    "spring": "spring boot",
    "springboot": "spring boot",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "dl": "deep learning",
    "ml": "scikit-learn",
    "machine learning": "scikit-learn",
    "rn": "react native",
    "react-native": "react native",
    "tailwind": "css frameworks",
    "tailwindcss": "css frameworks",
    "bootstrap": "css frameworks",
    "styled-components": "css frameworks",
    "redux": "state management",
    "zustand": "state management",
    "kafka": "message queues",
    "rabbitmq": "message queues",
    "ci/cd": "ci/cd",
    "github actions": "ci/cd",
    "jenkins": "ci/cd",
    "rest": "http/rest",
    "restful": "http/rest",
    "rest api": "http/rest",
    "graphql": "graphql",
    "grpc": "grpc",
}


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
        Match interpreted skills against existing graph nodes using fuzzy matching.
        Returns: {"matched": [...], "unmatched": [...]}

        Matching strategy (in priority order):
        1. Exact name match (case-insensitive)
        2. Alias lookup (e.g., "React.js" -> "React")
        3. Fuzzy match via SequenceMatcher (threshold >= 0.75)
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

        return {"matched": matched, "unmatched": unmatched}

    def _find_best_match(self, req_name: str, name_map: dict, all_skills: list) -> object | None:
        """Find the best matching skill using alias, exact, then fuzzy matching."""
        lower_name = req_name.lower().strip()

        # 1. Exact match
        if lower_name in name_map:
            return name_map[lower_name]

        # 2. Alias lookup
        alias_target = SKILL_ALIASES.get(lower_name)
        if alias_target and alias_target in name_map:
            return name_map[alias_target]

        # 3. Fuzzy match (SequenceMatcher, threshold >= 0.75)
        best_score = 0.0
        best_skill = None
        for skill in all_skills:
            for candidate in [skill.name.lower(), skill.name_ko.lower()]:
                score = SequenceMatcher(None, lower_name, candidate).ratio()
                if score > best_score:
                    best_score = score
                    best_skill = skill

        if best_score >= 0.75:
            logger.info(f"Fuzzy matched '{req_name}' -> '{best_skill.name}' (score={best_score:.2f})")
            return best_skill

        return None

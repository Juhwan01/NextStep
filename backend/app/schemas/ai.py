from pydantic import BaseModel
from typing import Optional


class SkillRequirement(BaseModel):
    name: str
    name_ko: str
    importance: float  # 0.0 - 1.0
    category: str
    description: str
    difficulty: float  # 0.0 - 1.0


class JobInterpretation(BaseModel):
    title: str
    title_ko: str
    industry: str
    required_skills: list[SkillRequirement]
    optional_skills: list[SkillRequirement] = []
    experience_level: str  # "entry" | "mid" | "senior"
    summary: str


class SkillAssessment(BaseModel):
    skill_name: str
    proficiency: float  # 0.0 - 1.0
    status: str  # "unknown" | "beginner" | "intermediate" | "advanced" | "expert"
    evidence: str


class UserAssessment(BaseModel):
    assessed_skills: list[SkillAssessment]
    overall_level: str  # "beginner" | "intermediate" | "advanced"
    starting_point_ids: list[str] = []
    summary: str


class SkillExplanation(BaseModel):
    skill_id: str
    why_needed: str
    job_relevance: str
    connection_to_next: str


class GraphAugmentationResult(BaseModel):
    new_skills: list[dict]
    new_relationships: list[dict]

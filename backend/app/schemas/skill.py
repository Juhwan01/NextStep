from pydantic import BaseModel, ConfigDict
from typing import Optional


class SkillNode(BaseModel):
    id: str
    name: str
    name_ko: str
    category: str
    difficulty: float  # 0.0 - 1.0
    market_demand: float  # 0.0 - 1.0
    estimated_hours: int
    description: str
    source: str  # "core" | "ai_generated" | "admin"


class SkillCreate(BaseModel):
    name: str
    name_ko: str
    category: str
    difficulty: float
    market_demand: float
    estimated_hours: int
    description: str
    source: str = "admin"


class SkillSearch(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 20


class Relationship(BaseModel):
    from_id: str
    to_id: str
    type: str  # PREREQUISITE_OF | RELATED_TO | PART_OF | LEADS_TO
    strength: float = 1.0
    description: Optional[str] = None
    source: str = "admin"


class RelationshipCreate(BaseModel):
    from_id: str
    to_id: str
    type: str
    strength: float = 1.0
    description: Optional[str] = None


class Category(BaseModel):
    id: str
    name: str
    name_ko: str
    color: str
    icon: str


class SubGraph(BaseModel):
    nodes: list[SkillNode]
    edges: list[Relationship]
    categories: list[Category] = []

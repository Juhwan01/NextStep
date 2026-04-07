import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PathGenerateRequest(BaseModel):
    job_input: str
    current_state: str


class PathNode(BaseModel):
    id: str
    name: str
    name_ko: str
    category: str
    difficulty: float
    market_demand: float
    estimated_hours: float
    description: str
    status: str
    order: int
    explanation: dict[str, Any]


class PathEdge(BaseModel):
    source: str
    target: str
    type: str
    on_recommended_path: bool
    strength: float


class PathMetadata(BaseModel):
    total_hours: float
    total_nodes: int
    skipped_count: int
    skipped_skills: list[str] = []  # Names of skills user already knows
    path_type: str
    job_title: str
    concurrent_groups: list[list[str]] = []  # Groups of skill IDs learnable in parallel


class GeneratedPath(BaseModel):
    nodes: list[PathNode]
    edges: list[PathEdge]
    metadata: PathMetadata


class DualPath(BaseModel):
    fast_track: GeneratedPath
    fundamentals: GeneratedPath
    shared_graph: dict[str, Any]


class PathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_input: str
    user_state_input: str
    paths: DualPath
    created_at: datetime


class ProgressUpdate(BaseModel):
    status: str

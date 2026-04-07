import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ProgressUpdate(BaseModel):
    skill_node_id: str
    status: Literal["not_started", "in_progress", "completed"]


class ProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    skill_node_id: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    updated_at: datetime

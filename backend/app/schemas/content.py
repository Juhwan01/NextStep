import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.content import ContentType


class ContentCreate(BaseModel):
    skill_node_id: str
    title: str
    url: str
    content_type: ContentType
    provider: str | None = None
    description: str | None = None
    language: str = "ko"
    estimated_minutes: int | None = None
    is_free: bool = True


class ContentUpdate(BaseModel):
    title: str | None = None
    url: str | None = None
    content_type: ContentType | None = None
    provider: str | None = None
    description: str | None = None


class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    skill_node_id: str
    title: str
    url: str
    content_type: ContentType
    provider: str | None
    description: str | None
    language: str
    difficulty: float
    estimated_minutes: int | None
    is_free: bool
    created_at: datetime

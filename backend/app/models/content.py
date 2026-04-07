import enum

from sqlalchemy import Boolean, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ContentType(str, enum.Enum):
    video = "video"
    article = "article"
    course = "course"
    documentation = "documentation"
    tutorial = "tutorial"


class Content(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "content"

    skill_node_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[ContentType] = mapped_column(
        Enum(ContentType, name="contenttype"), nullable=False
    )
    provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="ko")
    difficulty: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

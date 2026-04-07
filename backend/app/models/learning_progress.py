import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ProgressStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class LearningProgress(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "learning_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_paths.id", ondelete="CASCADE"), nullable=False
    )
    skill_node_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[ProgressStatus] = mapped_column(
        Enum(ProgressStatus, name="progressstatus"),
        nullable=False,
        default=ProgressStatus.not_started,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "path_id", "skill_node_id", name="uq_progress_user_path_skill"),
    )

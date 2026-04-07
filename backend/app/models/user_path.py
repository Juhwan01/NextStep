import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class UserPath(Base):
    __tablename__ = "user_paths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    job_input: Mapped[str] = mapped_column(Text, nullable=False)
    user_state_input: Mapped[str] = mapped_column(Text, nullable=False)
    job_interpreted: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    user_state_assessed: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    path_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_user_paths_user_id", "user_id"),
    )

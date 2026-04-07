"""initial tables

Revision ID: 001
Revises:
Create Date: 2026-04-07 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- Enums (raw SQL with DO block to avoid metadata conflicts) ---
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('user', 'admin');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """))
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE progressstatus AS ENUM ('not_started', 'in_progress', 'completed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """))
    op.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE contenttype AS ENUM ('video', 'article', 'course', 'documentation', 'tutorial');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """))

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column(
            "role",
            postgresql.ENUM("user", "admin", name="userrole", create_type=False),
            nullable=False,
            server_default="user",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- user_paths ---
    op.create_table(
        "user_paths",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("job_input", sa.Text, nullable=False),
        sa.Column("user_state_input", sa.Text, nullable=False),
        sa.Column("job_interpreted", postgresql.JSONB, nullable=True),
        sa.Column("user_state_assessed", postgresql.JSONB, nullable=True),
        sa.Column("path_data", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="SET NULL"
        ),
    )
    op.create_index("ix_user_paths_user_id", "user_paths", ["user_id"])

    # --- learning_progress ---
    op.create_table(
        "learning_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("path_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_node_id", sa.String(100), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("not_started", "in_progress", "completed", name="progressstatus", create_type=False),
            nullable=False,
            server_default="not_started",
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["path_id"], ["user_paths.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "path_id", "skill_node_id", name="uq_progress_user_path_skill"
        ),
    )
    op.create_index("ix_learning_progress_user_id", "learning_progress", ["user_id"])

    # --- content ---
    op.create_table(
        "content",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("skill_node_id", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column(
            "content_type",
            postgresql.ENUM("video", "article", "course", "documentation", "tutorial", name="contenttype", create_type=False),
            nullable=False,
        ),
        sa.Column("provider", sa.String(100), nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="ko"),
        sa.Column("difficulty", sa.Float, nullable=False, server_default="0.5"),
        sa.Column("estimated_minutes", sa.Integer, nullable=True),
        sa.Column("is_free", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_content_skill_node_id", "content", ["skill_node_id"])


def downgrade() -> None:
    op.drop_table("content")
    op.drop_table("learning_progress")
    op.drop_table("user_paths")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS contenttype")
    op.execute("DROP TYPE IF EXISTS progressstatus")
    op.execute("DROP TYPE IF EXISTS userrole")

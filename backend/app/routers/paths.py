import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.neo4j import get_neo4j
from app.db.postgresql import get_db
from app.dependencies import get_current_user_optional
from app.models.learning_progress import LearningProgress
from app.models.user import User
from app.models.user_path import UserPath
from app.schemas.path import PathGenerateRequest
from app.schemas.progress import ProgressUpdate
from app.services.ai_service import AIService
from app.services.graph_service import GraphService
from app.services.job_interpreter import JobInterpreterService
from app.services.path_generator import PathGeneratorService
from app.services.user_state import UserStateService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/paths", tags=["paths"])


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_path(
    data: PathGenerateRequest,
    db: AsyncSession = Depends(get_db),
    neo4j=Depends(get_neo4j),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Generate dual learning paths (fast_track + fundamentals) for a job input."""
    ai_service = AIService()
    graph_service = GraphService(neo4j)
    job_interpreter = JobInterpreterService(ai_service, graph_service)
    user_state_service = UserStateService(ai_service, graph_service)
    path_generator = PathGeneratorService(ai_service, graph_service, job_interpreter, user_state_service)

    try:
        dual_path = await path_generator.generate_paths(data.job_input, data.current_state)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Path generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Path generation failed. Please try again.",
        )

    user_path = UserPath(
        user_id=user.id if user else None,
        job_input=data.job_input,
        user_state_input=data.current_state,
        job_interpreted=dual_path.fast_track.metadata.model_dump(),
        user_state_assessed={},
        path_data=dual_path.model_dump(),
    )
    db.add(user_path)
    await db.commit()
    await db.refresh(user_path)

    return {
        "id": str(user_path.id),
        "job_input": user_path.job_input,
        "user_state_input": user_path.user_state_input,
        "paths": dual_path.model_dump(),
        "created_at": user_path.created_at.isoformat(),
    }


@router.get("/mine/list")
async def list_my_paths(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """List all paths for the current user."""
    if not user:
        return {"paths": []}

    result = await db.execute(
        select(UserPath)
        .where(UserPath.user_id == user.id)
        .order_by(UserPath.created_at.desc())
        .limit(20)
    )
    paths = result.scalars().all()

    return {
        "paths": [
            {
                "id": str(p.id),
                "job_input": p.job_input,
                "created_at": p.created_at.isoformat(),
            }
            for p in paths
        ]
    }


@router.get("/{path_id}")
async def get_path(
    path_id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Get a saved path by ID."""
    result = await db.execute(select(UserPath).where(UserPath.id == path_id))
    user_path = result.scalar_one_or_none()
    if not user_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    # Authorization: only owner or anonymous paths can be accessed
    if user_path.user_id and (not user or str(user_path.user_id) != str(user.id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    progress_result = await db.execute(
        select(LearningProgress).where(LearningProgress.path_id == path_id)
    )
    progress_records = progress_result.scalars().all()
    progress_map = {p.skill_node_id: p.status for p in progress_records}

    return {
        "id": str(user_path.id),
        "job_input": user_path.job_input,
        "user_state_input": user_path.user_state_input,
        "paths": user_path.path_data,
        "progress": progress_map,
        "created_at": user_path.created_at.isoformat(),
    }


@router.get("/{path_id}/explain/{skill_id}")
async def explain_skill(
    path_id: str,
    skill_id: str,
    db: AsyncSession = Depends(get_db),
    neo4j=Depends(get_neo4j),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Generate explanation for a single skill on-demand (lazy loading)."""
    result = await db.execute(select(UserPath).where(UserPath.id == path_id))
    user_path = result.scalar_one_or_none()
    if not user_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    # Authorization: only owner or anonymous paths can be accessed
    if user_path.user_id and (not user or str(user_path.user_id) != str(user.id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Find the skill name from path_data
    skill_name = None
    job_title = ""
    path_data = user_path.path_data or {}
    for track in ["fast_track", "fundamentals"]:
        track_data = path_data.get(track, {})
        job_title = track_data.get("metadata", {}).get("job_title", "")
        for node in track_data.get("nodes", []):
            if node.get("id") == skill_id:
                skill_name = node.get("name", "")
                break
        if skill_name:
            break

    # Also check shared_graph nodes
    if not skill_name:
        for node in path_data.get("shared_graph", {}).get("nodes", []):
            if node.get("id") == skill_id:
                skill_name = node.get("name", "")
                break

    if not skill_name:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found in path")

    if not job_title:
        job_title = user_path.job_input

    graph_service = GraphService(neo4j)

    # Check Neo4j cache first
    cached = await graph_service.get_skill_explanations([skill_id])
    if skill_id in cached:
        return {"skill_id": skill_id, "explanation": cached[skill_id]}

    # Generate with AI and cache to Neo4j
    ai_service = AIService()
    job_interpreter = JobInterpreterService(ai_service, graph_service)
    user_state_service = UserStateService(ai_service)
    path_generator = PathGeneratorService(ai_service, graph_service, job_interpreter, user_state_service)

    explanation = await path_generator.generate_explanation_for_skill(skill_id, job_title, skill_name)

    # Save to Neo4j for future requests
    if explanation.get("why_needed"):
        await graph_service.save_skill_explanations({skill_id: explanation})

    return {"skill_id": skill_id, "explanation": explanation}


@router.delete("/{path_id}")
async def delete_path(
    path_id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Delete a saved path and its progress records."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    result = await db.execute(select(UserPath).where(UserPath.id == path_id))
    user_path = result.scalar_one_or_none()
    if not user_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    if not user_path.user_id or str(user_path.user_id) != str(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Delete progress records first
    progress_result = await db.execute(
        select(LearningProgress).where(LearningProgress.path_id == path_id)
    )
    for record in progress_result.scalars().all():
        await db.delete(record)

    await db.delete(user_path)
    await db.commit()
    return {"status": "deleted", "id": path_id}


@router.patch("/{path_id}/progress")
async def update_progress(
    path_id: str,
    data: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Update learning progress for a skill in a path."""
    result = await db.execute(select(UserPath).where(UserPath.id == path_id))
    user_path = result.scalar_one_or_none()
    if not user_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to track progress",
        )

    progress_result = await db.execute(
        select(LearningProgress).where(
            LearningProgress.path_id == path_id,
            LearningProgress.skill_node_id == data.skill_node_id,
            LearningProgress.user_id == user.id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress:
        progress.status = data.status
        if data.status == "in_progress" and not progress.started_at:
            progress.started_at = datetime.now(timezone.utc)
        if data.status == "completed":
            progress.completed_at = datetime.now(timezone.utc)
    else:
        progress = LearningProgress(
            user_id=user.id,
            path_id=path_id,
            skill_node_id=data.skill_node_id,
            status=data.status,
            started_at=datetime.now(timezone.utc) if data.status == "in_progress" else None,
            completed_at=datetime.now(timezone.utc) if data.status == "completed" else None,
        )
        db.add(progress)

    await db.commit()
    return {"status": "updated", "skill_node_id": data.skill_node_id, "new_status": data.status}

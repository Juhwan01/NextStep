from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_graph_service
from app.services.graph_service import GraphService

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/search")
async def search_skills(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    graph: GraphService = Depends(get_graph_service),
):
    """Search skills in the graph."""
    skills = await graph.search_skills(q, category=category, limit=limit)
    return {"skills": [s.model_dump() for s in skills]}


@router.get("/categories")
async def list_categories(graph: GraphService = Depends(get_graph_service)):
    """Get all skill categories."""
    categories = await graph.get_all_categories()
    return {"categories": [c.model_dump() for c in categories]}


@router.get("/{skill_id}")
async def get_skill_detail(
    skill_id: str,
    graph: GraphService = Depends(get_graph_service),
):
    """Get skill details including prerequisites."""
    skill = await graph.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    prerequisites = await graph.get_skill_prerequisites(skill_id, depth=2)

    return {
        "skill": skill.model_dump(),
        "prerequisites": [p.model_dump() for p in prerequisites],
    }

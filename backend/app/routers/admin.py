from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_graph_service, require_admin
from app.models.user import User
from app.schemas.skill import SkillCreate, RelationshipCreate
from app.services.ai_service import AIService
from app.services.graph_service import GraphService

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/skills")
async def create_skill(
    data: SkillCreate,
    graph: GraphService = Depends(get_graph_service),
    admin: User = Depends(require_admin),
):
    """Create a new skill node (admin only)."""
    skill = await graph.create_skill(data)
    return {"skill": skill.model_dump(), "message": "Skill created"}


@router.delete("/skills/{skill_id}")
async def delete_skill(
    skill_id: str,
    graph: GraphService = Depends(get_graph_service),
    admin: User = Depends(require_admin),
):
    """Delete a skill node (admin only)."""
    deleted = await graph.delete_skill(skill_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return {"message": "Skill deleted", "id": skill_id}


@router.post("/relationships")
async def create_relationship(
    data: RelationshipCreate,
    graph: GraphService = Depends(get_graph_service),
    admin: User = Depends(require_admin),
):
    """Create a relationship between skills (admin only)."""
    success = await graph.create_relationship(data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create relationship. Check that both skills exist.",
        )
    return {"message": "Relationship created"}


@router.get("/graph")
async def get_full_graph(
    graph: GraphService = Depends(get_graph_service),
    admin: User = Depends(require_admin),
):
    """Get the full skill graph (admin only)."""
    subgraph = await graph.get_full_graph(limit=300)
    return {
        "nodes": [n.model_dump() for n in subgraph.nodes],
        "edges": [e.model_dump() for e in subgraph.edges],
    }


@router.get("/ai-suggestions")
async def get_ai_suggestions(
    graph: GraphService = Depends(get_graph_service),
    admin: User = Depends(require_admin),
):
    """Get AI-suggested relationships for the graph (admin only)."""
    ai_service = AIService()
    full_graph = await graph.get_full_graph(limit=100)
    skill_names = [s.name for s in full_graph.nodes]

    result = await ai_service.complete_json(
        system_prompt="You are a technology education expert. Analyze the given skill graph and suggest missing relationships that would improve learning path generation. Focus on prerequisite relationships that are commonly needed but missing.",
        user_prompt=(
            f"Current skills in graph: {', '.join(skill_names)}\n\n"
            "Suggest 5-10 missing PREREQUISITE_OF relationships as JSON: "
            "{\"suggestions\": [{\"from_skill\": \"...\", \"to_skill\": \"...\", "
            "\"type\": \"PREREQUISITE_OF\", \"strength\": 0.7, \"reason\": \"...\"}]}"
        ),
    )

    return result

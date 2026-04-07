from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgresql import get_db
from app.dependencies import require_admin
from app.models.content import Content
from app.models.user import User
from app.schemas.content import ContentCreate, ContentResponse, ContentUpdate

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/by-skill/{skill_id}")
async def get_content_by_skill(
    skill_id: str,
    content_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get learning content for a skill."""
    query = select(Content).where(Content.skill_node_id == skill_id)
    if content_type:
        query = query.where(Content.content_type == content_type)
    query = query.order_by(Content.content_type, Content.title)

    result = await db.execute(query)
    contents = result.scalars().all()

    return {
        "contents": [
            ContentResponse.model_validate(c).model_dump()
            for c in contents
        ]
    }


@router.post("/admin", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    data: ContentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a content entry (admin only)."""
    content = Content(**data.model_dump())
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return ContentResponse.model_validate(content)


@router.put("/admin/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: str,
    data: ContentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update a content entry (admin only)."""
    result = await db.execute(select(Content).where(Content.id == content_id))
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(content, key, value)

    await db.commit()
    await db.refresh(content)
    return ContentResponse.model_validate(content)


@router.delete("/admin/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a content entry (admin only)."""
    result = await db.execute(select(Content).where(Content.id == content_id))
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    await db.delete(content)
    await db.commit()

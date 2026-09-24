from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Prompt, Tag
from ..schemas import PromptCreate, PromptOut, PromptUpdate

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


def _resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    result = []
    for raw in names:
        name = raw.strip().lower()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        result.append(tag)
    return result


@router.get("", response_model=list[PromptOut])
def list_prompts(
    q: str | None = Query(None),
    tag: str | None = Query(None),
    category: str | None = Query(None),
    favorite: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Prompt)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Prompt.title.ilike(like),
                Prompt.description.ilike(like),
                Prompt.content.ilike(like),
            )
        )
    if tag:
        query = query.filter(Prompt.tags.any(Tag.name == tag.lower()))
    if category:
        query = query.filter(Prompt.category == category)
    if favorite is not None:
        query = query.filter(Prompt.favorite.is_(favorite))

    return query.order_by(Prompt.updated_at.desc()).all()


@router.post("", response_model=PromptOut, status_code=201)
def create_prompt(payload: PromptCreate, db: Session = Depends(get_db)):
    prompt = Prompt(
        title=payload.title,
        description=payload.description,
        content=payload.content,
        category=payload.category,
        favorite=payload.favorite,
    )
    prompt.tags = _resolve_tags(db, payload.tags)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/{prompt_id}", response_model=PromptOut)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(404, "Prompt not found")
    return prompt


@router.patch("/{prompt_id}", response_model=PromptOut)
def update_prompt(prompt_id: int, payload: PromptUpdate, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(404, "Prompt not found")

    data = payload.model_dump(exclude_unset=True)
    if "tags" in data:
        prompt.tags = _resolve_tags(db, data.pop("tags"))
    for key, value in data.items():
        setattr(prompt, key, value)

    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(404, "Prompt not found")
    db.delete(prompt)
    db.commit()
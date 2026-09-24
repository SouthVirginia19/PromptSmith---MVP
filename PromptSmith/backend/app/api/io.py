from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Prompt, Tag

router = APIRouter(prefix="/api", tags=["io"])


def _resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    result = []
    for raw in names:
        name = (raw or "").strip().lower()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        result.append(tag)
    return result


@router.get("/export")
def export_prompts(db: Session = Depends(get_db)):
    prompts = db.query(Prompt).order_by(Prompt.id).all()
    data = {
        "version": 1,
        "exported_at": datetime.utcnow().isoformat(),
        "count": len(prompts),
        "prompts": [
            {
                "title": p.title,
                "description": p.description or "",
                "content": p.content,
                "category": p.category or "general",
                "favorite": bool(p.favorite),
                "tags": [t.name for t in p.tags],
            }
            for p in prompts
        ],
    }
    filename = f'promptsmith-{datetime.utcnow().strftime("%Y%m%d-%H%M%S")}.json'
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import")
def import_prompts(payload: dict, db: Session = Depends(get_db)):
    if not isinstance(payload, dict) or "prompts" not in payload:
        raise HTTPException(400, "Invalid format: expected {'prompts': [...]}")

    items = payload["prompts"]
    if not isinstance(items, list):
        raise HTTPException(400, "'prompts' must be a list")

    created = 0
    skipped = 0
    errors: list[str] = []

    existing_titles = {row[0].lower() for row in db.query(Prompt.title).all()}

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"item {i}: not an object")
            continue

        title = (item.get("title") or "").strip()
        content = (item.get("content") or "").strip()

        if not title or not content:
            errors.append(f"item {i}: missing title or content")
            continue

        if title.lower() in existing_titles:
            skipped += 1
            continue

        prompt = Prompt(
            title=title,
            description=(item.get("description") or "").strip(),
            content=content,
            category=(item.get("category") or "general").strip(),
            favorite=bool(item.get("favorite", False)),
        )
        prompt.tags = _resolve_tags(db, item.get("tags") or [])
        db.add(prompt)
        existing_titles.add(title.lower())
        created += 1

    db.commit()
    return {
        "created": created,
        "skipped": skipped,
        "errors": errors,
        "total": len(items),
    }
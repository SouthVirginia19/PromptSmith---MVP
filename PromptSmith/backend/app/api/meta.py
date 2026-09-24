from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Prompt, Tag

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/tags", response_model=list[str])
def list_tags(db: Session = Depends(get_db)):
    return [t.name for t in db.query(Tag).order_by(Tag.name).all()]


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Prompt.category).distinct().all()
    return sorted({r[0] for r in rows if r[0]})


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "total_prompts": db.query(Prompt).count(),
        "favorites": db.query(Prompt).filter(Prompt.favorite.is_(True)).count(),
        "tags": db.query(Tag).count(),
    }
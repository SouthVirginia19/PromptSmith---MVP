from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class PromptCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    content: str = Field(..., min_length=1)
    category: str = "general"
    favorite: bool = False
    tags: list[str] = []


class PromptUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    category: str | None = None
    favorite: bool | None = None
    tags: list[str] | None = None


class PromptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    content: str
    category: str
    favorite: bool
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut] = []
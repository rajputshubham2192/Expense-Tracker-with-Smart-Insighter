from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    type: str = "expense"
    icon: Optional[str] = "Tag"
    color: Optional[str] = "#6366f1"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    is_default: bool
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

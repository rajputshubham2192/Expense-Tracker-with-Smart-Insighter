from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Default starter categories to initialize on new user registration
DEFAULT_CATEGORIES = [
    ("Food & Dining", "expense", "Utensils", "#f97316"),
    ("Groceries", "expense", "ShoppingCart", "#10b981"),
    ("Shopping", "expense", "ShoppingBag", "#ec4899"),
    ("Transportation", "expense", "Car", "#3b82f6"),
    ("Bills & Utilities", "expense", "Zap", "#eab308"),
    ("Subscriptions", "expense", "Tv", "#8b5cf6"),
    ("Health & Medical", "expense", "Activity", "#ef4444"),
    ("Housing & Rent", "expense", "Home", "#6366f1"),
    ("Salary / Income", "income", "TrendingUp", "#22c55e"),
    ("Investments", "expense", "Briefcase", "#14b8a6"),
    ("Other", "expense", "Tag", "#64748b")
]

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account, initialize default categories, and issue JWT."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed_pw,
        role="user",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed starter categories for user
    for cat_name, cat_type, icon, color in DEFAULT_CATEGORIES:
        cat = Category(
            name=cat_name,
            type=cat_type,
            icon=icon,
            color=color,
            is_default=True,
            user_id=user.id
        )
        db.add(cat)
    db.commit()

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled.")

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

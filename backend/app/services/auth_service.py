from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User, UserRole


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_jwt(user_id: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_jwt(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

    async def register(self, email: str, password: str, display_name: str) -> tuple[User, str]:
        # Check if email exists
        result = await self.db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            email=email,
            password_hash=self.hash_password(password),
            display_name=display_name,
            role=UserRole.user,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        token = self.create_jwt(str(user.id))
        return user, token

    # Dummy hash for constant-time comparison when user not found (prevents timing attack)
    _DUMMY_HASH = pwd_context.hash("dummy-constant-time-guard")

    async def login(self, email: str, password: str) -> tuple[User, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            # Run hash comparison anyway to prevent timing-based email enumeration
            pwd_context.verify(password, self._DUMMY_HASH)
            raise ValueError("Invalid email or password")
        if not user.password_hash or not self.verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        token = self.create_jwt(str(user.id))
        return user, token

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import httpx
import logging

logger = logging.getLogger("devoracle.auth")
import jwt
from uuid import UUID

from app.core.database import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, RefreshRequest, TokenData

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_current_user(
    token_header: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to retrieve and validate the currently authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = token_header or token_query
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        email = payload.get("email")
        token_type = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
        token_data = TokenData(user_id=UUID(user_id), email=email)
    except (jwt.InvalidTokenError, ValueError):
        raise credentials_exception
        
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if user email already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
    
    # Create new user
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        provider="local"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning access and refresh JWTs."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    # Generate tokens
    user_id_str = str(user.id)
    access_token = create_access_token(data={"user_id": user_id_str, "email": user.email})
    refresh_token = create_refresh_token(data={"user_id": user_id_str, "email": user.email})
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_in: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access and refresh token pair."""
    try:
        payload = decode_token(refresh_in.refresh_token)
        user_id = payload.get("user_id")
        email = payload.get("email")
        token_type = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token."
            )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid refresh token."
        )
        
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
        
    user_id_str = str(user.id)
    access_token = create_access_token(data={"user_id": user_id_str, "email": user.email})
    new_refresh_token = create_refresh_token(data={"user_id": user_id_str, "email": user.email})
    
    return Token(access_token=access_token, refresh_token=new_refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch the authenticated user's profile."""
    return current_user

@router.post("/github", response_model=Token)
async def github_oauth_login(payload: dict, db: Session = Depends(get_db)):
    """
    Exchanges an authorization code from the frontend for a GitHub access token,
    retrieves user details, registers the user if necessary, and returns JWT tokens.
    """
    try:
        code = payload.get("code")
        redirect_uri = payload.get("redirect_uri") or settings.GITHUB_REDIRECT_URI
        if not code:
            raise HTTPException(status_code=400, detail="Missing authorization code.")
            
        async with httpx.AsyncClient() as client:
            # 1. Exchange OAuth code for Access Token
            token_url = "https://github.com/login/oauth/access_token"
            headers = {"Accept": "application/json"}
            data = {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri
            }
            
            # In mock mode, bypass external network requests
            if settings.GITHUB_CLIENT_ID == "dummy_github_id":
                logger.info("Running GitHub OAuth login in MOCK mode.")
                mock_email = "github-developer@example.com"
                mock_name = "GitHub Developer"
                mock_avatar = "https://avatars.githubusercontent.com/u/9919?v=4"
                gh_access_token = "mock_github_token"
            else:
                logger.info(f"Initiating live GitHub OAuth exchange for code with redirect_uri: {redirect_uri}")
                token_resp = await client.post(token_url, headers=headers, data=data)
                if token_resp.status_code != 200:
                    logger.error(f"GitHub token exchange HTTP error {token_resp.status_code}: {token_resp.text}")
                    raise HTTPException(status_code=400, detail="Failed to exchange authorization code with GitHub.")
                    
                token_data = token_resp.json()
                access_token = token_data.get("access_token")
                gh_access_token = access_token
                if not access_token:
                    err_desc = token_data.get('error_description', 'No access token returned.')
                    logger.error(f"GitHub token exchange returned error response: {token_data}")
                    raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {err_desc}")
                    
                # 2. Get User Profile from GitHub API
                user_headers = {
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "DevOracle-AI-Backend"
                }
                user_resp = await client.get("https://api.github.com/user", headers=user_headers)
                if user_resp.status_code != 200:
                    logger.error(f"GitHub user profile fetch HTTP error {user_resp.status_code}: {user_resp.text}")
                    raise HTTPException(status_code=400, detail="Failed to fetch user info from GitHub.")
                    
                gh_profile = user_resp.json()
                mock_name = gh_profile.get("name") or gh_profile.get("login")
                mock_avatar = gh_profile.get("avatar_url")
                mock_email = gh_profile.get("email")
                
                # If email is private, fetch public/private emails list
                if not mock_email:
                    emails_resp = await client.get("https://api.github.com/user/emails", headers=user_headers)
                    if emails_resp.status_code == 200:
                        emails = emails_resp.json()
                        # Find primary email
                        for email_item in emails:
                            if email_item.get("primary"):
                                mock_email = email_item.get("email")
                                break
                                
                if not mock_email:
                    mock_email = f"{gh_profile.get('login')}@users.noreply.github.com"
                    
            # 3. Create or Update User in DB
            logger.info(f"Database sync for GitHub user: email={mock_email}, name={mock_name}")
            user = db.query(User).filter(User.email == mock_email).first()
            if not user:
                user = User(
                    name=mock_name,
                    email=mock_email,
                    avatar_url=mock_avatar,
                    provider="github",
                    github_access_token=gh_access_token
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created new GitHub authenticated user: {user.id}")
            else:
                # Update name, avatar, and token if changed
                user.name = mock_name
                user.avatar_url = mock_avatar
                user.github_access_token = gh_access_token
                db.commit()
                db.refresh(user)
                logger.info(f"Updated existing GitHub authenticated user: {user.id}")
                
            # 4. Generate local JWT tokens
            user_id_str = str(user.id)
            access_token = create_access_token(data={"user_id": user_id_str, "email": user.email})
            refresh_token = create_refresh_token(data={"user_id": user_id_str, "email": user.email})
            
            return Token(access_token=access_token, refresh_token=refresh_token)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception("Unexpected exception during GitHub OAuth execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )

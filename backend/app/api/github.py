from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from typing import List, Dict, Any
import base64

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/github", tags=["GitHub API Integration"])

@router.get("/repos")
async def get_github_repos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch repositories of the currently authenticated GitHub user."""
    github_token = current_user.github_access_token
    if not github_token:
        if settings.GITHUB_CLIENT_ID == "dummy_github_id":
            github_token = "mock_github_token"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not logged in via GitHub or has no access token."
            )

    # In mock mode, return mock repositories
    if github_token == "mock_github_token":
        return [
            {"id": 1, "name": "Vizhi_teams", "full_name": f"{current_user.name}/Vizhi_teams", "owner": {"login": current_user.name}},
            {"id": 2, "name": "DevOracle_AI", "full_name": f"{current_user.name}/DevOracle_AI", "owner": {"login": current_user.name}},
            {"id": 3, "name": "Spoon-Knife", "full_name": "octocat/Spoon-Knife", "owner": {"login": "octocat"}},
        ]

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevOracle-AI-Backend"
        }
        resp = await client.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch repositories from GitHub.")
        
        repos = resp.json()
        simplified = []
        for r in repos:
            simplified.append({
                "id": r.get("id"),
                "name": r.get("name"),
                "full_name": r.get("full_name"),
                "owner": {"login": r.get("owner", {}).get("login")}
            })
        return simplified

@router.get("/repos/{owner}/{repo}/files")
async def get_github_repo_files(
    owner: str,
    repo: str,
    current_user: User = Depends(get_current_user)
):
    """Fetch recursive file tree of the specified repository."""
    github_token = current_user.github_access_token
    if not github_token:
        if settings.GITHUB_CLIENT_ID == "dummy_github_id":
            github_token = "mock_github_token"
        else:
            raise HTTPException(status_code=400, detail="No GitHub access token found.")

    # In mock mode, return mock files
    if github_token == "mock_github_token":
        return [
            {"path": "README.md", "type": "blob"},
            {"path": "package.json", "type": "blob"},
            {"path": "src/App.tsx", "type": "blob"},
            {"path": "src/main.tsx", "type": "blob"},
            {"path": "src/pages/Dashboard.tsx", "type": "blob"},
            {"path": "backend/app/main.py", "type": "blob"},
            {"path": "backend/app/api/auth.py", "type": "blob"},
            {"path": "payments.py", "type": "blob"},
        ]

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevOracle-AI-Backend"
        }
        
        # 1. Fetch default branch
        repo_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_resp = await client.get(repo_url, headers=headers)
        if repo_resp.status_code != 200:
            raise HTTPException(status_code=repo_resp.status_code, detail="Failed to fetch repository details.")
        
        repo_data = repo_resp.json()
        default_branch = repo_data.get("default_branch", "main")

        # 2. Fetch git tree recursively
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        tree_resp = await client.get(tree_url, headers=headers)
        if tree_resp.status_code != 200:
            tree_url_fallback = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
            tree_resp = await client.get(tree_url_fallback, headers=headers)
            if tree_resp.status_code != 200:
                raise HTTPException(status_code=tree_resp.status_code, detail="Failed to fetch repository file tree.")

        tree_data = tree_resp.json()
        files = []
        for item in tree_data.get("tree", []):
            path = item.get("path")
            if item.get("type") == "blob":
                if any(x in path for x in ["node_modules/", ".git/", "dist/", "build/", ".env", "yarn.lock", "package-lock.json", ".png", ".jpg", ".jpeg", ".ico"]):
                    continue
                files.append({
                    "path": path,
                    "type": "blob"
                })
        return files

@router.get("/repos/{owner}/{repo}/files/{path:path}")
async def get_github_file_content(
    owner: str,
    repo: str,
    path: str,
    current_user: User = Depends(get_current_user)
):
    """Fetch text content of a specific file in the repository."""
    github_token = current_user.github_access_token
    if not github_token:
        if settings.GITHUB_CLIENT_ID == "dummy_github_id":
            github_token = "mock_github_token"
        else:
            raise HTTPException(status_code=400, detail="No GitHub access token found.")

    # In mock mode, return mock file content
    if github_token == "mock_github_token":
        if path == "payments.py":
            return {
                "content": "def process_transactions(payments):\n    # BUG: Potential out-of-index if payments list is empty\n    first_payment = payments[0]\n\n    total = 0\n    for p in payments:\n        # BUG: Float accuracy issue during loop addition\n        total += p['amount']\n\n    return total\n"
            }
        return {"content": f"# Content of {path}\n\nprint('Hello from mock {path}!')\n"}

    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevOracle-AI-Backend"
        }
        
        file_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        resp = await client.get(file_url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to fetch file content for {path}.")
            
        data = resp.json()
        encoding = data.get("encoding")
        content_b64 = data.get("content", "")
        
        if encoding == "base64":
            try:
                cleaned_b64 = content_b64.replace("\n", "").replace("\r", "")
                decoded = base64.b64decode(cleaned_b64).decode("utf-8")
                return {"content": decoded}
            except Exception as e:
                raise HTTPException(status_code=500, detail="Failed to decode file content from base64.")
        else:
            return {"content": content_b64}

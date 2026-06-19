import re
import logging
import httpx
import base64
from typing import Dict, Any, List, Optional
from app.core.exceptions import ValidationError, APIException

logger = logging.getLogger("devoracle.github")

class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if token:
            self.headers["Authorization"] = f"token {token}"

    def parse_pr_url(self, pr_url: str) -> Dict[str, Any]:
        """Extract owner, repo, and PR number from GitHub PR URL"""
        pattern = r"https?://github\.com/([^/]+)/([^/]+)/pull/(\d+)"
        match = re.match(pattern, pr_url.strip())
        if not match:
            raise ValidationError("Invalid GitHub Pull Request URL. Format must be: https://github.com/owner/repo/pull/num")
        return {
            "owner": match.group(1),
            "repo": match.group(2),
            "pr_number": int(match.group(3))
        }

    def parse_repo_url(self, repo_url: str) -> Dict[str, Any]:
        """Extract owner and repo from GitHub repository URL"""
        pattern = r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$"
        match = re.match(pattern, repo_url.strip())
        if not match:
            raise ValidationError("Invalid GitHub Repository URL. Format must be: https://github.com/owner/repo")
        return {
            "owner": match.group(1),
            "repo": match.group(2)
        }

    async def fetch_pr_details(self, pr_url: str) -> Dict[str, Any]:
        """Fetch changed files, patch diff, and PR title from GitHub REST API"""
        parsed = self.parse_pr_url(pr_url)
        owner, repo, pr_number = parsed["owner"], parsed["repo"], parsed["pr_number"]
        
        async with httpx.AsyncClient() as client:
            # 1. Fetch general PR information (title)
            pr_info_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
            resp = await client.get(pr_info_url, headers=self.headers)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch PR info: {resp.text}")
                raise APIException(
                    status_code=resp.status_code,
                    detail=f"GitHub API Error: {resp.json().get('message', 'Failed to retrieve PR info.')}",
                    error_code="GITHUB_API_ERROR"
                )
            
            pr_data = resp.json()
            pr_title = pr_data.get("title", f"Pull Request #{pr_number}")
            
            # 2. Fetch files changed in the PR
            files_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
            resp_files = await client.get(files_url, headers=self.headers)
            if resp_files.status_code != 200:
                logger.error(f"Failed to fetch PR files: {resp_files.text}")
                raise APIException(
                    status_code=resp_files.status_code,
                    detail="Failed to retrieve PR changed files list.",
                    error_code="GITHUB_API_ERROR"
                )
            
            files = resp_files.json()
            
            # Filter files (ignore lock files, node_modules, binaries, icons)
            ignored_patterns = [
                r"node_modules/",
                r".*-lock\..*",
                r"package-lock\.json",
                r"yarn\.lock",
                r"pnpm-lock\.yaml",
                r"composer\.lock",
                r"Cargo\.lock",
                r"poetry\.lock",
                r"\.png$", r"\.jpg$", r"\.jpeg$", r"\.gif$", r"\.ico$", r"\.webp$", r"\.svg$",
                r"\.pdf$", r"\.zip$", r"\.tar\.gz$", r"\.tgz$", r"\.rar$"
            ]
            
            filtered_files = []
            full_diff_text = []
            
            for file in files:
                filename = file.get("filename", "")
                is_ignored = any(re.search(pat, filename, re.IGNORECASE) for pat in ignored_patterns)
                if is_ignored:
                    continue
                
                patch = file.get("patch", "")
                if patch:
                    filtered_files.append(filename)
                    full_diff_text.append(f"--- a/{filename}\n+++ b/{filename}\n{patch}")
            
            return {
                "title": pr_title,
                "owner": owner,
                "repo": repo,
                "pr_number": pr_number,
                "changed_files": filtered_files,
                "diff": "\n\n".join(full_diff_text)
            }

    async def fetch_repository_structure(self, repo_url: str) -> Dict[str, Any]:
        """Fetch the folder structure and configuration of a GitHub repository"""
        parsed = self.parse_repo_url(repo_url)
        owner, repo = parsed["owner"], parsed["repo"]
        
        async with httpx.AsyncClient() as client:
            # 1. Fetch directory tree recursively
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
            resp = await client.get(tree_url, headers=self.headers)
            if resp.status_code != 200:
                # Try master branch if main branch fails
                tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
                resp = await client.get(tree_url, headers=self.headers)
                
            if resp.status_code != 200:
                logger.error(f"Failed to fetch repository tree: {resp.text}")
                raise APIException(
                    status_code=resp.status_code,
                    detail=f"GitHub API Error: {resp.json().get('message', 'Failed to retrieve repository tree.')}",
                    error_code="GITHUB_API_ERROR"
                )
            
            tree_data = resp.json()
            tree = tree_data.get("tree", [])
            
            file_paths = []
            ignored_folders = ["node_modules", ".git", ".next", "dist", "build", ".venv", "venv", "libs"]
            
            config_files = {}
            readme_content = ""
            
            for item in tree:
                path = item.get("path", "")
                item_type = item.get("type", "")
                
                # Check if in ignored directory
                if any(folder in path.split("/") for folder in ignored_folders):
                    continue
                
                if item_type == "tree":
                    file_paths.append(f"Directory: {path}/")
                else:
                    file_paths.append(f"File: {path}")
                    
                    filename = path.split("/")[-1]
                    # Fetch README
                    if filename.lower() == "readme.md" and len(readme_content) == 0:
                        readme_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
                        resp_readme = await client.get(readme_url, headers=self.headers)
                        if resp_readme.status_code == 200:
                            readme_data = resp_readme.json()
                            content_b64 = readme_data.get("content", "")
                            try:
                                readme_content = base64.b64decode(content_b64).decode("utf-8")[:1500]
                            except Exception:
                                pass
                    # Fetch select configuration files
                    elif filename in ["package.json", "requirements.txt", "cargo.toml", "pyproject.toml"]:
                        config_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
                        resp_config = await client.get(config_url, headers=self.headers)
                        if resp_config.status_code == 200:
                            config_data = resp_config.json()
                            content_b64 = config_data.get("content", "")
                            try:
                                config_files[filename] = base64.b64decode(content_b64).decode("utf-8")[:1000]
                            except Exception:
                                pass
            
            # Assemble repo overview
            structure_summary = "DIRECTORY TREE:\n" + "\n".join(file_paths[:150])
            if len(file_paths) > 150:
                structure_summary += f"\n... and {len(file_paths) - 150} more files."
                
            if readme_content:
                structure_summary += f"\n\nREADME SUMMARY:\n{readme_content}\n"
                
            for fname, fcontent in config_files.items():
                structure_summary += f"\n\nCONFIGURATION FILE ({fname}):\n{fcontent}\n"
                
            return {
                "owner": owner,
                "repo": repo,
                "structure": structure_summary
            }

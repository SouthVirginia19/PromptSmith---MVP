import time

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api", tags=["profile"])

_cache: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 3600  # 1 hour


async def _fetch_github(username: str) -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=15) as client:
        user_r = await client.get(
            f"https://api.github.com/users/{username}", headers=headers
        )
        if user_r.status_code == 404:
            raise HTTPException(404, f"GitHub user '{username}' not found")
        user_r.raise_for_status()
        user = user_r.json()

        repos_r = await client.get(
            f"https://api.github.com/users/{username}/repos",
            headers=headers,
            params={"per_page": 100, "sort": "updated"},
        )
        repos_r.raise_for_status()
        repos = repos_r.json()

    languages: dict[str, int] = {}
    total_stars = 0
    for r in repos:
        if r.get("language"):
            languages[r["language"]] = languages.get(r["language"], 0) + 1
        total_stars += r.get("stargazers_count", 0)

    top_repos = sorted(
        repos, key=lambda r: r.get("stargazers_count", 0), reverse=True
    )[:3]

    return {
        "user": {
            "login": user["login"],
            "name": user.get("name"),
            "avatar_url": user["avatar_url"],
            "bio": user.get("bio"),
            "location": user.get("location"),
            "company": user.get("company"),
            "blog": user.get("blog"),
            "html_url": user["html_url"],
            "followers": user["followers"],
            "following": user["following"],
            "public_repos": user["public_repos"],
            "created_at": user["created_at"],
        },
        "stats": {
            "total_stars": total_stars,
            "languages": dict(sorted(languages.items(), key=lambda x: -x[1])),
        },
        "top_repos": [
            {
                "name": r["name"],
                "description": r.get("description"),
                "stars": r["stargazers_count"],
                "forks": r["forks_count"],
                "language": r.get("language"),
                "url": r["html_url"],
            }
            for r in top_repos
        ],
    }


@router.get("/profile")
async def profile(username: str = Query("SouthVirginia19")):
    now = time.time()
    cached = _cache.get(username)
    if cached and now - cached[0] < _CACHE_TTL:
        data = dict(cached[1])
        data["cached"] = True
        return data

    data = await _fetch_github(username)
    data["cached"] = False
    _cache[username] = (now, dict(data))
    return data
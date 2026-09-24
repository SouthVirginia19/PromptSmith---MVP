
# ⚒️ PromptSmith

A local-first prompt library with variables, tags, categories, and JSON import/export — built with FastAPI, SQLAlchemy, and vanilla JavaScript.

Store, organize, and reuse your best AI prompts. Wrap variable names in `{curly_braces}` and PromptSmith will turn them into fill-in fields whenever you use the prompt.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.119-009688?style=flat-square&logo=fastapi&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

---

## 📸 Screenshot

> Add a screenshot here after your first run. Drag a PNG into the GitHub README editor — it will upload and insert the correct link automatically.

<!-- ![PromptSmith screenshot](docs/screenshot.png) -->

---

## ✨ Features

- 📝 **Prompt management** — create, edit, delete, favorite
- 🔤 **Variables** — `{name}` placeholders become input fields on use
- 🏷 **Tags & categories** — with icons, counters, and filtering
- 🔍 **Full-text search** — across title, description, and content
- 📤 **Import / Export JSON** — backup, share, or move between machines
- 🎲 **Random prompt** — pull a random one from your library
- 👤 **About tab** — live GitHub profile pulled via REST API
- ⌨️ **Keyboard shortcuts** — `N` new, `R` random, `/` search, `Esc` close
- 🌗 **Dark UI** — GitHub-inspired theme
- 💾 **SQLite storage** — zero-config, file-based persistence

---

## 🛠 Tech Stack

**Backend**
- Python 3.11+
- FastAPI
- SQLAlchemy 2
- Pydantic v2 + pydantic-settings
- httpx
- SQLite

**Frontend**
- Vanilla JavaScript (ES6+)
- Plain CSS (custom properties, grid, animations)
- No build step, no framework

---

## 📁 Project Structure

```text
promptsmith/
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- config.py              # settings loaded from .env
|   |   |-- database.py            # SQLAlchemy setup
|   |   |-- models.py              # Prompt, Tag, association table
|   |   |-- schemas.py             # Pydantic schemas
|   |   |-- main.py                # FastAPI entry point
|   |   `-- api/
|   |       |-- __init__.py
|   |       |-- prompts.py         # CRUD endpoints
|   |       |-- meta.py            # tags, categories, stats
|   |       |-- io.py              # import / export
|   |       `-- profile.py         # GitHub profile proxy
|   |-- requirements.txt
|   |-- .env.example
|   `-- seed.py                    # demo data
|-- frontend/
|   |-- index.html
|   |-- style.css
|   `-- app.js
|-- .gitignore
`-- README.md
```
🚀 Quick Start
Requirements

    Python 3.11+ — https://www.python.org/downloads/

    Git — https://git-scm.com/

1. Clone the repository
bash

git clone https://github.com/SouthVirginia19/promptsmith.git
cd promptsmith/backend

2. Create a virtual environment
bash

python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\python.exe -m pip install --upgrade pip

# Linux / macOS
source .venv/bin/activate

    We call python.exe from the venv directly instead of activating — this works the same on Windows, Linux, and macOS, and avoids PowerShell execution-policy issues.

3. Install dependencies
bash

# Windows
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Linux / macOS
./.venv/bin/python -m pip install -r requirements.txt

4. Configure environment
bash

# Windows
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env

Default contents of .env:
text

DATABASE_URL=sqlite:///./promptsmith.db

Optional — for higher GitHub API rate limits on the About tab:
text

GITHUB_TOKEN=github_pat_your_token_here

5. Seed demo prompts (optional)
bash

.\.venv\Scripts\python.exe seed.py

Expected output: Seeded 5 prompts.
6. Run the server
bash

.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

Expected output:
text

INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.

7. Open in your browser

👉 http://127.0.0.1:8000
🎮 Usage
Create a prompt

Click + New Prompt in the top bar (or press N). Fill in:

    Title — short, memorable

    Description — one-liner

    Category — e.g. coding, writing, ai

    Tags — comma-separated, e.g. git, review

    Content — the prompt itself, with {variables} if needed

Use a prompt with variables

Example content:
text

You are a senior {language} developer. Review this code:

{code}

When you click ⚡ Use, PromptSmith shows two input fields — language and code. Fill them in, click 📋 Copy result, and the filled prompt lands in your clipboard.
Keyboard shortcuts
Key	Action
N	New prompt
R	Random prompt
/	Focus search
Esc	Close modal
Export / Import

    📤 Export — downloads promptsmith-YYYYMMDD-HHMMSS.json with all prompts

    📥 Import — reads a JSON file, skips prompts whose titles already exist

Great for backups, sharing with teammates, or moving to another machine.
🔌 API Endpoints
Method	Endpoint	Description
GET	/api/health	Health check
GET	/api/prompts	List prompts. Query: q, tag, category, favorite
POST	/api/prompts	Create a prompt
GET	/api/prompts/{id}	Get a single prompt
PATCH	/api/prompts/{id}	Update a prompt
DELETE	/api/prompts/{id}	Delete a prompt
GET	/api/meta/tags	List all tag names
GET	/api/meta/categories	List distinct categories
GET	/api/meta/stats	Total prompts, favorites, tags
GET	/api/export	Download all prompts as JSON
POST	/api/import	Import prompts from JSON payload
GET	/api/profile	GitHub profile proxy (query: username)
⚙️ Configuration

All settings live in backend/.env:
Variable	Default	Description
DATABASE_URL	sqlite:///./promptsmith.db	SQLAlchemy connection string
GITHUB_TOKEN	""	Optional. Raises GitHub API rate limit from 60 to 5000 req/hour
🗺 Roadmap

    ☑

    MVP — CRUD, tags, categories, search, favorites
    ☑

    Variables with fill-in modal
    ☑

    JSON import / export
    ☑

    Live GitHub profile tab
    □

    📦 Skill export (SKILL.md bundle format for AI agents)
    □

    🕓 Prompt versioning with rollback
    □

    🌐 Public prompt sharing
    □

    🦀 Rust CLI (ps use <prompt> from the terminal)
    □

    🤖 MCP server (Model Context Protocol)
    □

    🌓 Light theme toggle
    □

    📊 Usage analytics dashboard

🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

    Fork the repository

    Create a branch: git checkout -b feature/amazing-feature

    Commit: git commit -m "Add amazing feature"

    Push: git push origin feature/amazing-feature

    Open a Pull Request

📄 License

Released under the MIT License. See LICENSE for details.
👤 Author

SouthVirginia19

GitHub: @SouthVirginia19

⭐ If this project was useful, consider giving it a star!
text


`Ctrl+S`.

---

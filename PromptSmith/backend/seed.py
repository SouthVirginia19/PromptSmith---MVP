"""Заполнить БД примерами. Запуск: python seed.py"""
from app.database import Base, SessionLocal, engine
from app.models import Prompt, Tag

Base.metadata.create_all(bind=engine)


SEED = [
    {
        "title": "Code Reviewer",
        "description": "Senior-level code review for any snippet.",
        "category": "coding",
        "content": (
            "You are a senior {language} developer. Review this code and provide:\n"
            "1. Bugs and edge cases\n"
            "2. Security concerns\n"
            "3. Performance improvements\n"
            "4. Style and readability\n\n"
            "Code:\n```\n{code}\n```"
        ),
        "tags": ["review", "coding"],
    },
    {
        "title": "Commit Message Writer",
        "description": "Turn a diff into a conventional commit message.",
        "category": "coding",
        "content": (
            "Write a Conventional Commits message for the following change.\n"
            "Scope: {scope}\n"
            "Change summary: {summary}\n\n"
            "Return only the commit message, no explanation."
        ),
        "tags": ["git", "coding"],
    },
    {
        "title": "Explain Like I'm Five",
        "description": "Simplify any complex topic.",
        "category": "learning",
        "content": (
            "Explain {topic} as if I were five years old. "
            "Use analogies, short sentences, and no jargon. "
            "Then give me one real-world example."
        ),
        "tags": ["learning", "explanation"],
    },
    {
        "title": "SQL Query Optimizer",
        "description": "Rewrite a slow SQL query and explain the changes.",
        "category": "database",
        "content": (
            "Here is a slow SQL query running on {dialect}:\n```sql\n{query}\n```\n\n"
            "Schema: {schema}\n"
            "Rewrite it for performance. Explain indexes that would help."
        ),
        "tags": ["sql", "database", "performance"],
    },
    {
        "title": "Bug Report Writer",
        "description": "Turn a rough description into a proper bug report.",
        "category": "writing",
        "content": (
            "Turn this rough description into a clean bug report with sections: "
            "Summary, Steps to Reproduce, Expected, Actual, Environment.\n\n"
            "Description: {description}"
        ),
        "tags": ["writing", "bugs"],
    },
]


def get_or_create_tag(db, name: str) -> Tag:
    tag = db.query(Tag).filter(Tag.name == name).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.flush()
    return tag


def main():
    db = SessionLocal()
    try:
        if db.query(Prompt).count() > 0:
            print("Database already has prompts. Skipping seed.")
            return
        for item in SEED:
            prompt = Prompt(
                title=item["title"],
                description=item["description"],
                content=item["content"],
                category=item["category"],
            )
            prompt.tags = [get_or_create_tag(db, t) for t in item["tags"]]
            db.add(prompt)
        db.commit()
        print(f"Seeded {len(SEED)} prompts.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
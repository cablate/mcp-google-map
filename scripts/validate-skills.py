"""Validate the packaged Google Maps Skills and their source coverage."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS_ROOT = ROOT / "skills"
SKILL_DIRS = (
    SKILLS_ROOT / "google-maps",
    SKILLS_ROOT / "google-maps-travel-planning",
    SKILLS_ROOT / "google-maps-local-seo",
)
TOOL_DIR = ROOT / "src" / "tools" / "maps"
TOOL_NAME = re.compile(r'^const NAME = "(maps_[a-z_]+)";', re.MULTILINE)
REFERENCE_HEADING = re.compile(r"^## (maps_[a-z_]+)(?:\s|$)", re.MULTILINE)
FRONTMATTER_NAME = re.compile(r"^---\s*\nname:\s*([^\n]+)", re.MULTILINE)
BACKTICK_MARKDOWN_PATH = re.compile(r"`((?:\.\.?/|references/)[^`]+\.md)`")


def validate_skill_entrypoints() -> None:
    names: list[str] = []
    for skill_dir in SKILL_DIRS:
        skill_path = skill_dir / "SKILL.md"
        if not skill_path.is_file():
            raise ValueError(f"Missing {skill_path.relative_to(ROOT)}")
        text = skill_path.read_text(encoding="utf-8")
        match = FRONTMATTER_NAME.search(text)
        if not match:
            raise ValueError(f"Missing frontmatter name in {skill_path.relative_to(ROOT)}")
        name = match.group(1).strip()
        if name != skill_dir.name:
            raise ValueError(f"Skill name {name!r} must match directory {skill_dir.name!r}")
        names.append(name)

        for relative_path in BACKTICK_MARKDOWN_PATH.findall(text):
            target = (skill_dir / relative_path).resolve()
            if not target.is_relative_to(SKILLS_ROOT.resolve()) or not target.is_file():
                raise ValueError(f"Broken Skill reference {relative_path!r} in {skill_path.relative_to(ROOT)}")

    if len(names) != len(set(names)):
        raise ValueError("Skill frontmatter names must be unique")
    if (SKILLS_ROOT / "_shared" / "SKILL.md").exists():
        raise ValueError("skills/_shared must remain a non-routable reference directory")


def validate_tool_reference() -> None:
    source_names: set[str] = set()
    for path in TOOL_DIR.glob("*.ts"):
        source_names.update(TOOL_NAME.findall(path.read_text(encoding="utf-8")))

    reference_path = SKILLS_ROOT / "google-maps" / "references" / "tools-api.md"
    reference_names = REFERENCE_HEADING.findall(reference_path.read_text(encoding="utf-8"))
    if len(reference_names) != len(set(reference_names)):
        raise ValueError("tools-api.md contains duplicate tool headings")
    if set(reference_names) != source_names:
        missing = sorted(source_names - set(reference_names))
        extra = sorted(set(reference_names) - source_names)
        raise ValueError(f"tools-api.md differs from source tools (missing={missing}, extra={extra})")


def main() -> int:
    try:
        validate_skill_entrypoints()
        validate_tool_reference()
    except (ValueError, OSError) as exc:
        print(f"Skill validation failed: {exc}", file=sys.stderr)
        return 1

    print(f"Google Maps Skills: {len(SKILL_DIRS)} entrypoints and shared references validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

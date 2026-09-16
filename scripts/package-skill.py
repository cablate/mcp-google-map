"""Build or verify the distributable Google Maps Agent Skill archive.

Usage: python scripts/package-skill.py --write|--check
"""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_DIR = ROOT / "skills" / "google-maps"
ARCHIVE = SKILL_DIR / "SKILL.skill"
TOOL_DIR = ROOT / "src" / "tools" / "maps"
TOOL_NAME = re.compile(r'^const NAME = "(maps_[a-z_]+)";', re.MULTILINE)
SKILL_ROW = re.compile(r"^\| `(maps_[a-z_]+)` \|", re.MULTILINE)
REFERENCE_HEADING = re.compile(r"^## (maps_[a-z_]+)(?:\s|$)", re.MULTILINE)


def skill_files() -> dict[str, bytes]:
    return {
        path.relative_to(SKILL_DIR).as_posix(): path.read_bytes()
        for path in sorted(SKILL_DIR.rglob("*"))
        if path.is_file() and path != ARCHIVE
    }


def validate_tool_map() -> None:
    source_names = set()
    for path in TOOL_DIR.glob("*.ts"):
        source_names.update(TOOL_NAME.findall(path.read_text(encoding="utf-8")))

    skill_text = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    reference_text = (SKILL_DIR / "references" / "tools-api.md").read_text(encoding="utf-8")
    tool_map = skill_text.split("## Tool Map", 1)[1].split("## Known API Limitations", 1)[0]
    skill_names = SKILL_ROW.findall(tool_map)
    reference_names = REFERENCE_HEADING.findall(reference_text)

    if len(skill_names) != len(set(skill_names)):
        raise ValueError("SKILL.md Tool Map contains duplicate tool rows")
    if len(reference_names) != len(set(reference_names)):
        raise ValueError("tools-api.md contains duplicate tool headings")
    for label, names in (("SKILL.md Tool Map", skill_names), ("tools-api.md headings", reference_names)):
        if set(names) != source_names:
            missing = sorted(source_names - set(names))
            extra = sorted(set(names) - source_names)
            raise ValueError(f"{label} differs from source tools (missing={missing}, extra={extra})")
    if f"{len(source_names)} tools in five categories" not in skill_text:
        raise ValueError(f"SKILL.md must state the current {len(source_names)}-tool count")


def write_archive(files: dict[str, bytes]) -> None:
    with zipfile.ZipFile(ARCHIVE, "w") as archive:
        for name, content in files.items():
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            archive.writestr(entry, content, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def check_archive(files: dict[str, bytes]) -> None:
    if not ARCHIVE.exists():
        raise ValueError(f"Missing {ARCHIVE.relative_to(ROOT)}; run --write")
    with zipfile.ZipFile(ARCHIVE) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or set(names) != set(files):
            raise ValueError("SKILL.skill file list differs from the source Skill; run --write")
        for name, content in files.items():
            if archive.read(name) != content:
                raise ValueError(f"SKILL.skill has stale {name}; run --write")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="rebuild SKILL.skill")
    mode.add_argument("--check", action="store_true", help="verify sources and archive")
    args = parser.parse_args()

    try:
        validate_tool_map()
        files = skill_files()
        if args.write:
            write_archive(files)
        else:
            check_archive(files)
    except (ValueError, OSError, zipfile.BadZipFile) as exc:
        print(f"Skill package check failed: {exc}", file=sys.stderr)
        return 1

    print(f"Google Maps Skill: {len(files)} files {'packaged' if args.write else 'verified'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

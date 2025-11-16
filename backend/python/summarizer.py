"""
Python backup implementation of Code Keeper's PR file summarization logic.

Given a list of GitHub PR file objects (shape compatible with the REST API),
this module produces short, human-readable summaries similar to the Next.js
implementation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Dict, Any
import re


Status = Literal["added", "modified", "removed", "renamed"]


@dataclass
class GitHubPRFile:
    filename: str
    status: Status
    additions: int
    deletions: int
    changes: int
    patch: str | None = None


@dataclass
class FileSummary:
    path: str
    status: Status
    summary: str


def is_package_lock_file(path: str) -> bool:
    return bool(re.search(r"package-lock\.json$", path, re.IGNORECASE))


def summarize_package_lock_changes(file: GitHubPRFile) -> str:
    patch = file.patch or ""
    added_versions = len(re.findall(r'^\+\s+"version":\s*"[^"]+"', patch, re.MULTILINE))
    removed_versions = len(re.findall(r'^-\s+"version":\s*"[^"]+"', patch, re.MULTILINE))
    bumped = min(added_versions, removed_versions)
    added_only = max(0, added_versions - bumped)
    removed_only = max(0, removed_versions - bumped)

    if file.status == "added":
        label = "New"
    elif file.status == "modified":
        label = "Updated"
    elif file.status == "removed":
        label = "Deleted"
    else:
        label = "Renamed"

    return (
        f"**{label}**: `{file.filename}` — package changes "
        f"(added {added_only}, updated {bumped}, removed {removed_only})"
    )


def extract_meaningful_changes(patch: str | None) -> Dict[str, Any]:
    if not patch:
        return {"description": "", "additions": [], "deletions": []}

    additions: List[str] = []
    deletions: List[str] = []

    for line in patch.splitlines():
        if line.startswith(("+++", "---", "@@")):
            continue

        if line.startswith("+") and line.strip() != "+":
            content = line[1:].strip()
            if content and not content.startswith(("//", "#", "*")):
                additions.append(content)
        elif line.startswith("-") and line.strip() != "-":
            content = line[1:].strip()
            if content and not content.startswith(("//", "#", "*")):
                deletions.append(content)

    description = generate_change_description(additions, deletions, patch)
    return {"description": description, "additions": additions, "deletions": deletions}


def generate_change_description(
    additions: List[str], deletions: List[str], full_patch: str
) -> str:
    patterns = {
        "newFunction": re.compile(r"^\s*(function|const|let|var)\s+(\w+)\s*[=(]"),
        "newClass": re.compile(r"^\s*class\s+(\w+)"),
        "newImport": re.compile(r"^\s*import\s+.*from"),
        "newExport": re.compile(r"^\s*export\s+(function|const|class|default)"),
        "newType": re.compile(r"^\s*(type|interface)\s+(\w+)"),
        "configChange": re.compile(r'^\s*["\']?\w+["\']?\s*:'),
        "testCase": re.compile(r"^\s*(it|test|describe)\s*\("),
    }

    for addition in additions[:3]:
        if patterns["newFunction"].match(addition):
            match = patterns["newFunction"].match(addition)
            kind = "function" if match and match.group(1) == "function" else "method"
            name = match.group(2) if match else ""
            return f"Added {kind} `{name}`"

        if patterns["newClass"].match(addition):
            match = patterns["newClass"].match(addition)
            name = match.group(1) if match else ""
            return f"Added class `{name}`"

        if patterns["newImport"].match(addition):
            match = re.match(r"import\s+(.*)\s+from\s+['\"](.*)['\"]", addition)
            if match:
                return f"Imported {match.group(1)} from {match.group(2)}"
            return "Added import"

        if patterns["newExport"].match(addition):
            return "Added exports"

        if patterns["newType"].match(addition):
            match = patterns["newType"].match(addition)
            kind = match.group(1) if match else "type"
            name = match.group(2) if match else ""
            return f"Added {kind} `{name}`"

        if patterns["testCase"].match(addition):
            return "Added test cases"

        if patterns["configChange"].match(addition):
            return "Updated configuration"

    if additions and deletions:
        return "Modified implementation"
    if additions:
        snippet = " | ".join(additions[:2])
        return f"Added code: {snippet}"
    if deletions:
        return "Removed code"
    if "Binary file" in full_patch:
        return "Updated binary content"
    return ""


def get_change_magnitude(additions: int, deletions: int) -> str:
    total = additions + deletions
    if total == 0:
        return ""
    if total < 10:
        return "minor change"
    if total < 50:
        return "moderate change"
    if total < 200:
        return "significant change"
    return "major refactor"


def build_file_summary(file: GitHubPRFile) -> FileSummary:
    if is_package_lock_file(file.filename):
        return FileSummary(
            path=file.filename,
            status=file.status,
            summary=summarize_package_lock_changes(file),
        )

    analysis = extract_meaningful_changes(file.patch)
    parts: List[str] = []

    if file.status == "added":
        status_label = "New"
    elif file.status == "modified":
        status_label = "Updated"
    elif file.status == "removed":
        status_label = "Deleted"
    else:
        status_label = "Renamed"

    parts.append(f"**{status_label}**: `{file.filename}`")

    if file.status != "removed":
        magnitude = get_change_magnitude(file.additions, file.deletions)
        if magnitude:
            parts.append(f"({magnitude})")

    desc: str = analysis["description"]
    adds: List[str] = analysis["additions"]

    if desc.startswith("Added code:"):
        snippet = desc.replace("Added code: ", "")
        prefix = "Introduces new logic. Highlights: " if file.additions + file.deletions > 50 else ""
        parts.append(f"— {prefix}{snippet}")
    elif desc:
        parts.append(f"— {desc}")
    elif adds:
        snippet = adds[0] if len(adds) == 1 else " | ".join(adds[:2])
        parts.append(f"— {snippet}")
    elif file.patch and "Binary file" in file.patch:
        parts.append("— binary content updated")

    return FileSummary(path=file.filename, status=file.status, summary=" ".join(parts))


def summarize_files(raw_files: List[Dict[str, Any]]) -> List[FileSummary]:
    """Convert raw GitHub file payloads into FileSummary objects."""
    files = [
        GitHubPRFile(
            filename=f["filename"],
            status=f["status"],
            additions=f.get("additions", 0),
            deletions=f.get("deletions", 0),
            changes=f.get("changes", 0),
            patch=f.get("patch"),
        )
        for f in raw_files
    ]
    return [build_file_summary(file) for file in files]


__all__ = ["GitHubPRFile", "FileSummary", "summarize_files"]



"""Utilities for loading framework controls from external datasets."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Optional, Sequence, Tuple

from django.db import transaction

from risk import models

DEFAULT_ELEMENT_TYPES: Tuple[str, ...] = ("control", "control_enhancement")


@dataclass(frozen=True)
class ControlRecord:
    """Simplified representation of a framework control record."""

    control_id: str
    title: str
    element_type: str


def load_cprt_controls(
    path: Path | str,
    *,
    element_types: Optional[Iterable[str]] = None,
) -> Iterator[ControlRecord]:
    """Yield control records from a CPRT JSON export.

    Only the minimal keys required for mapping are returned so the full dataset never
    needs to leave disk.
    """

    resolved_path = Path(path)
    payload = json.loads(resolved_path.read_text(encoding="utf-8"))
    elements = (
        payload.get("response", {})
        .get("elements", {})
        .get("elements", [])
    )

    allowed = {item.lower() for item in element_types} if element_types is not None else set(DEFAULT_ELEMENT_TYPES)

    for element in elements:
        element_type = (element.get("element_type") or "").lower()
        if element_type not in allowed:
            continue

        control_id = (element.get("element_identifier") or "").strip()
        if not control_id:
            continue

        title = (element.get("title") or "").strip()
        yield ControlRecord(control_id=control_id, title=title, element_type=element_type)


@transaction.atomic
def import_controls_from_cprt(
    path: Path | str,
    framework: models.Framework,
    *,
    element_types: Optional[Iterable[str]] = None,
) -> Tuple[int, int]:
    """Create or update ``FrameworkControl`` rows from a CPRT export.

    Returns a tuple of ``(created, updated)`` counts.
    """

    created = 0
    updated = 0
    records = list(load_cprt_controls(path, element_types=element_types))
    for record in records:
        obj, was_created = models.FrameworkControl.objects.update_or_create(
            framework=framework,
            control_id=record.control_id,
            defaults={
                "title": record.title,
                "element_type": record.element_type,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated

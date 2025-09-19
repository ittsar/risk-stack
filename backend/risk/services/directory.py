"""Directory service helpers for user lookups.

This module centralises how the application discovers potential owners. Today it
queries the Django user model, but it can be extended with additional sources
such as LDAP, SSO directories, or HR systems by plugging extra adapters into
``DirectoryService``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Mapping

from django.contrib.auth import get_user_model
from django.db.models import Q


@dataclass
class Suggestion:  # pragma: no cover - convenience structure, serialized elsewhere
    username: str
    first_name: str
    last_name: str
    email: str
    display_name: str
    source: str = "django"

    def as_dict(self) -> Mapping[str, str]:
        return {
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "display_name": self.display_name,
            "source": self.source,
        }


class DirectorySource:
    """Interface for pluggable user suggestion sources."""

    def search(self, term: str, limit: int) -> Iterable[Suggestion]:  # pragma: no cover - interface
        raise NotImplementedError


class DjangoUserSource(DirectorySource):
    def search(self, term: str, limit: int) -> Iterable[Suggestion]:
        if not term:
            return []

        User = get_user_model()
        query = (
            Q(username__icontains=term)
            | Q(first_name__icontains=term)
            | Q(last_name__icontains=term)
            | Q(email__icontains=term)
        )
        qs = User.objects.filter(query).order_by("username")[:limit]

        suggestions: List[Suggestion] = []
        for user in qs:
            full_name = user.get_full_name().strip()
            display = full_name if full_name else user.username
            if full_name and full_name != user.username:
                display = f"{full_name} ({user.username})"

            suggestions.append(
                Suggestion(
                    username=user.username,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    display_name=display,
                    source="django",
                )
            )

        return suggestions


class DirectoryService:
    """Aggregate user suggestions from multiple sources."""

    def __init__(self, extra_sources: Iterable[DirectorySource] | None = None):
        self.sources: List[DirectorySource] = [DjangoUserSource()]
        if extra_sources:
            self.sources.extend(extra_sources)

    def search_users(self, term: str, limit: int = 10) -> List[Mapping[str, str]]:
        term = (term or "").strip()
        if not term:
            return []

        limit = max(1, min(limit, 25))
        results: List[Mapping[str, str]] = []

        remaining = limit
        for source in self.sources:
            if remaining <= 0:
                break
            matches = list(source.search(term, remaining))
            results.extend(suggestion.as_dict() for suggestion in matches)
            remaining = limit - len(results)

        # Deduplicate by username while preserving order
        seen = set()
        unique_results = []
        for item in results:
            username = item.get("username") or item.get("display_name")
            if username in seen:
                continue
            seen.add(username)
            unique_results.append(item)

        return unique_results[:limit]

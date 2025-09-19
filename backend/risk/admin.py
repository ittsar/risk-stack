from django.contrib import admin

from . import models


class RiskFindingInline(admin.TabularInline):
    model = models.Finding
    extra = 0


@admin.register(models.Framework)
class FrameworkAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "owner")
    search_fields = ("name", "owner")
    list_filter = ("status",)


@admin.register(models.Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("name", "asset_type", "project", "business_owner")
    list_filter = ("asset_type", "project")
    search_fields = ("name", "business_owner")


@admin.register(models.Control)
class ControlAdmin(admin.ModelAdmin):
    list_display = ("reference_id", "name")
    search_fields = ("reference_id", "name")


@admin.register(models.Vulnerability)
class VulnerabilityAdmin(admin.ModelAdmin):
    list_display = ("reference_id", "title", "severity", "status", "cvss_score")
    list_filter = ("status", "severity")
    search_fields = ("reference_id", "title", "cve_id")
    autocomplete_fields = ("controls", "risks")


@admin.register(models.Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "project", "owner", "likelihood", "impact")
    list_filter = ("status", "project", "frameworks")
    search_fields = ("title", "owner")
    autocomplete_fields = ("project", "assets", "controls", "frameworks", "vulnerabilities")
    inlines = [RiskFindingInline]


@admin.register(models.Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "risk", "due_date")
    list_filter = ("status", "due_date")
    search_fields = ("title",)


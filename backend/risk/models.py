from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class TimeStampedModel(models.Model):
    """Abstract base that tracks creation and modification timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Framework(TimeStampedModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class FrameworkControl(TimeStampedModel):
    framework = models.ForeignKey(Framework, related_name="framework_controls", on_delete=models.CASCADE)
    control_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    element_type = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        unique_together = ("framework", "control_id")
        ordering = ["framework", "control_id"]

    def __str__(self):
        return f"{self.framework.code}::{self.control_id}"


class Project(TimeStampedModel):
    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("active", "Active"),
        ("paused", "Paused"),
        ("closed", "Closed"),
    ]

    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    owner = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="planning")
    start_date = models.DateField(null=True, blank=True)
    target_end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Asset(TimeStampedModel):
    ASSET_TYPE_CHOICES = [
        ("application", "Application"),
        ("infrastructure", "Infrastructure"),
        ("vendor", "Vendor"),
        ("process", "Process"),
        ("data", "Data"),
    ]

    name = models.CharField(max_length=150)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES, default="application")
    description = models.TextField(blank=True)
    business_owner = models.CharField(max_length=150, blank=True)
    criticality = models.CharField(max_length=50, blank=True)
    project = models.ForeignKey(Project, related_name="assets", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ("name", "project")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Control(TimeStampedModel):
    reference_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    framework_controls = models.ManyToManyField("FrameworkControl", related_name="controls", blank=True)
    frameworks = models.ManyToManyField(Framework, related_name="controls", blank=True)

    class Meta:
        ordering = ["reference_id"]

    def __str__(self):
        return f"{self.reference_id} - {self.name}"


class Vulnerability(TimeStampedModel):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_review", "In Review"),
        ("mitigating", "Mitigating"),
        ("accepted", "Accepted"),
        ("closed", "Closed"),
    ]

    SEVERITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("informational", "Informational"),
    ]

    reference_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="open")
    severity = models.CharField(max_length=25, choices=SEVERITY_CHOICES, default="medium")
    cve_id = models.CharField(max_length=50, blank=True)
    cvss_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    cvss_vector = models.CharField(max_length=120, blank=True)
    published_date = models.DateField(null=True, blank=True)
    risks = models.ManyToManyField("Risk", related_name="vulnerabilities", blank=True)
    controls = models.ManyToManyField("Control", related_name="vulnerabilities", blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.reference_id} - {self.title}"


class Risk(TimeStampedModel):
    STATUS_CHOICES = [
        ("identified", "Identified"),
        ("analyzing", "Analyzing"),
        ("mitigating", "Mitigating"),
        ("accepted", "Accepted"),
        ("closed", "Closed"),
    ]

    IMPACT_CHOICES = LIKELIHOOD_CHOICES = [
        (1, "Very Low"),
        (2, "Low"),
        (3, "Medium"),
        (4, "High"),
        (5, "Very High"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="identified")
    owner = models.CharField(max_length=150, blank=True)
    project = models.ForeignKey(Project, related_name="risks", on_delete=models.SET_NULL, null=True, blank=True)
    assets = models.ManyToManyField(Asset, related_name="risks", blank=True)
    controls = models.ManyToManyField(Control, related_name="risks", blank=True)
    frameworks = models.ManyToManyField(Framework, related_name="risks", blank=True)
    likelihood = models.PositiveSmallIntegerField(choices=LIKELIHOOD_CHOICES, default=3)
    impact = models.PositiveSmallIntegerField(choices=IMPACT_CHOICES, default=3)
    mitigation_plan = models.TextField(blank=True)
    target_resolution_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title

    @property
    def score(self) -> int:
        return (self.likelihood or 0) * (self.impact or 0)

    @property
    def severity_label(self) -> str:
        score = self.score
        if score >= 20:
            return "Critical"
        if score >= 12:
            return "High"
        if score >= 8:
            return "Medium"
        if score >= 4:
            return "Low"
        return "Very Low"


class Finding(TimeStampedModel):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="open")
    due_date = models.DateField(null=True, blank=True)
    owner = models.CharField(max_length=150, blank=True)
    risk = models.ForeignKey(Risk, related_name="findings", on_delete=models.CASCADE)

    class Meta:
        ordering = ["-due_date"]

    def __str__(self):
        return self.title


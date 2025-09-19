from django.contrib.auth import get_user_model
from rest_framework import serializers

from . import models


class FrameworkControlSummarySerializer(serializers.ModelSerializer):
    framework_code = serializers.CharField(source="framework.code", read_only=True)

    class Meta:
        model = models.FrameworkControl
        fields = ["id", "framework", "framework_code", "control_id", "title", "element_type"]
        read_only_fields = fields


class FrameworkControlSerializer(serializers.ModelSerializer):
    framework_code = serializers.CharField(source="framework.code", read_only=True)
    framework_name = serializers.CharField(source="framework.name", read_only=True)

    class Meta:
        model = models.FrameworkControl
        fields = [
            "id",
            "framework",
            "framework_code",
            "framework_name",
            "control_id",
            "title",
            "element_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["framework", "framework_code", "framework_name", "created_at", "updated_at"]


class ControlSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Control
        fields = ["id", "reference_id", "name"]


class RiskSummarySerializer(serializers.ModelSerializer):
    severity_label = serializers.CharField(read_only=True)

    class Meta:
        model = models.Risk
        fields = ["id", "title", "severity_label", "status"]


class VulnerabilitySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Vulnerability
        fields = ["id", "reference_id", "title", "status", "severity", "cvss_score"]


class FrameworkSerializer(serializers.ModelSerializer):
    controls = ControlSummarySerializer(many=True, read_only=True)

    class Meta:
        model = models.Framework
        fields = ["id", "code", "name", "description", "created_at", "updated_at", "controls"]
        read_only_fields = ["created_at", "updated_at"]


class ControlSerializer(serializers.ModelSerializer):
    frameworks = FrameworkSerializer(many=True, read_only=True)
    framework_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=models.Framework.objects.all(),
        required=False,
    )
    framework_controls = FrameworkControlSummarySerializer(many=True, read_only=True)
    framework_control_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=models.FrameworkControl.objects.select_related("framework"),
        required=False,
    )
    vulnerabilities = VulnerabilitySummarySerializer(many=True, read_only=True)
    vulnerability_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=models.Vulnerability.objects.all(),
        required=False,
    )

    class Meta:
        model = models.Control
        fields = [
            "id",
            "reference_id",
            "name",
            "description",
            "frameworks",
            "framework_ids",
            "framework_controls",
            "framework_control_ids",
            "vulnerabilities",
            "vulnerability_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def _update_framework_relationships(self, instance, framework_objs, framework_control_objs):
        if framework_control_objs is not None:
            instance.framework_controls.set(framework_control_objs)
        if framework_objs is not None or framework_control_objs is not None:
            frameworks_to_assign = set()
            if framework_objs is not None:
                frameworks_to_assign.update(framework_objs)
            else:
                frameworks_to_assign.update(instance.frameworks.all())
            if framework_control_objs is not None:
                frameworks_to_assign.update(fc.framework for fc in framework_control_objs)
            instance.frameworks.set(list(frameworks_to_assign))

    def _update_vulnerabilities(self, instance, vulnerability_ids):
        if vulnerability_ids is not None:
            instance.vulnerabilities.set(vulnerability_ids)

    def create(self, validated_data):
        framework_objs = list(validated_data.pop("framework_ids", []))
        framework_control_objs = list(validated_data.pop("framework_control_ids", []))
        vulnerability_ids = list(validated_data.pop("vulnerability_ids", []))
        control = super().create(validated_data)
        self._update_framework_relationships(control, framework_objs, framework_control_objs)
        if vulnerability_ids:
            control.vulnerabilities.set(vulnerability_ids)
        return control

    def update(self, instance, validated_data):
        framework_objs = validated_data.pop("framework_ids", None)
        if framework_objs is not None:
            framework_objs = list(framework_objs)
        framework_control_objs = validated_data.pop("framework_control_ids", None)
        if framework_control_objs is not None:
            framework_control_objs = list(framework_control_objs)
        vulnerability_ids = validated_data.pop("vulnerability_ids", None)
        control = super().update(instance, validated_data)
        self._update_framework_relationships(control, framework_objs, framework_control_objs)
        self._update_vulnerabilities(control, vulnerability_ids)
        return control


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Project
        fields = [
            "id",
            "name",
            "description",
            "owner",
            "status",
            "start_date",
            "target_end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AssetSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=models.Project.objects.all(), allow_null=True, required=False
    )
    project_detail = ProjectSerializer(source="project", read_only=True)

    class Meta:
        model = models.Asset
        fields = [
            "id",
            "name",
            "asset_type",
            "description",
            "business_owner",
            "criticality",
            "project",
            "project_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "project_detail"]


class FindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Finding
        fields = [
            "id",
            "title",
            "description",
            "status",
            "due_date",
            "owner",
            "risk",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class VulnerabilitySerializer(serializers.ModelSerializer):
    controls = ControlSummarySerializer(many=True, read_only=True)
    control_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Control.objects.all(), many=True, write_only=True, required=False
    )
    risks = RiskSummarySerializer(many=True, read_only=True)
    risk_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Risk.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = models.Vulnerability
        fields = [
            "id",
            "reference_id",
            "title",
            "description",
            "status",
            "severity",
            "cve_id",
            "cvss_score",
            "cvss_vector",
            "published_date",
            "controls",
            "control_ids",
            "risks",
            "risk_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        control_ids = list(validated_data.pop("control_ids", []))
        risk_ids = list(validated_data.pop("risk_ids", []))
        vulnerability = super().create(validated_data)
        if control_ids:
            vulnerability.controls.set(control_ids)
        if risk_ids:
            vulnerability.risks.set(risk_ids)
        return vulnerability

    def update(self, instance, validated_data):
        control_ids = validated_data.pop("control_ids", None)
        risk_ids = validated_data.pop("risk_ids", None)
        vulnerability = super().update(instance, validated_data)
        if control_ids is not None:
            vulnerability.controls.set(control_ids)
        if risk_ids is not None:
            vulnerability.risks.set(risk_ids)
        return vulnerability


class RiskSerializer(serializers.ModelSerializer):
    project_detail = ProjectSerializer(source="project", read_only=True)
    assets = AssetSerializer(many=True, read_only=True)
    asset_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Asset.objects.all(), many=True, write_only=True, required=False
    )
    controls = ControlSerializer(many=True, read_only=True)
    control_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Control.objects.all(), many=True, write_only=True, required=False
    )
    vulnerabilities = VulnerabilitySummarySerializer(many=True, read_only=True)
    vulnerability_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Vulnerability.objects.all(), many=True, write_only=True, required=False
    )
    frameworks = FrameworkSerializer(many=True, read_only=True)
    framework_ids = serializers.PrimaryKeyRelatedField(
        queryset=models.Framework.objects.all(), many=True, write_only=True, required=False
    )
    findings = FindingSerializer(many=True, read_only=True)
    score = serializers.IntegerField(read_only=True)
    severity_label = serializers.CharField(read_only=True)

    class Meta:
        model = models.Risk
        fields = [
            "id",
            "title",
            "description",
            "status",
            "owner",
            "project",
            "project_detail",
            "assets",
            "asset_ids",
            "controls",
            "control_ids",
            "vulnerabilities",
            "vulnerability_ids",
            "frameworks",
            "framework_ids",
            "likelihood",
            "impact",
            "score",
            "severity_label",
            "mitigation_plan",
            "target_resolution_date",
            "findings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "project_detail",
            "assets",
            "controls",
            "vulnerabilities",
            "frameworks",
            "findings",
            "score",
            "severity_label",
        ]

    def _set_many_to_many(self, instance, field_name, ids):
        if ids is not None:
            getattr(instance, field_name).set(ids)

    def create(self, validated_data):
        asset_ids = validated_data.pop("asset_ids", [])
        control_ids = validated_data.pop("control_ids", [])
        vulnerability_ids = validated_data.pop("vulnerability_ids", [])
        framework_ids = validated_data.pop("framework_ids", [])
        risk = super().create(validated_data)
        if asset_ids:
            risk.assets.set(asset_ids)
        if control_ids:
            risk.controls.set(control_ids)
        if vulnerability_ids:
            risk.vulnerabilities.set(vulnerability_ids)
        if framework_ids:
            risk.frameworks.set(framework_ids)
        return risk

    def update(self, instance, validated_data):
        asset_ids = validated_data.pop("asset_ids", None)
        control_ids = validated_data.pop("control_ids", None)
        vulnerability_ids = validated_data.pop("vulnerability_ids", None)
        framework_ids = validated_data.pop("framework_ids", None)
        risk = super().update(instance, validated_data)
        self._set_many_to_many(risk, "assets", asset_ids)
        self._set_many_to_many(risk, "controls", control_ids)
        self._set_many_to_many(risk, "vulnerabilities", vulnerability_ids)
        self._set_many_to_many(risk, "frameworks", framework_ids)
        return risk


class UserSummarySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "display_name",
        ]

    def get_display_name(self, obj):
        full_name = obj.get_full_name().strip()
        if full_name:
            return f"{full_name} ({obj.username})"
        return obj.username

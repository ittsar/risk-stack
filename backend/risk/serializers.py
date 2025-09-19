from rest_framework import serializers

from . import models


class FrameworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Framework
        fields = ["id", "code", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class ControlSerializer(serializers.ModelSerializer):
    frameworks = FrameworkSerializer(many=True, read_only=True)
    framework_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=models.Framework.objects.all(),
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def _update_frameworks(self, instance, framework_ids):
        if framework_ids is not None:
            instance.frameworks.set(framework_ids)

    def create(self, validated_data):
        framework_ids = validated_data.pop("framework_ids", [])
        control = super().create(validated_data)
        if framework_ids:
            control.frameworks.set(framework_ids)
        return control

    def update(self, instance, validated_data):
        framework_ids = validated_data.pop("framework_ids", None)
        control = super().update(instance, validated_data)
        self._update_frameworks(control, framework_ids)
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
        read_only_fields = ["created_at", "updated_at", "project_detail", "assets", "controls", "frameworks", "findings", "score", "severity_label"]

    def _set_many_to_many(self, instance, field_name, ids):
        if ids is not None:
            getattr(instance, field_name).set(ids)

    def create(self, validated_data):
        asset_ids = validated_data.pop("asset_ids", [])
        control_ids = validated_data.pop("control_ids", [])
        framework_ids = validated_data.pop("framework_ids", [])
        risk = super().create(validated_data)
        if asset_ids:
            risk.assets.set(asset_ids)
        if control_ids:
            risk.controls.set(control_ids)
        if framework_ids:
            risk.frameworks.set(framework_ids)
        return risk

    def update(self, instance, validated_data):
        asset_ids = validated_data.pop("asset_ids", None)
        control_ids = validated_data.pop("control_ids", None)
        framework_ids = validated_data.pop("framework_ids", None)
        risk = super().update(instance, validated_data)
        self._set_many_to_many(risk, "assets", asset_ids)
        self._set_many_to_many(risk, "controls", control_ids)
        self._set_many_to_many(risk, "frameworks", framework_ids)
        return risk

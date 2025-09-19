from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import viewsets, filters, permissions, decorators, response
from rest_framework.views import APIView

from . import models, serializers
from .services.directory import DirectoryService


class DefaultPermission(permissions.IsAuthenticated):
    pass


class FrameworkViewSet(viewsets.ModelViewSet):
    queryset = models.Framework.objects.all()
    serializer_class = serializers.FrameworkSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "controls__reference_id", "controls__name"]
    ordering_fields = ["code", "name", "created_at"]
    ordering = ["code"]


class FrameworkControlViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.FrameworkControl.objects.select_related("framework")
    serializer_class = serializers.FrameworkControlSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["control_id", "title", "framework__code", "framework__name"]
    ordering_fields = ["control_id", "framework__code", "created_at"]
    ordering = ["control_id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        framework_param = self.request.query_params.get("framework")
        element_type = self.request.query_params.get("element_type")
        if framework_param:
            filters_q = Q(framework__code__iexact=framework_param)
            if framework_param.isdigit():
                filters_q |= Q(framework_id=int(framework_param))
            queryset = queryset.filter(filters_q)
        if element_type:
            queryset = queryset.filter(element_type__iexact=element_type)
        return queryset


class ControlViewSet(viewsets.ModelViewSet):
    queryset = models.Control.objects.prefetch_related("frameworks", "framework_controls__framework")
    serializer_class = serializers.ControlSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["reference_id", "name", "frameworks__code", "framework_controls__control_id"]
    ordering_fields = ["reference_id", "name", "created_at"]
    ordering = ["reference_id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        framework_param = self.request.query_params.get("framework")
        framework_control = self.request.query_params.get("framework_control")
        if framework_param:
            queryset = queryset.filter(frameworks__code__iexact=framework_param)
        if framework_control:
            filters_q = Q(framework_controls__control_id__iexact=framework_control)
            if framework_control.isdigit():
                filters_q |= Q(framework_controls__id=int(framework_control))
            queryset = queryset.filter(filters_q)
        return queryset.distinct()


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "owner", "status"]
    ordering_fields = ["name", "status", "created_at"]
    ordering = ["name"]


class AssetViewSet(viewsets.ModelViewSet):
    queryset = models.Asset.objects.select_related("project")
    serializer_class = serializers.AssetSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "asset_type", "business_owner", "project__name"]
    ordering_fields = ["name", "asset_type", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        asset_type = self.request.query_params.get('asset_type')
        project = self.request.query_params.get('project')

        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)
        if project:
            queryset = queryset.filter(project__id=project)

        return queryset


class RiskViewSet(viewsets.ModelViewSet):
    queryset = (
        models.Risk.objects.select_related("project")
        .prefetch_related(
            "assets",
            "controls__frameworks",
            "controls__framework_controls__framework",
            "frameworks",
            "findings",
        )
        .all()
    )
    serializer_class = serializers.RiskSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "owner", "status", "project__name", "frameworks__code"]
    ordering_fields = ["updated_at", "created_at", "likelihood", "impact"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        framework = self.request.query_params.get('framework')
        project = self.request.query_params.get('project')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if framework:
            queryset = queryset.filter(frameworks__code__iexact=framework)
        if project:
            queryset = queryset.filter(project__id=project)

        return queryset.distinct()

    @decorators.action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        total = queryset.count()
        by_status = queryset.values("status").order_by("status").annotate(count=Count("id"))
        by_severity = {}
        for risk in queryset:
            label = risk.severity_label
            by_severity[label] = by_severity.get(label, 0) + 1
        data = {
            "total_risks": total,
            "by_status": list(by_status),
            "by_severity": by_severity,
        }
        return response.Response(data)


class FindingViewSet(viewsets.ModelViewSet):
    queryset = models.Finding.objects.select_related("risk")
    serializer_class = serializers.FindingSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "status", "risk__title"]
    ordering_fields = ["due_date", "status", "created_at"]
    ordering = ["-due_date"]


class DashboardView(APIView):
    permission_classes = [DefaultPermission]

    def get(self, request):
        projects = models.Project.objects.count()
        risks = models.Risk.objects.count()
        open_findings = models.Finding.objects.exclude(status__in=["resolved", "closed"]).count()
        assets = models.Asset.objects.count()
        controls = models.Control.objects.count()
        frameworks = models.Framework.objects.count()
        return response.Response(
            {
                "projects": projects,
                "risks": risks,
                "open_findings": open_findings,
                "assets": assets,
                "controls": controls,
                "frameworks": frameworks,
            }
        )


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = serializers.UserSummarySerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "first_name", "last_name", "email"]
    ordering_fields = ["username", "first_name", "last_name", "date_joined"]
    ordering = ["username"]


class UserSuggestionsView(APIView):
    permission_classes = [DefaultPermission]

    def get(self, request):
        term = request.query_params.get('q', '')
        limit = request.query_params.get('limit')
        try:
            limit_value = int(limit) if limit else 10
        except ValueError:
            limit_value = 10

        service = DirectoryService()
        results = service.search_users(term, limit=limit_value)
        return response.Response({'results': results})

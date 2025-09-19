import os
from django.conf import settings
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthcheckView(APIView):
    """Simple read-only endpoint to confirm the backend is reachable."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'backend',
            'timestamp': now().isoformat(),
        })


class VersionView(APIView):
    """Expose backend build metadata for UI display."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        payload = {
            'backend': getattr(settings, 'APP_VERSION', '0.0.0'),
        }
        commit = getattr(settings, 'APP_BUILD_COMMIT', '')
        if commit:
            payload['commit'] = commit
        environment = os.getenv('APP_ENVIRONMENT') or os.getenv('APP_ENV')
        if environment:
            payload['environment'] = environment
        return Response(payload)

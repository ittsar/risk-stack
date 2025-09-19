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

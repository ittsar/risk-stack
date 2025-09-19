from django.urls import path

from .views import HealthcheckView, VersionView

urlpatterns = [
    path('health/', HealthcheckView.as_view(), name='healthcheck'),
    path('version/', VersionView.as_view(), name='version'),
]

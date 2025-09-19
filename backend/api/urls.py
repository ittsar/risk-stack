from django.urls import path

from .views import HealthcheckView

urlpatterns = [
    path('health/', HealthcheckView.as_view(), name='healthcheck'),
]

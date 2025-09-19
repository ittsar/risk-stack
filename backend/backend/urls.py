from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from risk.views import DashboardView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/auth/token/', obtain_auth_token, name='api-token'),
    path('api/', include('risk.urls')),
    path('api/dashboard/', DashboardView.as_view(), name='api-dashboard'),
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-docs-redoc'),
]

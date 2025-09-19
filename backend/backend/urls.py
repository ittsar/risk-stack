from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

from risk.views import DashboardView

schema_view = get_schema_view(
    title="Risk Stack API",
    description="API schema for the Risk Stack platform",
    version="1.0.0",
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/auth/token/', obtain_auth_token, name='api-token'),
    path('api/', include('risk.urls')),
    path('api/dashboard/', DashboardView.as_view(), name='api-dashboard'),
    path('api/openapi/', schema_view, name='openapi-schema'),
    path('api/docs/', include_docs_urls(title='Risk Stack API')),
]

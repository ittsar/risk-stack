from django.urls import path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'frameworks', views.FrameworkViewSet, basename='framework')
router.register(r'framework-controls', views.FrameworkControlViewSet, basename='framework-control')
router.register(r'controls', views.ControlViewSet, basename='control')
router.register(r'vulnerabilities', views.VulnerabilityViewSet, basename='vulnerability')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'assets', views.AssetViewSet, basename='asset')
router.register(r'risks', views.RiskViewSet, basename='risk')
router.register(r'findings', views.FindingViewSet, basename='finding')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('users/suggestions/', views.UserSuggestionsView.as_view(), name='user-suggestions'),
] + router.urls

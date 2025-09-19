from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'frameworks', views.FrameworkViewSet, basename='framework')
router.register(r'controls', views.ControlViewSet, basename='control')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'assets', views.AssetViewSet, basename='asset')
router.register(r'risks', views.RiskViewSet, basename='risk')
router.register(r'findings', views.FindingViewSet, basename='finding')

urlpatterns = router.urls

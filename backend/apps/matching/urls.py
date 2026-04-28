from django.urls import path

from apps.matching.views import RecommendedWorkersView


urlpatterns = [
    path("recommended-workers/", RecommendedWorkersView.as_view(), name="recommended-workers"),
]

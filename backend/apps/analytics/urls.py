from django.urls import path

from apps.analytics.views import DashboardMetricsView


urlpatterns = [
    path("dashboard-metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics"),
]

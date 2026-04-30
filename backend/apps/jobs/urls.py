from django.urls import path

from apps.jobs.views import JobListCreateView

urlpatterns = [
    path("", JobListCreateView.as_view(), name="job-list-create"),
]

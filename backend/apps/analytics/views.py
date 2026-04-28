from django.contrib.auth.models import User
from django.db.models import Avg
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.jobs.models import JobPosting


class DashboardMetricsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        open_jobs = JobPosting.objects.filter(status=JobPosting.STATUS_OPEN).count()
        verified_workers = UserProfile.objects.filter(
            role=UserProfile.ROLE_WORKER,
            verification_status="verified",
        ).count()
        total_accounts = User.objects.count()
        completed_jobs = JobPosting.objects.filter(status=JobPosting.STATUS_COMPLETED).count()
        avg_rating = UserProfile.objects.filter(
            role=UserProfile.ROLE_WORKER,
            rating_count__gt=0,
            average_rating__isnull=False,
        ).aggregate(value=Avg("average_rating"))["value"]

        return Response(
            {
                "open_jobs": open_jobs,
                "verified_workers": verified_workers,
                "completed_jobs": completed_jobs,
                "total_accounts": total_accounts,
                "avg_rating": float(avg_rating) if avg_rating is not None else None,
            }
        )

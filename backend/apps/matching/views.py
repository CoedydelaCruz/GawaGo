from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.jobs.models import JobPosting
from apps.matching.serializers import MatchRequestSerializer, MatchResultSerializer
from apps.matching.services import build_match_results


class RecommendedWorkersView(APIView):
    def post(self, request):
        serializer = MatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        job = get_object_or_404(JobPosting, pk=serializer.validated_data["job_id"])
        workers = UserProfile.objects.select_related("user").filter(role=UserProfile.ROLE_WORKER)
        results = build_match_results(job, list(workers))
        output = MatchResultSerializer(results, many=True).data
        return Response(
            {
                "job_id": job.id,
                "job_title": job.title,
                "required_skill": job.required_skill,
                "results": output,
            }
        )

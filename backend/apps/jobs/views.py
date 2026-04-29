from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import JobPosting
from apps.jobs.serializers import JobCreateSerializer, JobPostingSerializer


class JobListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        jobs = JobPosting.objects.select_related("household").order_by("-created_at")
        return Response(JobPostingSerializer(jobs, many=True).data)

    def post(self, request):
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        household_username = request.data.get("household_username")
        household = get_object_or_404(User, username=household_username)
        if household is None:
            return Response({"detail": "household_username is required."}, status=status.HTTP_400_BAD_REQUEST)
        job = JobPosting.objects.create(
            household=household,
            title=serializer.validated_data["title"],
            job_type=serializer.validated_data["job_type"],
            required_skill=serializer.validated_data["required_skill"],
            schedule=serializer.validated_data["schedule"],
            location_label=serializer.validated_data["location_label"],
            latitude=serializer.validated_data["latitude"],
            longitude=serializer.validated_data["longitude"],
            service_rate=serializer.validated_data["service_rate"],
        )
        return Response(JobPostingSerializer(job).data, status=status.HTTP_201_CREATED)

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.models import VerificationRequest
from apps.common.serializers import VerificationRequestCreateSerializer, VerificationRequestSerializer
from django.contrib.auth.models import User


class VerificationRequestListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        requests = VerificationRequest.objects.select_related("worker").order_by("-submitted_at")
        return Response(VerificationRequestSerializer(requests, many=True).data)

    def post(self, request):
        serializer = VerificationRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker = User.objects.get(username=serializer.validated_data["worker_username"])
        request_record = VerificationRequest.objects.create(
            worker=worker,
            primary_id_name=serializer.validated_data["primary_id_name"],
            secondary_doc_name=serializer.validated_data["secondary_doc_name"],
            notes=serializer.validated_data.get("notes", ""),
        )
        return Response(VerificationRequestSerializer(request_record).data, status=status.HTTP_201_CREATED)


class VerificationRequestReviewView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, pk):
        request_record = VerificationRequest.objects.select_related("worker").get(pk=pk)
        action = request.data.get("action")
        if action == "approve":
            request_record.status = VerificationRequest.STATUS_APPROVED
            request_record.review_note = "Approved by admin review."
        else:
            request_record.status = VerificationRequest.STATUS_REJECTED
            request_record.review_note = request.data.get("review_note", "Rejected by admin.")
        request_record.reviewed_at = timezone.now()
        request_record.save(update_fields=["status", "review_note", "reviewed_at"])
        return Response(VerificationRequestSerializer(request_record).data)

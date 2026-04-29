from rest_framework import serializers

from apps.common.models import VerificationRequest


class VerificationRequestSerializer(serializers.ModelSerializer):
    worker_username = serializers.CharField(source="worker.username", read_only=True)

    class Meta:
        model = VerificationRequest
        fields = [
            "id",
            "worker",
            "worker_username",
            "primary_id_name",
            "secondary_doc_name",
            "notes",
            "status",
            "submitted_at",
            "reviewed_at",
            "review_note",
        ]
        read_only_fields = ["id", "status", "submitted_at", "reviewed_at", "review_note"]


class VerificationRequestCreateSerializer(serializers.Serializer):
    worker_username = serializers.CharField()
    primary_id_name = serializers.CharField()
    secondary_doc_name = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)

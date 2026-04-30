from django.contrib.auth.models import User
from rest_framework import serializers

from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    target_username = serializers.CharField(source="target.username", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "author",
            "author_username",
            "author_role",
            "target",
            "target_username",
            "target_role",
            "job_title",
            "rating",
            "feedback",
            "created_at",
        ]
        read_only_fields = ["id", "author", "author_username", "target_username", "created_at"]


class ReviewCreateSerializer(serializers.Serializer):
    target_username = serializers.CharField(max_length=150)
    job_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5, allow_null=True)
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate_target_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Target user not found.") from exc

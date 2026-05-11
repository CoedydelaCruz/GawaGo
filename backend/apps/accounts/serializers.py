from rest_framework import serializers

from apps.accounts.models import PasswordResetRequest, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "role",
            "skills",
            "hourly_rate",
            "daily_rate",
            "verification_status",
            "location_label",
            "latitude",
            "longitude",
            "average_rating",
            "rating_count",
            "display_rating",
        ]
        read_only_fields = ["display_rating"]


class ForgotPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyResetTokenSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=12)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=12)
    new_password = serializers.CharField(min_length=8)


class PasswordResetRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordResetRequest
        fields = ["id", "email", "created_at", "expires_at", "used_at", "attempts"]

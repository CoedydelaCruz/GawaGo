from rest_framework import serializers

from apps.accounts.models import UserProfile


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

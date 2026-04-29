from rest_framework import serializers

from apps.jobs.models import JobPosting


class JobPostingSerializer(serializers.ModelSerializer):
    household_username = serializers.CharField(source="household.username", read_only=True)
    household_name = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = [
            "id",
            "household_username",
            "household_name",
            "title",
            "job_type",
            "required_skill",
            "schedule",
            "location_label",
            "latitude",
            "longitude",
            "service_rate",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "household_username", "household_name", "status", "created_at"]

    def get_household_name(self, obj):
        return obj.household.get_full_name().strip() or obj.household.username


class JobCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    job_type = serializers.CharField()
    required_skill = serializers.CharField()
    schedule = serializers.CharField()
    location_label = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7)
    service_rate = serializers.DecimalField(max_digits=10, decimal_places=2)

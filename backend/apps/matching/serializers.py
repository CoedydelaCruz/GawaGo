from rest_framework import serializers


class MatchRequestSerializer(serializers.Serializer):
    job_id = serializers.IntegerField()


class MatchResultSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()
    worker_username = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())
    verification_status = serializers.CharField()
    distance_km = serializers.FloatField(allow_null=True)
    distance_label = serializers.CharField()
    match_score = serializers.FloatField()
    rating_label = serializers.CharField()

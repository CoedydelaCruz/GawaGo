from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review
from apps.reviews.serializers import ReviewCreateSerializer, ReviewSerializer


class ReviewListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(target=request.user).select_related("author", "target")
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["target_username"]
        author_profile = getattr(request.user, "profile", None)
        target_profile = getattr(target_user, "profile", None)

        if not author_profile or not target_profile:
            return Response({"detail": "Both users must have profiles."}, status=status.HTTP_400_BAD_REQUEST)

        author_role = author_profile.role
        target_role = target_profile.role
        if author_role == target_role:
            return Response({"detail": "Reviews are only allowed between workers and households."}, status=status.HTTP_400_BAD_REQUEST)

        if author_role == "worker" and target_role != "household":
            return Response({"detail": "Workers can only review households."}, status=status.HTTP_400_BAD_REQUEST)
        if author_role == "household" and target_role != "worker":
            return Response({"detail": "Households can only review workers."}, status=status.HTTP_400_BAD_REQUEST)
        if author_role == "worker" and serializer.validated_data.get("rating") is not None:
            return Response({"detail": "Workers cannot rate households."}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            author=request.user,
            target=target_user,
            author_role=author_role,
            target_role=target_role,
            job_title=serializer.validated_data.get("job_title", ""),
            rating=serializer.validated_data.get("rating") if author_role == "household" else None,
            feedback=serializer.validated_data.get("feedback", ""),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

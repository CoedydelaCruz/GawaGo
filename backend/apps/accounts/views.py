from rest_framework import generics

from apps.accounts.models import UserProfile
from apps.accounts.serializers import UserProfileSerializer


class UserProfileListView(generics.ListAPIView):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer

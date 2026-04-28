from django.urls import path

from apps.accounts.views import UserProfileListView


urlpatterns = [
    path("profiles/", UserProfileListView.as_view(), name="profile-list"),
]

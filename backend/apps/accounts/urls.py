from django.urls import path

from apps.accounts.views import ForgotPasswordRequestView, ResetPasswordView, UserProfileListView, VerifyResetTokenView


urlpatterns = [
    path("profiles/", UserProfileListView.as_view(), name="profile-list"),
    path("forgot-password/", ForgotPasswordRequestView.as_view(), name="forgot-password"),
    path("verify-reset-token/", VerifyResetTokenView.as_view(), name="verify-reset-token"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
]

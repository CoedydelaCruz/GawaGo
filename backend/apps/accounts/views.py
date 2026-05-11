from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile
from apps.accounts.serializers import (
    ForgotPasswordRequestSerializer,
    PasswordResetRequestSerializer,
    ResetPasswordSerializer,
    UserProfileSerializer,
    VerifyResetTokenSerializer,
)
from apps.accounts.services import create_password_reset_request, send_password_reset_email, validate_latest_reset_request


class UserProfileListView(generics.ListAPIView):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer


class ForgotPasswordRequestView(APIView):
    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "If the email exists, a reset code has been sent."}, status=status.HTTP_200_OK)

        reset_request, token = create_password_reset_request(user)
        send_password_reset_email(user, token)
        return Response(
            {
                "detail": "Reset code sent.",
                "expires_at": reset_request.expires_at,
            },
            status=status.HTTP_200_OK,
        )


class VerifyResetTokenView(APIView):
    def post(self, request):
        serializer = VerifyResetTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        token = serializer.validated_data["token"].strip()
        reset_request = validate_latest_reset_request(email, token)
        if not reset_request:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Code verified.", "expires_at": reset_request.expires_at}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        token = serializer.validated_data["token"].strip()
        new_password = serializer.validated_data["new_password"]

        reset_request = validate_latest_reset_request(email, token)
        if not reset_request:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=reset_request.user)
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        reset_request.user.set_password(new_password)
        reset_request.user.save(update_fields=["password"])
        reset_request.used_at = reset_request.used_at or reset_request.created_at
        reset_request.save(update_fields=["used_at"])
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)

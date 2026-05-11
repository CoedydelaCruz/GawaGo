from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import PasswordResetRequest


class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="worker1", email="worker1@gmail.com", password="initial-pass123")

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_forgot_password_creates_reset_request(self, mock_generate_token, mock_send_email):
        response = self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(PasswordResetRequest.objects.filter(email="worker1@gmail.com").exists())
        mock_generate_token.assert_called_once()
        mock_send_email.assert_called_once()

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_verify_and_reset_password(self, mock_generate_token, mock_send_email):
        self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")

        verify_response = self.client.post(
            reverse("verify-reset-token"),
            {"email": "worker1@gmail.com", "token": "123456"},
            content_type="application/json",
        )
        self.assertEqual(verify_response.status_code, 200)

        reset_response = self.client.post(
            reverse("reset-password"),
            {"email": "worker1@gmail.com", "token": "123456", "new_password": "new-pass123"},
            content_type="application/json",
        )
        self.assertEqual(reset_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-pass123"))

        reset_request = PasswordResetRequest.objects.get(email="worker1@gmail.com")
        self.assertIsNotNone(reset_request.used_at)

    @patch("apps.accounts.views.send_password_reset_email")
    @patch("apps.accounts.services.generate_reset_token", return_value="123456")
    def test_expired_code_is_rejected(self, mock_generate_token, mock_send_email):
        self.client.post(reverse("forgot-password"), {"email": "worker1@gmail.com"}, content_type="application/json")
        reset_request = PasswordResetRequest.objects.get(email="worker1@gmail.com")
        reset_request.expires_at = timezone.now() - timedelta(minutes=1)
        reset_request.save(update_fields=["expires_at"])

        response = self.client.post(
            reverse("verify-reset-token"),
            {"email": "worker1@gmail.com", "token": "123456"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

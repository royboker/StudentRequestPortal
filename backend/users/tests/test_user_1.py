from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from users.models import User
from django.contrib.auth.hashers import make_password

class UserTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = '/User/register/'
        self.login_url = '/User/login/'
        self.forgot_url = '/User/forgot-password/'
        self.update_url = lambda uid: f'/User/update/{uid}/'
        self.reset_url = lambda uid, token: f'/User/reset-password/{uid}/{token}/'
        self.change_pass_url = lambda uid: f'/User/change-password/{uid}/'

        self.user = User.objects.create(
            full_name="Test User",
            email="test@example.com",
            id_number="123456789",
            role="student",
            password=make_password("Password1"),
            reset_token="abc123"
        )

    # --- Registration ---
    def test_register_success(self):
        response = self.client.post(self.register_url, {
            "full_name": "New User",
            "email": "new@example.com",
            "id_number": "999999999",
            "password": "Password1",
            "role": "student"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 201)

    def test_register_weak_password(self):
        response = self.client.post(self.register_url, {
            "full_name": "Weak Pass",
            "email": "weak@example.com",
            "id_number": "777777777",
            "password": "weak",
            "role": "student"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_register_missing_field(self):
        response = self.client.post(self.register_url, {
            "email": "missing@example.com",
            "id_number": "000000001",
            "password": "Password1",
            "role": "student"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_register_duplicate_email(self):
        response = self.client.post(self.register_url, {
            "full_name": "Test",
            "email": "test@example.com",
            "id_number": "888888888",
            "password": "Password1",
            "role": "student"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_register_duplicate_id(self):
        response = self.client.post(self.register_url, {
            "full_name": "Dup ID",
            "email": "unique@example.com",
            "id_number": "123456789",
            "password": "Password1",
            "role": "student"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    # --- Login ---
    def test_login_success(self):
        response = self.client.post(self.login_url, {
            "email": "test@example.com",
            "password": "Password1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 200)

    def test_login_wrong_password(self):
        response = self.client.post(self.login_url, {
            "email": "test@example.com",
            "password": "WrongPass"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 401)

    def test_login_unknown_email(self):
        response = self.client.post(self.login_url, {
            "email": "unknown@example.com",
            "password": "Password1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 404)

    def test_login_missing_fields(self):
        response = self.client.post(self.login_url, {}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_login_empty_password(self):
        response = self.client.post(self.login_url, {
            "email": "test@example.com",
            "password": ""
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    # --- Forgot Password ---
    def test_forgot_password_success(self):
        response = self.client.post(self.forgot_url, {
            "email": "test@example.com"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 200)

    def test_forgot_password_missing_email(self):
        response = self.client.post(self.forgot_url, {}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_forgot_password_unknown_email(self):
        response = self.client.post(self.forgot_url, {
            "email": "notfound@example.com"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 404)

    # --- Reset Password ---
    def test_reset_password_success(self):
        response = self.client.post(self.reset_url(self.user.id, "abc123"), {
            "password": "NewPass1",
            "confirm": "NewPass1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 200)

    def test_reset_password_mismatch(self):
        response = self.client.post(self.reset_url(self.user.id, "abc123"), {
            "password": "NewPass1",
            "confirm": "WrongPass"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_reset_password_invalid_token(self):
        response = self.client.post(self.reset_url(self.user.id, "wrongtoken"), {
            "password": "NewPass1",
            "confirm": "NewPass1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    # --- Update Profile ---
    def test_update_profile_success(self):
        response = self.client.put(self.update_url(self.user.id), {
            "full_name": "Updated Name",
            "email": "updated@example.com"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 200)

    def test_update_profile_not_found(self):
        response = self.client.put(self.update_url(999), {
            "full_name": "Updated Name"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 404)

    # --- Change Password ---
    def test_change_password_success(self):
        response = self.client.put(self.change_pass_url(self.user.id), {
            "old_password": "Password1",
            "new_password": "NewPass1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 200)

    def test_change_password_wrong_old(self):
        response = self.client.put(self.change_pass_url(self.user.id), {
            "old_password": "Wrong",
            "new_password": "NewPass1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_change_password_user_not_found(self):
        response = self.client.put(self.change_pass_url(999), {
            "old_password": "Password1",
            "new_password": "NewPass1"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 404)

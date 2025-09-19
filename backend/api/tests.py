from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class HealthcheckViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_healthcheck_returns_ok(self):
        response = self.client.get(reverse('healthcheck'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('status'), 'ok')

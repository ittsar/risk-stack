from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

from risk import models


class RiskApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='tester', password='password123')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        self.framework = models.Framework.objects.create(code='NIST-CSF', name='NIST Cybersecurity Framework')
        self.project = models.Project.objects.create(name='New Product Launch')
        self.asset = models.Asset.objects.create(name='Customer Portal', asset_type='application', project=self.project)
        self.control = models.Control.objects.create(reference_id='CTRL-1', name='Access Control Policy')
        self.control.frameworks.add(self.framework)

    def test_create_and_list_risks(self):
        url = '/api/risks/'
        payload = {
            'title': 'Unauthorized access in production',
            'description': 'Privilege escalation risk in production systems',
            'status': 'identified',
            'owner': 'Security Team',
            'project': self.project.id,
            'likelihood': 4,
            'impact': 5,
            'asset_ids': [self.asset.id],
            'control_ids': [self.control.id],
            'framework_ids': [self.framework.id],
        }

        create_response = self.client.post(url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['title'], payload['title'])
        self.assertEqual(create_response.data['severity_label'], 'Critical')

        list_response = self.client.get(url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 1)
        self.assertEqual(list_response.data['results'][0]['title'], payload['title'])

    def test_risk_summary_endpoint(self):
        risk = models.Risk.objects.create(
            title='Third-party outage',
            project=self.project,
            likelihood=3,
            impact=3,
        )
        risk.frameworks.add(self.framework)

        response = self.client.get('/api/risks/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_risks'], 1)
        self.assertIn('by_status', response.data)
        self.assertIn('by_severity', response.data)

    def test_dashboard_counts(self):
        models.Risk.objects.create(title='Data breach', project=self.project)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['projects'], 1)
        self.assertEqual(response.data['risks'], 1)

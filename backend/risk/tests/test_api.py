from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from risk import models


class RiskApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username='tester', password='password123')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        self.framework = models.Framework.objects.create(code='NIST-CSF', name='NIST Cybersecurity Framework')
        self.project = models.Project.objects.create(name='New Product Launch')
        self.asset = models.Asset.objects.create(name='Customer Portal', asset_type='application', project=self.project)
        self.framework_control = models.FrameworkControl.objects.create(
            framework=self.framework,
            control_id='AC-01',
            title='Access Control Policy',
        )
        self.control = models.Control.objects.create(reference_id='CTRL-1', name='Access Control Policy')
        self.control.frameworks.add(self.framework)
        self.control.framework_controls.add(self.framework_control)

    def _risk_payload(self):
        return {
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

    def test_authentication_required(self):
        self.client.credentials()
        response = self.client.get('/api/risks/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_list_update_delete_risk(self):
        create_response = self.client.post('/api/risks/', self._risk_payload(), format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        risk_id = create_response.data['id']
        self.assertEqual(create_response.data['severity_label'], 'Critical')

        controls_payload = create_response.data['controls']
        self.assertEqual(len(controls_payload), 1)
        control_record = controls_payload[0]
        self.assertEqual(control_record['reference_id'], 'CTRL-1')
        self.assertEqual(control_record['framework_controls'][0]['control_id'], 'AC-01')

        list_response = self.client.get('/api/risks/?status=identified')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 1)

        update_response = self.client.patch(f'/api/risks/{risk_id}/', {'status': 'mitigating'}, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['status'], 'mitigating')

        delete_response = self.client.delete(f'/api/risks/{risk_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(models.Risk.objects.count(), 0)

    def test_filter_by_framework(self):
        self.client.post('/api/risks/', self._risk_payload(), format='json')
        response = self.client.get('/api/risks/?framework=NIST-CSF')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_control_list_includes_framework_controls(self):
        response = self.client.get('/api/controls/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        results = payload.get('results', payload)
        self.assertTrue(any(item['framework_controls'] for item in results))
        first_control = results[0]
        self.assertEqual(first_control['framework_controls'][0]['control_id'], 'AC-01')

    def test_create_control_with_framework_controls(self):
        payload = {
            'reference_id': 'CTRL-99',
            'name': 'Privileged Access Review',
            'framework_control_ids': [self.framework_control.id],
        }
        response = self.client.post('/api/controls/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['framework_controls'][0]['control_id'], 'AC-01')
        framework_codes = {item['code'] for item in response.data['frameworks']}
        self.assertIn(self.framework.code, framework_codes)

    def test_control_filter_by_framework_control(self):
        response = self.client.get(f'/api/controls/?framework_control={self.framework_control.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_framework_control_listing_endpoint(self):
        response = self.client.get('/api/framework-controls/?framework=NIST-CSF')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        results = payload.get('results', payload)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]['framework_code'], 'NIST-CSF')

    def test_risk_summary_and_dashboard(self):
        risk = models.Risk.objects.create(
            title='Third-party outage',
            project=self.project,
            owner='Ops',
            likelihood=3,
            impact=3,
        )
        risk.frameworks.add(self.framework)

        summary_response = self.client.get('/api/risks/summary/')
        self.assertEqual(summary_response.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_response.data['total_risks'], 1)
        self.assertIn('by_status', summary_response.data)
        self.assertIn('by_severity', summary_response.data)

        dashboard_response = self.client.get('/api/dashboard/')
        self.assertEqual(dashboard_response.status_code, status.HTTP_200_OK)
        self.assertEqual(dashboard_response.data['projects'], 1)
        self.assertEqual(dashboard_response.data['risks'], 1)
        self.assertEqual(dashboard_response.data['frameworks'], 1)

    def test_framework_list(self):
        response = self.client.get('/api/frameworks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_asset_filter_by_type(self):
        response = self.client.get('/api/assets/?asset_type=application')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        results = payload.get('results', payload)
        self.assertGreaterEqual(len(results), 1)
        self.assertTrue(all(item['asset_type'] == 'application' for item in results))

    def test_seeded_fixtures_accessible(self):
        models.Framework.objects.all().delete()
        self.assertEqual(models.Framework.objects.count(), 0)
        self.client.credentials()
        from django.core.management import call_command

        call_command('loaddata', 'frameworks')
        self.assertGreater(models.Framework.objects.count(), 0)

    def test_user_suggestions_endpoint(self):
        response = self.client.get('/api/users/suggestions/?q=test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data
        results = payload.get('results', payload)
        usernames = [item.get('username') for item in results]
        self.assertIn('tester', usernames)

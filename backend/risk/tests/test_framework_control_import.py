import json
import tempfile
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase

from risk import models
from risk.services import framework_controls


class FrameworkControlImportTests(TestCase):
    def setUp(self):
        self.framework = models.Framework.objects.create(
            code='TEST-FW',
            name='Test Framework',
        )

    def _write_sample_file(self, *, control_title='Access Control Policy') -> Path:
        payload = {
            'response': {
                'elements': {
                    'elements': [
                        {
                            'element_type': 'control',
                            'element_identifier': 'AC-01',
                            'title': control_title,
                        },
                        {
                            'element_type': 'control_enhancement',
                            'element_identifier': 'AC-01(01)',
                            'title': 'Access Control Enhancement',
                        },
                        {
                            'element_type': 'discussion',
                            'element_identifier': 'AC-01-discussion',
                            'title': 'Narrative text',
                        },
                    ]
                }
            }
        }
        handle = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False)
        json.dump(payload, handle)
        handle.flush()
        handle.close()
        path = Path(handle.name)
        self.addCleanup(lambda: path.exists() and path.unlink())
        return path

    def test_load_cprt_controls_filters_by_element_type(self):
        sample_path = self._write_sample_file()
        records = list(framework_controls.load_cprt_controls(sample_path, element_types=['control']))
        self.assertEqual(len(records), 1)
        record = records[0]
        self.assertEqual(record.control_id, 'AC-01')
        self.assertEqual(record.element_type, 'control')
        self.assertEqual(record.title, 'Access Control Policy')

    def test_import_controls_from_cprt_creates_and_updates_rows(self):
        sample_path = self._write_sample_file()
        created, updated = framework_controls.import_controls_from_cprt(sample_path, self.framework)
        self.assertEqual(created, 2)
        self.assertEqual(updated, 0)
        self.assertEqual(models.FrameworkControl.objects.filter(framework=self.framework).count(), 2)

        updated_path = self._write_sample_file(control_title='Access Control Policy (Revised)')
        created_again, updated_again = framework_controls.import_controls_from_cprt(updated_path, self.framework)
        self.assertEqual(created_again, 0)
        self.assertEqual(updated_again, 2)
        refreshed = models.FrameworkControl.objects.get(framework=self.framework, control_id='AC-01')
        self.assertEqual(refreshed.title, 'Access Control Policy (Revised)')

    def test_management_command_imports_controls(self):
        sample_path = self._write_sample_file()
        call_command(
            'import_cprt_controls',
            '--file', str(sample_path),
            '--framework-code', 'CMD-FW',
            '--framework-name', 'Command Framework',
        )
        framework = models.Framework.objects.get(code='CMD-FW')
        self.assertEqual(framework.name, 'Command Framework')
        self.assertEqual(models.FrameworkControl.objects.filter(framework=framework).count(), 2)

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from risk import models
from risk.services import framework_controls


class Command(BaseCommand):
    help = 'Import framework control identifiers from a CPRT JSON export.'

    def add_arguments(self, parser):
        parser.add_argument('--file', required=True, help='Path to a CPRT JSON export file.')
        parser.add_argument('--framework-code', required=True, help='Framework code to attach controls to.')
        parser.add_argument('--framework-name', help='Friendly name for the framework (used when creating it).')
        parser.add_argument('--framework-description', default='', help='Optional description for the framework.')
        parser.add_argument(
            '--element-types',
            nargs='+',
            default=list(framework_controls.DEFAULT_ELEMENT_TYPES),
            help='Element types to import (default: control control_enhancement).',
        )

    def handle(self, *args, **options):
        file_path = Path(options['file']).expanduser()
        if not file_path.exists():
            raise CommandError(f'File not found: {file_path}')

        framework_code = options['framework_code']
        framework_name = options.get('framework_name') or framework_code
        framework_description = options.get('framework_description', '')
        element_types = options.get('element_types')

        framework, created = models.Framework.objects.get_or_create(
            code=framework_code,
            defaults={'name': framework_name, 'description': framework_description},
        )

        updated_fields = []
        if not created:
            if framework_name and framework.name != framework_name:
                framework.name = framework_name
                updated_fields.append('name')
            if framework_description is not None and framework.description != framework_description:
                framework.description = framework_description
                updated_fields.append('description')
            if updated_fields:
                framework.save(update_fields=updated_fields)

        created_count, updated_count = framework_controls.import_controls_from_cprt(
            file_path,
            framework,
            element_types=element_types,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Imported {created_count} controls ({updated_count} updated) for framework {framework.code}. '
                f'Source: {file_path.name}'
            )
        )

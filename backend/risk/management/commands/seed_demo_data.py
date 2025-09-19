from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from risk import models


class Command(BaseCommand):
    help = 'Seed demo data for the Risk Stack MVP.'

    def handle(self, *args, **options):
        frameworks = [
            ('NIST-CSF', 'NIST Cybersecurity Framework', 'Framework for managing cybersecurity risk.'),
            ('ISO-27001', 'ISO/IEC 27001', 'Information security management system standard.'),
            ('PCI-DSS', 'PCI DSS', 'Payment card industry security standard.'),
            ('HIPAA', 'HIPAA Security Rule', 'Safeguards to protect electronic health information.'),
        ]

        for code, name, description in frameworks:
            models.Framework.objects.get_or_create(
                code=code,
                defaults={'name': name, 'description': description},
            )

        project, _ = models.Project.objects.get_or_create(
            name='Security Hardening Program',
            defaults={'owner': 'Risk Team', 'status': 'active'},
        )

        asset, _ = models.Asset.objects.get_or_create(
            name='Customer Portal',
            project=project,
            defaults={'asset_type': 'application', 'business_owner': 'Product'},
        )

        control, _ = models.Control.objects.get_or_create(
            reference_id='CTRL-001',
            defaults={'name': 'Multi-factor Authentication', 'description': 'Require MFA for privileged access.'},
        )
        control.frameworks.set(models.Framework.objects.filter(code__in=['NIST-CSF', 'ISO-27001']))

        risk, _ = models.Risk.objects.get_or_create(
            title='Unauthorized Administrative Access',
            defaults={
                'project': project,
                'owner': 'Security Team',
                'likelihood': 4,
                'impact': 5,
                'status': 'mitigating',
                'mitigation_plan': 'Roll out MFA to all admin accounts and monitor privileged sessions.',
            },
        )
        risk.assets.set([asset])
        risk.controls.set([control])
        risk.frameworks.set(models.Framework.objects.filter(code__in=['NIST-CSF', 'ISO-27001']))

        models.Finding.objects.get_or_create(
            title='MFA rollout incomplete',
            risk=risk,
            defaults={'status': 'in_progress', 'owner': 'IT Operations'},
        )

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username='riskadmin',
            defaults={'email': 'riskadmin@example.com'},
        )

        if created:
            user.set_password('RiskStack123!')
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS("Created default admin user 'riskadmin' / 'RiskStack123!'."))

        token, _ = Token.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
        self.stdout.write(f"API token for 'riskadmin': {token.key}")

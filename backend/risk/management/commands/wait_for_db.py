from django.core.management.base import BaseCommand, CommandError
from django.db import connections
from django.db.utils import OperationalError
import time


class Command(BaseCommand):
    help = 'Block until the default database connection is available.'

    def add_arguments(self, parser):
        parser.add_argument('--timeout', type=int, default=60, help='Seconds to wait before failing (default: 60).')

    def handle(self, *args, **options):
        timeout = options['timeout']
        start = time.time()
        self.stdout.write('Waiting for database...')

        while True:
            try:
                connections['default'].ensure_connection()
            except OperationalError:
                elapsed = time.time() - start
                if elapsed >= timeout:
                    raise CommandError('Database unavailable after {} seconds.'.format(timeout))
                time.sleep(1)
            else:
                break

        self.stdout.write(self.style.SUCCESS('Database available.'))

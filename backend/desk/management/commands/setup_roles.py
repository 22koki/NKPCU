from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = "Create application role groups without demo accounts or records."

    def handle(self, *args, **options):
        for name in ["Staff", "Technician", "Supervisor"]:
            Group.objects.get_or_create(name=name)
        self.stdout.write(
            self.style.SUCCESS("Role groups ready. Assign groups through Django admin.")
        )

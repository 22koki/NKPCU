import os
from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Group
from django.utils import timezone
from django.db import transaction
from desk.models import Asset, Ticket, TicketNote, Maintenance, Article, AuditEvent


class Command(BaseCommand):
    help = "Create fictional demonstration records. Safe to rerun; does not reset existing passwords."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Demo seeding is disabled when DJANGO_DEBUG=false.")
        password = os.getenv("DEMO_PASSWORD", "DemoCoffee2026!")
        people = [
            ("supervisor", "Alex", "Supervisor", "Supervisor"),
            ("technician", "Sam", "Technician", "Technician"),
            ("staff", "Jordan", "Staff", "Staff"),
        ]
        users = {}
        for username, first, last, group in people:
            u, created = User.objects.get_or_create(
                username=username, defaults={"first_name": first, "last_name": last}
            )
            if created:
                u.set_password(password)
                u.save()
            u.groups.add(Group.objects.get_or_create(name=group)[0])
            users[username] = u
        records = [
            (
                "DEMO-001",
                "Accounts workstation",
                "Desktop",
                "Finance",
                "Head office",
                "Jordan Staff",
                "Operational",
            ),
            (
                "DEMO-002",
                "Shared office printer",
                "Printer",
                "Administration",
                "Head office",
                "Office team",
                "Under repair",
            ),
            (
                "DEMO-003",
                "Meeting room access point",
                "Network",
                "ICT",
                "Head office",
                "ICT team",
                "Operational",
            ),
            (
                "DEMO-004",
                "Field support laptop",
                "Laptop",
                "Operations",
                "Demo branch",
                "Field team",
                "Operational",
            ),
        ]
        assets = []
        for tag, name, kind, department, location, custodian, status in records:
            a, _ = Asset.objects.get_or_create(
                tag=tag,
                defaults={
                    "name": name,
                    "kind": kind,
                    "department": department,
                    "location": location,
                    "custodian": custodian,
                    "status": status,
                    "serial_number": "FICTIONAL-" + tag,
                    "warranty_until": timezone.localdate() + timedelta(days=180),
                },
            )
            assets.append(a)
        samples = [
            (
                "Shared printer loses connection",
                "Hardware",
                "High",
                "In progress",
                assets[1],
                5,
            ),
            ("ERP report fails to export", "Software", "Medium", "Open", assets[0], 2),
            (
                "Meeting room Wi-Fi disconnects",
                "Network",
                "High",
                "Waiting",
                assets[2],
                12,
            ),
            ("Email profile restored", "Email", "Low", "Resolved", assets[3], 30),
            (
                "Workstation startup issue fixed",
                "Hardware",
                "Medium",
                "Closed",
                assets[0],
                52,
            ),
            (
                "Request an approved software installation",
                "Access",
                "Low",
                "Open",
                assets[3],
                1,
            ),
        ]
        for title, category, priority, status, asset, age in samples:
            start = timezone.now() - timedelta(hours=age)
            resolution = (
                "Demonstration fix: configuration checked and tested with the requester."
                if status in ("Resolved", "Closed")
                else ""
            )
            t, created = Ticket.objects.get_or_create(
                title=title,
                requester=users["staff"],
                defaults={
                    "description": "Fictional demonstration request. Please investigate and record the steps taken.",
                    "category": category,
                    "priority": priority,
                    "status": status,
                    "asset": asset,
                    "department": asset.department,
                    "location": asset.location,
                    "assignee": users["technician"] if status != "Open" else None,
                    "created_at": start,
                    "due_at": start
                    + timedelta(hours={"High": 8, "Medium": 24, "Low": 72}[priority]),
                    "resolution": resolution,
                    "resolved_at": start + timedelta(hours=3) if resolution else None,
                },
            )
            if created:
                AuditEvent.objects.create(
                    actor=users["staff"],
                    action="Request submitted (demo)",
                    ticket=t,
                    asset=asset,
                )
                if status != "Open":
                    AuditEvent.objects.create(
                        actor=users["technician"],
                        action="Status changed to " + status + " (demo)",
                        ticket=t,
                        asset=asset,
                    )
                if status == "In progress":
                    TicketNote.objects.create(
                        ticket=t,
                        author=users["technician"],
                        body="Checking the connection and printer settings. This is a demonstration note.",
                    )
        for a, title, days in [
            (assets[0], "Workstation health check", 3),
            (assets[2], "Access point inspection", -1),
            (assets[3], "Laptop maintenance", 7),
        ]:
            Maintenance.objects.get_or_create(
                asset=a,
                title=title,
                defaults={
                    "due_date": timezone.localdate() + timedelta(days=days),
                    "assignee": users["technician"],
                },
            )
        guides = [
            (
                "Before reporting a printer problem",
                "Hardware",
                "1. Check that the printer is powered on.\n2. Check for paper or error messages.\n3. Confirm the selected printer name.\n4. Submit a support request with the device tag and error message.\n\nDo not open the printer casing. Ask ICT for help if the problem persists.",
            ),
            (
                "How to submit a useful ICT request",
                "Getting started",
                "1. Give the problem a short, clear title.\n2. Explain what you were trying to do.\n3. Include the exact error text and when it started.\n4. Select the device if known.\n5. Explain who is affected and the impact.\n\nNever include passwords or confidential farmer records.",
            ),
            (
                "What to do when connectivity drops",
                "Network",
                "1. Check whether only your device is affected.\n2. Note the time and location.\n3. Save work locally where appropriate.\n4. Report the problem to ICT.\n\nAvoid changing router settings or installing unapproved software.",
            ),
        ]
        for title, category, body in guides:
            Article.objects.get_or_create(
                title=title,
                defaults={
                    "category": category,
                    "body": body,
                    "published": True,
                    "author": users["supervisor"],
                },
            )
        self.stdout.write(
            self.style.SUCCESS(
                "Demo ready. Accounts: supervisor / technician / staff. Initial password: "
                + password
            )
        )

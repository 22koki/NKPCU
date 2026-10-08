import json
from datetime import timedelta
from django.test import TestCase, Client
from django.contrib.auth.models import User, Group
from django.utils import timezone
from django.core.cache import cache
from .models import Asset, Ticket, AuditEvent, Maintenance, Article


class ServiceDeskTests(TestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user("employee", password="TestPassword123!")
        self.other = User.objects.create_user("other", password="TestPassword123!")
        self.tech = User.objects.create_user("tech", password="TestPassword123!")
        self.supervisor = User.objects.create_user(
            "supervisor", password="TestPassword123!"
        )
        self.tech.groups.add(Group.objects.create(name="Technician"))
        self.supervisor.groups.add(Group.objects.create(name="Supervisor"))
        self.asset = Asset.objects.create(
            tag="A-001",
            name="Office printer",
            kind="Printer",
            location="HQ",
            department="Finance",
        )
        self.ticket = Ticket.objects.create(
            title="Printer disconnected",
            description="No connection",
            category="Hardware",
            department="Finance",
            location="HQ",
            requester=self.staff,
            asset=self.asset,
            due_at=timezone.now() + timedelta(hours=24),
        )

    def call(self, path, method="get", data=None, user=None):
        if user:
            self.client.force_login(user)
        return (
            getattr(self.client, method)(
                "/api/" + path,
                data=json.dumps(data or {}),
                content_type="application/json",
            )
            if method != "get"
            else self.client.get("/api/" + path)
        )

    def test_auth_required(self):
        self.assertEqual(self.call("tickets/").status_code, 401)

    def test_staff_cannot_view_other_request(self):
        self.assertEqual(
            self.call(f"tickets/{self.ticket.pk}/", user=self.other).status_code, 404
        )
        self.assertEqual(self.call("tickets/").json()["items"], [])

    def test_staff_cannot_assign_or_register_assets(self):
        self.assertEqual(
            self.call(
                f"tickets/{self.ticket.pk}/",
                "patch",
                {"assignee_id": self.tech.pk},
                self.staff,
            ).status_code,
            403,
        )
        self.assertEqual(self.call("assets/", "post", {}, self.staff).status_code, 403)

    def test_submit_request_links_asset_and_sets_due_date(self):
        result = self.call(
            "tickets/",
            "post",
            {
                "title": "New problem",
                "description": "Details",
                "category": "Network",
                "department": "ICT",
                "location": "HQ",
                "priority": "Critical",
                "asset": self.asset.pk,
            },
            self.staff,
        )
        self.assertEqual(result.status_code, 201)
        ticket = Ticket.objects.get(pk=result.json()["id"])
        self.assertEqual(ticket.requester, self.staff)
        self.assertAlmostEqual(
            (ticket.due_at - ticket.created_at).total_seconds() / 3600, 4, places=2
        )
        self.assertEqual(ticket.events.count(), 1)

    def test_invalid_input_does_not_create_ticket(self):
        before = Ticket.objects.count()
        self.assertEqual(
            self.call(
                "tickets/", "post", {"title": "x", "priority": "Urgent"}, self.staff
            ).status_code,
            400,
        )
        self.assertEqual(Ticket.objects.count(), before)

    def test_resolution_requires_notes_and_atomic_assignment(self):
        response = self.call(
            f"tickets/{self.ticket.pk}/",
            "patch",
            {"status": "Resolved", "assignee_id": self.tech.pk},
            self.tech,
        )
        self.assertEqual(response.status_code, 400)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, "Open")
        self.assertIsNone(self.ticket.assignee)
        self.assertEqual(AuditEvent.objects.count(), 0)

    def test_full_resolution_confirmation_and_reopen_workflow(self):
        path = f"tickets/{self.ticket.pk}/"
        response = self.call(
            path,
            "patch",
            {
                "status": "Resolved",
                "resolution": "Reconfigured and tested.",
                "assignee_id": self.tech.pk,
            },
            self.tech,
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["resolved_at"])
        self.assertEqual(
            self.call(path, "patch", {"action": "confirm"}, self.tech).status_code, 403
        )
        self.assertEqual(
            self.call(path, "patch", {"action": "confirm"}, self.staff).json()[
                "status"
            ],
            "Closed",
        )
        self.assertEqual(
            self.call(path, "patch", {"action": "reopen"}, self.staff).json()["status"],
            "Open",
        )
        self.ticket.refresh_from_db()
        self.assertIsNone(self.ticket.resolved_at)
        self.assertEqual(self.ticket.resolution, "")
        self.assertGreater(self.ticket.due_at, timezone.now())

    def test_invalid_assignee_is_rejected(self):
        self.assertEqual(
            self.call(
                f"tickets/{self.ticket.pk}/",
                "patch",
                {"assignee_id": self.staff.pk},
                self.tech,
            ).status_code,
            400,
        )

    def test_priority_change_updates_target(self):
        self.call(
            f"tickets/{self.ticket.pk}/", "patch", {"priority": "Critical"}, self.tech
        )
        self.ticket.refresh_from_db()
        self.assertEqual(
            self.ticket.due_at, self.ticket.created_at + timedelta(hours=4)
        )

    def test_staff_can_discuss_own_ticket_only(self):
        path = f"tickets/{self.ticket.pk}/notes/"
        self.assertEqual(
            self.call(path, "post", {"body": "Extra details"}, self.other).status_code,
            404,
        )
        self.assertEqual(
            self.call(path, "post", {"body": "Extra details"}, self.staff).status_code,
            201,
        )

    def test_asset_history_and_qr_code(self):
        detail = self.call(f"assets/{self.asset.pk}/", user=self.tech)
        self.assertEqual(len(detail.json()["tickets"]), 1)
        qr = self.call(f"assets/{self.asset.pk}/qr/")
        self.assertEqual(qr.status_code, 200)
        self.assertEqual(qr["Content-Type"], "image/png")
        self.assertTrue(qr.content.startswith(b"\x89PNG"))

    def test_maintenance_completion_preserves_evidence(self):
        m = Maintenance.objects.create(
            asset=self.asset,
            title="Inspection",
            due_date=timezone.localdate(),
            assignee=self.tech,
        )
        path = f"maintenance/{m.pk}/"
        self.assertEqual(
            self.call(path, "patch", {"notes": ""}, self.tech).status_code, 400
        )
        self.assertEqual(
            self.call(
                path, "patch", {"notes": "Inspected and tested."}, self.tech
            ).status_code,
            200,
        )
        m.refresh_from_db()
        self.assertIsNotNone(m.completed_at)
        self.assertEqual(
            self.call(path, "patch", {"notes": "Overwrite"}, self.tech).status_code, 400
        )

    def test_knowledge_review_and_draft_visibility(self):
        Article.objects.create(
            title="Draft",
            category="Network",
            body="Pending review",
            author=self.supervisor,
            published=False,
        )
        self.assertEqual(self.call("articles/", user=self.staff).json()["items"], [])
        self.assertEqual(
            self.call(
                "articles/", "post", {"title": "Unreviewed"}, self.tech
            ).status_code,
            403,
        )
        result = self.call(
            "articles/",
            "post",
            {
                "title": "Approved",
                "category": "Network",
                "body": "Instructions",
                "published": True,
            },
            self.supervisor,
        )
        self.assertEqual(result.status_code, 201)
        self.assertEqual(
            len(self.call("articles/", user=self.staff).json()["items"]), 1
        )

    def test_dashboard_scopes_counts_to_requester(self):
        self.assertEqual(self.call("dashboard/", user=self.other).json()["total"], 0)
        self.assertEqual(self.call("dashboard/", user=self.tech).json()["total"], 1)

    def test_csv_export_blocks_spreadsheet_formula_injection(self):
        self.ticket.title = '=HYPERLINK("evil")'
        self.ticket.save()
        result = self.call("reports/tickets.csv", user=self.staff)
        self.assertIn("'=HYPERLINK", result.content.decode())
        result = self.call("reports/tickets.csv", user=self.other)
        self.assertEqual(len(result.content.decode().splitlines()), 1)

    def test_csrf_required_for_login(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(
            client.post(
                "/api/login/",
                data=json.dumps(
                    {"username": "employee", "password": "TestPassword123!"}
                ),
                content_type="application/json",
            ).status_code,
            403,
        )
        client.get("/api/session/")
        token = client.cookies["csrftoken"].value
        response = client.post(
            "/api/login/",
            data=json.dumps({"username": "employee", "password": "TestPassword123!"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)

    def test_login_attempt_limit(self):
        for _ in range(10):
            self.assertEqual(
                self.call(
                    "login/", "post", {"username": "employee", "password": "wrong"}
                ).status_code,
                401,
            )
        self.assertEqual(
            self.call(
                "login/", "post", {"username": "employee", "password": "wrong"}
            ).status_code,
            429,
        )

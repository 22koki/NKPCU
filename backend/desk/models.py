from django.conf import settings
from django.db import models
from django.utils import timezone


class Asset(models.Model):
    tag = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    kind = models.CharField(
        max_length=30,
        choices=[
            (s, s)
            for s in ["Laptop", "Desktop", "Printer", "Network", "Server", "Other"]
        ],
    )
    serial_number = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    custodian = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=30,
        default="Operational",
        choices=[(s, s) for s in ["Operational", "Under repair", "Retired"]],
    )
    warranty_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tag} · {self.name}"


class Ticket(models.Model):
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=8000)
    category = models.CharField(
        max_length=30,
        choices=[
            (s, s)
            for s in ["Hardware", "Software", "Network", "Email", "Access", "Other"]
        ],
    )
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    priority = models.CharField(
        max_length=20,
        default="Medium",
        choices=[(s, s) for s in ["Low", "Medium", "High", "Critical"]],
    )
    status = models.CharField(
        max_length=30,
        default="Open",
        choices=[
            (s, s) for s in ["Open", "In progress", "Waiting", "Resolved", "Closed"]
        ],
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="requests"
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="assignments",
    )
    asset = models.ForeignKey(
        Asset, on_delete=models.PROTECT, null=True, blank=True, related_name="tickets"
    )
    resolution = models.TextField(blank=True, max_length=8000)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    due_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def reference(self):
        return f"ICT-{self.pk:04d}"


class TicketNote(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    body = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Maintenance(models.Model):
    asset = models.ForeignKey(
        Asset, on_delete=models.PROTECT, related_name="maintenance"
    )
    title = models.CharField(max_length=160)
    due_date = models.DateField()
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, max_length=4000)

    class Meta:
        ordering = ["due_date"]


class Article(models.Model):
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=40)
    body = models.TextField(max_length=16000)
    published = models.BooleanField(default=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]


class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=200)
    ticket = models.ForeignKey(
        Ticket, on_delete=models.PROTECT, null=True, blank=True, related_name="events"
    )
    asset = models.ForeignKey(
        Asset, on_delete=models.PROTECT, null=True, blank=True, related_name="events"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

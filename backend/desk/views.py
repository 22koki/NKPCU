import csv
import io
import json
from datetime import timedelta
from functools import wraps
import qrcode
from django.conf import settings
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse, HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Asset, Ticket, TicketNote, Maintenance, Article, AuditEvent
from .forms import TicketForm, AssetForm, MaintenanceForm, ArticleForm

User = get_user_model()


def role(user):
    if user.is_superuser or user.groups.filter(name="Supervisor").exists():
        return "Supervisor"
    if user.groups.filter(name="Technician").exists():
        return "Technician"
    return "Staff"


def display(user):
    return user.get_full_name() or user.username


def user_data(user):
    return {
        "id": user.pk,
        "username": user.username,
        "name": display(user),
        "role": role(user),
    }


def api(methods=("GET",), technical=False, supervisor=False):
    def decorate(fn):
        @wraps(fn)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                return JsonResponse({"error": "Method not allowed"}, status=405)
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Please sign in."}, status=401)
            r = role(request.user)
            if (technical and r == "Staff") or (supervisor and r != "Supervisor"):
                return JsonResponse(
                    {"error": "You do not have permission to do this."}, status=403
                )
            try:
                if request.method in ("POST", "PATCH"):
                    request.data = json.loads(request.body or "{}")
                    if not isinstance(request.data, dict):
                        raise ValueError("Expected a JSON object.")
                return fn(request, *args, **kwargs)
            except Http404:
                return JsonResponse({"error": "Record not found."}, status=404)
            except (ValueError, TypeError, ValidationError) as exc:
                return JsonResponse({"error": str(exc) or "Invalid input."}, status=400)

        return wrapped

    return decorate


def csrf_failure(request, reason=""):
    return JsonResponse(
        {"error": "Security token expired. Refresh the page and try again."}, status=403
    )


def form_result(form):
    if not form.is_valid():
        raise ValueError(
            "; ".join(
                f'{field}: {", ".join(errors)}' for field, errors in form.errors.items()
            )
        )
    return form.save(commit=False)


def audit(user, action, ticket=None, asset=None):
    AuditEvent.objects.create(actor=user, action=action, ticket=ticket, asset=asset)


def scoped(request):
    qs = Ticket.objects.select_related("requester", "assignee", "asset")
    return qs.filter(requester=request.user) if role(request.user) == "Staff" else qs


def ticket_data(t):
    return {
        "id": t.pk,
        "reference": t.reference,
        "title": t.title,
        "description": t.description,
        "category": t.category,
        "department": t.department,
        "location": t.location,
        "priority": t.priority,
        "status": t.status,
        "requester": display(t.requester),
        "requester_id": t.requester_id,
        "assignee": display(t.assignee) if t.assignee else None,
        "assignee_id": t.assignee_id,
        "asset_id": t.asset_id,
        "asset": str(t.asset) if t.asset else None,
        "resolution": t.resolution,
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat(),
        "due_at": t.due_at.isoformat(),
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        "overdue": t.status not in ("Resolved", "Closed") and t.due_at < timezone.now(),
    }


def asset_data(a):
    return {
        key: getattr(a, key)
        for key in [
            "id",
            "tag",
            "name",
            "kind",
            "serial_number",
            "location",
            "department",
            "custodian",
            "status",
            "warranty_until",
        ]
    }


def maintenance_data(m):
    return {
        "id": m.pk,
        "asset_id": m.asset_id,
        "asset": str(m.asset),
        "title": m.title,
        "due_date": m.due_date.isoformat(),
        "assignee_id": m.assignee_id,
        "assignee": display(m.assignee),
        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
        "notes": m.notes,
        "overdue": not m.completed_at and m.due_date < timezone.localdate(),
    }


def article_data(a):
    return {
        "id": a.pk,
        "title": a.title,
        "category": a.category,
        "body": a.body,
        "published": a.published,
        "author": display(a.author),
        "updated_at": a.updated_at.isoformat(),
    }


@ensure_csrf_cookie
def session(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    return JsonResponse(
        {"user": user_data(request.user) if request.user.is_authenticated else None}
    )


@ensure_csrf_cookie
def sign_in(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        username = str(data.get("username", "")).strip()[:150]
        password = str(data.get("password", ""))
    except (ValueError, AttributeError):
        return JsonResponse({"error": "Invalid request"}, status=400)
    key = "login:" + request.META.get("REMOTE_ADDR", "unknown")
    if cache.get(key, 0) >= 10:
        return JsonResponse(
            {"error": "Too many attempts. Try again in 10 minutes."}, status=429
        )
    user = authenticate(request, username=username, password=password)
    if not user:
        cache.set(key, cache.get(key, 0) + 1, 600)
        return JsonResponse({"error": "Incorrect username or password."}, status=401)
    cache.delete(key)
    login(request, user)
    return JsonResponse({"user": user_data(user)})


@api(("POST",))
def sign_out(request):
    logout(request)
    return JsonResponse({"ok": True})


@api()
def bootstrap(request):
    return JsonResponse(
        {
            "user": user_data(request.user),
            "technicians": [
                user_data(u)
                for u in User.objects.filter(is_active=True)
                .filter(
                    Q(groups__name__in=["Technician", "Supervisor"])
                    | Q(is_superuser=True)
                )
                .distinct()
            ],
            "assets": [
                (
                    asset_data(a)
                    if role(request.user) != "Staff"
                    else {"id": a.pk, "tag": a.tag, "name": a.name}
                )
                for a in Asset.objects.exclude(status="Retired").order_by("tag")
            ],
        }
    )


@api(("GET", "POST"))
def tickets(request):
    if request.method == "GET":
        qs = scoped(request)
        term = request.GET.get("q", "").strip()
        if term:
            qs = qs.filter(
                Q(title__icontains=term)
                | Q(description__icontains=term)
                | Q(requester__username__icontains=term)
            )
        if request.GET.get("status"):
            qs = qs.filter(status=request.GET["status"])
        return JsonResponse({"items": [ticket_data(t) for t in qs]})
    with transaction.atomic():
        t = form_result(TicketForm(request.data))
        if t.asset and t.asset.status == "Retired":
            raise ValueError("Choose an active asset.")
        t.requester = request.user
        t.due_at = timezone.now() + timedelta(
            hours={"Critical": 4, "High": 8, "Medium": 24, "Low": 72}[t.priority]
        )
        t.save()
        audit(request.user, "Request submitted", ticket=t, asset=t.asset)
    return JsonResponse(ticket_data(t), status=201)


@api(("GET", "PATCH"))
def ticket_detail(request, pk):
    if request.method == "PATCH":
        with transaction.atomic():
            t = get_object_or_404(
                scoped(request).select_for_update(of=("self",)), pk=pk
            )
            data = request.data
            action = data.get("action", "update")
            before = t.status
            if action == "confirm":
                if t.requester_id != request.user.pk:
                    return JsonResponse(
                        {"error": "Only the requester can confirm."}, status=403
                    )
                if t.status != "Resolved":
                    raise ValueError("Only a resolved request can be confirmed.")
                t.status = "Closed"
            elif action == "reopen":
                if t.status not in ("Resolved", "Closed"):
                    raise ValueError(
                        "Only resolved or closed requests can be reopened."
                    )
                t.status = "Open"
                t.resolved_at = None
                t.resolution = ""
                t.due_at = timezone.now() + timedelta(
                    hours={"Critical": 4, "High": 8, "Medium": 24, "Low": 72}[
                        t.priority
                    ]
                )
            elif action == "update":
                if role(request.user) == "Staff":
                    return JsonResponse(
                        {"error": "Only ICT staff can update the work queue."},
                        status=403,
                    )
                if t.status == "Closed":
                    raise ValueError("Reopen the request before making changes.")
                if "assignee_id" in data:
                    value = data["assignee_id"]
                    assignee = (
                        get_object_or_404(User, pk=value, is_active=True)
                        if value
                        else None
                    )
                    if assignee and role(assignee) == "Staff":
                        raise ValueError("Choose a technician or supervisor.")
                    if t.assignee_id != (assignee.pk if assignee else None):
                        audit(
                            request.user,
                            "Assigned to "
                            + (display(assignee) if assignee else "Unassigned"),
                            ticket=t,
                            asset=t.asset,
                        )
                    t.assignee = assignee
                if "priority" in data:
                    if data["priority"] not in dict(
                        Ticket._meta.get_field("priority").choices
                    ):
                        raise ValueError("Invalid priority.")
                    if t.priority != data["priority"]:
                        t.priority = data["priority"]
                        t.due_at = t.created_at + timedelta(
                            hours={"Critical": 4, "High": 8, "Medium": 24, "Low": 72}[
                                t.priority
                            ]
                        )
                        audit(
                            request.user,
                            "Priority changed to " + t.priority,
                            ticket=t,
                            asset=t.asset,
                        )
                if "status" in data:
                    target = data["status"]
                    if target not in ["Open", "In progress", "Waiting", "Resolved"]:
                        raise ValueError(
                            "Invalid status. Closure requires requester confirmation."
                        )
                    if t.status == "Resolved" and target != "Resolved":
                        raise ValueError("Use Reopen to resume this request.")
                    t.status = target
                    if target == "Resolved":
                        resolution = str(data.get("resolution", t.resolution)).strip()
                        if not resolution or len(resolution) > 8000:
                            raise ValueError(
                                "Provide a resolution note (maximum 8000 characters)."
                            )
                        t.resolution = resolution
                        if not t.resolved_at:
                            t.resolved_at = timezone.now()
            else:
                raise ValueError("Unknown action.")
            t.full_clean()
            t.save()
            if before != t.status:
                audit(
                    request.user,
                    f"Status changed: {before} → {t.status}",
                    ticket=t,
                    asset=t.asset,
                )
    t = get_object_or_404(scoped(request), pk=pk)
    result = ticket_data(t)
    result["notes"] = [
        {
            "id": n.pk,
            "body": n.body,
            "author": display(n.author),
            "created_at": n.created_at.isoformat(),
        }
        for n in t.notes.select_related("author")
    ]
    result["events"] = [
        {
            "id": e.pk,
            "action": e.action,
            "actor": display(e.actor),
            "created_at": e.created_at.isoformat(),
        }
        for e in t.events.select_related("actor")
    ]
    return JsonResponse(result)


@api(("POST",))
def ticket_notes(request, pk):
    t = get_object_or_404(scoped(request), pk=pk)
    body = str(request.data.get("body", "")).strip()
    if not body or len(body) > 4000:
        raise ValueError("Enter a note of 1–4000 characters.")
    with transaction.atomic():
        TicketNote.objects.create(ticket=t, author=request.user, body=body)
        audit(request.user, "Discussion note added", ticket=t, asset=t.asset)
    return JsonResponse({"ok": True}, status=201)


@api(("GET", "POST"), technical=True)
def assets(request):
    if request.method == "GET":
        return JsonResponse(
            {"items": [asset_data(a) for a in Asset.objects.order_by("tag")]}
        )
    with transaction.atomic():
        a = form_result(AssetForm(request.data))
        a.save()
        audit(request.user, "Asset registered", asset=a)
    return JsonResponse(asset_data(a), status=201)


@api(("GET", "PATCH"), technical=True)
def asset_detail(request, pk):
    a = get_object_or_404(Asset, pk=pk)
    if request.method == "PATCH":
        with transaction.atomic():
            a = get_object_or_404(Asset.objects.select_for_update(), pk=pk)
            old = asset_data(a)
            a = form_result(AssetForm({**old, **request.data}, instance=a))
            a.save()
            audit(request.user, "Asset details updated", asset=a)
    result = asset_data(a)
    result["tickets"] = [
        ticket_data(t)
        for t in a.tickets.select_related("requester", "assignee", "asset")
    ]
    result["maintenance"] = [
        maintenance_data(m) for m in a.maintenance.select_related("asset", "assignee")
    ]
    result["events"] = [
        {
            "id": e.pk,
            "action": e.action,
            "actor": display(e.actor),
            "created_at": e.created_at.isoformat(),
        }
        for e in a.events.select_related("actor")
    ]
    return JsonResponse(result)


@api(technical=True)
def asset_qr(request, pk):
    a = get_object_or_404(Asset, pk=pk)
    img = qrcode.make(f"{settings.PUBLIC_APP_URL}/?asset={a.pk}")
    output = io.BytesIO()
    img.save(output, format="PNG")
    response = HttpResponse(output.getvalue(), content_type="image/png")
    response["Content-Disposition"] = f'inline; filename="asset-{a.pk}.png"'
    return response


@api(("GET", "POST"), technical=True)
def maintenance(request):
    if request.method == "GET":
        return JsonResponse(
            {
                "items": [
                    maintenance_data(m)
                    for m in Maintenance.objects.select_related("asset", "assignee")
                ]
            }
        )
    with transaction.atomic():
        m = form_result(MaintenanceForm(request.data))
        if role(m.assignee) == "Staff" or not m.assignee.is_active:
            raise ValueError("Choose an active ICT assignee.")
        if m.asset.status == "Retired":
            raise ValueError("Choose an active asset.")
        m.save()
        audit(request.user, "Maintenance scheduled: " + m.title, asset=m.asset)
    return JsonResponse(maintenance_data(m), status=201)


@api(("PATCH",), technical=True)
def maintenance_detail(request, pk):
    with transaction.atomic():
        m = get_object_or_404(Maintenance.objects.select_for_update(), pk=pk)
        if m.completed_at:
            raise ValueError("This maintenance task is already completed.")
        notes = str(request.data.get("notes", "")).strip()
        if not notes or len(notes) > 4000:
            raise ValueError("Provide completion notes (maximum 4000 characters).")
        m.notes = notes
        m.completed_at = timezone.now()
        m.save()
        audit(request.user, "Maintenance completed: " + m.title, asset=m.asset)
    return JsonResponse(maintenance_data(m))


@api(("GET", "POST"))
def articles(request):
    if request.method == "POST":
        if role(request.user) != "Supervisor":
            return JsonResponse(
                {"error": "Only supervisors can publish guides."}, status=403
            )
        with transaction.atomic():
            a = form_result(ArticleForm(request.data))
            a.author = request.user
            a.save()
            audit(request.user, "Knowledge guide created: " + a.title)
        return JsonResponse(article_data(a), status=201)
    qs = Article.objects.select_related("author")
    if role(request.user) != "Supervisor":
        qs = qs.filter(published=True)
    return JsonResponse({"items": [article_data(a) for a in qs]})


@api(("PATCH",), supervisor=True)
def article_detail(request, pk):
    with transaction.atomic():
        a = get_object_or_404(Article.objects.select_for_update(), pk=pk)
        a = form_result(ArticleForm({**article_data(a), **request.data}, instance=a))
        a.save()
        audit(request.user, "Knowledge guide updated: " + a.title)
    return JsonResponse(article_data(a))


@api()
def dashboard(request):
    ts = list(scoped(request))
    now = timezone.now()
    active = [t for t in ts if t.status not in ("Resolved", "Closed")]
    resolved = [t for t in ts if t.resolved_at]
    avg = (
        sum((t.resolved_at - t.created_at).total_seconds() / 3600 for t in resolved)
        / len(resolved)
        if resolved
        else None
    )
    data = {
        "total": len(ts),
        "open": len(active),
        "overdue": sum(t.due_at < now for t in active),
        "resolved": len(resolved),
        "average_resolution_hours": round(avg, 1) if avg is not None else None,
        "by_category": [
            {"label": c, "value": sum(t.category == c for t in ts)}
            for c in ["Hardware", "Software", "Network", "Email", "Access", "Other"]
        ],
        "by_status": [
            {"label": s, "value": sum(t.status == s for t in ts)}
            for s in ["Open", "In progress", "Waiting", "Resolved", "Closed"]
        ],
        "recent_tickets": [ticket_data(t) for t in ts[:6]],
    }
    if role(request.user) != "Staff":
        data["assets"] = Asset.objects.count()
        data["maintenance_due"] = Maintenance.objects.filter(
            completed_at__isnull=True,
            due_date__lte=timezone.localdate() + timedelta(days=7),
        ).count()
        data["activity"] = [
            {
                "id": e.pk,
                "actor": display(e.actor),
                "action": e.action,
                "created_at": e.created_at.isoformat(),
            }
            for e in AuditEvent.objects.select_related("actor")[:8]
        ]
    return JsonResponse(data)


@api()
def report(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="ict-support-report.csv"'
    writer = csv.writer(response)
    writer.writerow(
        [
            "Reference",
            "Title",
            "Category",
            "Department",
            "Priority",
            "Status",
            "Requester",
            "Assignee",
            "Asset",
            "Created",
            "Resolved",
            "Resolution hours",
            "Overdue",
        ]
    )

    def safe(value):
        text = str(value or "")
        return "'" + text if text.lstrip().startswith(("=", "+", "-", "@")) else text

    for t in scoped(request):
        hours = (
            round((t.resolved_at - t.created_at).total_seconds() / 3600, 2)
            if t.resolved_at
            else ""
        )
        writer.writerow(
            [
                safe(v)
                for v in [
                    t.reference,
                    t.title,
                    t.category,
                    t.department,
                    t.priority,
                    t.status,
                    display(t.requester),
                    display(t.assignee) if t.assignee else "",
                    str(t.asset) if t.asset else "",
                    t.created_at.isoformat(),
                    t.resolved_at.isoformat() if t.resolved_at else "",
                    hours,
                    ticket_data(t)["overdue"],
                ]
            ]
        )
    return response

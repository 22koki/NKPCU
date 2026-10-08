from django.contrib import admin
from .models import Asset, Ticket, TicketNote, Maintenance, Article, AuditEvent

admin.site.site_header = "NKPCU ICT administration"
for model in (Asset, Ticket, TicketNote, Maintenance, Article):
    admin.site.register(model)


@admin.register(AuditEvent)
class AuditAdmin(admin.ModelAdmin):
    list_display = ["actor", "action", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

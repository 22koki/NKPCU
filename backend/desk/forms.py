from django import forms
from .models import Asset, Ticket, Article, Maintenance


class TicketForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = [
            "title",
            "description",
            "category",
            "department",
            "location",
            "priority",
            "asset",
        ]


class AssetForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = [
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


class MaintenanceForm(forms.ModelForm):
    class Meta:
        model = Maintenance
        fields = ["asset", "title", "due_date", "assignee"]


class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ["title", "category", "body", "published"]

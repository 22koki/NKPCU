from django.urls import path
from . import views

urlpatterns = [
    path("session/", views.session),
    path("login/", views.sign_in),
    path("logout/", views.sign_out),
    path("bootstrap/", views.bootstrap),
    path("dashboard/", views.dashboard),
    path("tickets/", views.tickets),
    path("tickets/<int:pk>/", views.ticket_detail),
    path("tickets/<int:pk>/notes/", views.ticket_notes),
    path("assets/", views.assets),
    path("assets/<int:pk>/", views.asset_detail),
    path("assets/<int:pk>/qr/", views.asset_qr),
    path("maintenance/", views.maintenance),
    path("maintenance/<int:pk>/", views.maintenance_detail),
    path("articles/", views.articles),
    path("articles/<int:pk>/", views.article_detail),
    path("reports/tickets.csv", views.report),
]

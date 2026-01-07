from django.urls import path
from . import views

urlpatterns = [
    path("pockets/", views.PocketListCreate.as_view(), name='pocket-list'),
    path ("pockets/delete/<int:pk>/", views.PocketDelete.as_view(), name='delete-pocket')
]

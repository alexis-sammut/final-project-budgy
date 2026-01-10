from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListCreate.as_view(), name="category-list"),
    path("categories/delete/<int:pk>/", views.CategoryDelete.as_view(), name="delete-category"),
    
    # Pockets
    path("pockets/", views.PocketListCreate.as_view(), name="pocket-list"),
    path("pockets/delete/<int:pk>/", views.PocketDelete.as_view(), name="delete-pocket"),
    path("pockets/update/<int:pk>/", views.PocketUpdate.as_view(), name="update-pocket"),
]
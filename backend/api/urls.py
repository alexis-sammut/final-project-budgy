from django.urls import path
from . import views

urlpatterns = [
    path("pockets/", views.PocketListCreate.as_view(), name='pocket-list'),
    path("pockets/delete/<int:pk>/", views.PocketDelete.as_view(), name='delete-pocket'),
    path("pockets/update/<int:pk>/", views.PocketUpdate.as_view(), name='update-pocket'),
    path("categories/", views.CategoryListCreate.as_view(), name='category-list'),
    path("categories/delete/<int:pk>/", views.CategoryDelete.as_view(), name='delete-category'),
    path("pockets/<int:pocket_id>/items/", views.ItemListCreate.as_view(), name='item-list'),
    path("items/update/<int:pk>/", views.ItemUpdate.as_view(), name='update-item'),
    path("items/delete/<int:pk>/", views.ItemDelete.as_view(), name='delete-item'),
    
    # Income sorting endpoints
    path("income-sort/calculate/", views.CalculateIncomeSortView.as_view(), name='calculate-income-sort'),
    path("income-sort/create/", views.IncomeSortCreateView.as_view(), name='create-income-sort'),
    path("income-sort/list/", views.IncomeSortListView.as_view(), name='list-income-sorts'),
    path("income-sort/<int:pk>/", views.IncomeSortDetailView.as_view(), name='income-sort-detail'),
]
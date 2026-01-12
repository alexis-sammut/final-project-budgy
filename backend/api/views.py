from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import UserSerializer, PocketSerializer, CategorySerializer, ItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Pocket, Category, Item

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
class PocketListCreate(generics.ListCreateAPIView):
    serializer_class = PocketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Pocket.objects.filter(author=user)
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)
            
class PocketDelete(generics.DestroyAPIView):
    serializer_class = PocketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Pocket.objects.filter(author=user)

class PocketUpdate(generics.UpdateAPIView):
    serializer_class = PocketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Pocket.objects.filter(author=user)
    
    def perform_update(self, serializer):
        pocket = serializer.save()
        
        # Auto-manage "Other" item when pocket amount changes
        self.update_other_item(pocket)
    
    def update_other_item(self, pocket):
        """
        Auto-create or update the "Other" item based on pocket amount and existing items
        """
        # Get all non-other items
        regular_items = pocket.items.filter(is_other=False)
        total_regular = sum(item.amount for item in regular_items)
        
        # Calculate leftover
        leftover = pocket.amount - total_regular
        
        # Get or create "Other" item
        other_item, created = Item.objects.get_or_create(
            pocket=pocket,
            is_other=True,
            defaults={'name': 'Other', 'amount': leftover}
        )
        
        if not created:
            # Update existing "Other" item
            other_item.amount = leftover
            other_item.save()
        
        # Delete "Other" if amount is 0 or negative
        if leftover <= 0:
            other_item.delete()

class CategoryListCreate(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(author=user)
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class CategoryDelete(generics.DestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(author=user)
    
    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        # Check if any pockets use this category
        if category.pockets.exists():
            return Response(
                {"error": "Cannot delete category that is being used by pockets"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class ItemListCreate(generics.ListCreateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        pocket_id = self.kwargs.get('pocket_id')
        return Item.objects.filter(pocket_id=pocket_id, pocket__author=self.request.user)
    
    def perform_create(self, serializer):
        pocket_id = self.kwargs.get('pocket_id')
        pocket = Pocket.objects.get(id=pocket_id, author=self.request.user)
        
        # Save the new item
        item = serializer.save(pocket=pocket)
        
        # Recalculate and update "Other" item
        self.update_other_item(pocket)
    
    def update_other_item(self, pocket):
        """
        Auto-create or update the "Other" item based on pocket amount and existing items
        """
        # Get all non-other items
        regular_items = pocket.items.filter(is_other=False)
        total_regular = sum(item.amount for item in regular_items)
        
        # Calculate leftover
        leftover = pocket.amount - total_regular
        
        # Get or create "Other" item
        other_item, created = Item.objects.get_or_create(
            pocket=pocket,
            is_other=True,
            defaults={'name': 'Other', 'amount': leftover}
        )
        
        if not created:
            # Update existing "Other" item
            other_item.amount = leftover
            other_item.save()
        
        # Delete "Other" if amount is 0 or negative
        if leftover <= 0:
            other_item.delete()


class ItemUpdate(generics.UpdateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(pocket__author=self.request.user)
    
    def perform_update(self, serializer):
        item = serializer.save()
        
        # If this was the "Other" item being edited, make it a regular item
        if item.is_other and item.name != 'Other':
            item.is_other = False
            item.save()
        
        # Recalculate "Other" item
        self.update_other_item(item.pocket)
    
    def update_other_item(self, pocket):
        """Same logic as ItemListCreate"""
        regular_items = pocket.items.filter(is_other=False)
        total_regular = sum(item.amount for item in regular_items)
        leftover = pocket.amount - total_regular
        
        other_item, created = Item.objects.get_or_create(
            pocket=pocket,
            is_other=True,
            defaults={'name': 'Other', 'amount': leftover}
        )
        
        if not created:
            other_item.amount = leftover
            other_item.save()
        
        if leftover <= 0:
            other_item.delete()


class ItemDelete(generics.DestroyAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(pocket__author=self.request.user)
    
    def perform_destroy(self, instance):
        pocket = instance.pocket
        instance.delete()
        
        # Recalculate "Other" item after deletion
        self.update_other_item(pocket)
    
    def update_other_item(self, pocket):
        """Same logic as ItemListCreate"""
        regular_items = pocket.items.filter(is_other=False)
        total_regular = sum(item.amount for item in regular_items)
        leftover = pocket.amount - total_regular
        
        other_item, created = Item.objects.get_or_create(
            pocket=pocket,
            is_other=True,
            defaults={'name': 'Other', 'amount': leftover}
        )
        
        if not created:
            other_item.amount = leftover
            other_item.save()
        
        if leftover <= 0:
            other_item.delete()
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import UserSerializer, PocketSerializer, CategorySerializer, ItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Pocket, Category, Item
from .frequency_utils import convert_amount, calculate_pocket_monthly_equivalent
from decimal import Decimal

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
        old_pocket = self.get_object()
        old_amount = old_pocket.amount
        old_frequency = old_pocket.frequency
        
        pocket = serializer.save()
        
        new_amount = pocket.amount
        new_frequency = pocket.frequency
        
        if old_amount != new_amount or old_frequency != new_frequency:
            pocket.update_other_item()

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
        
        item = serializer.save(pocket=pocket)
        pocket.update_other_item()


class ItemUpdate(generics.UpdateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(pocket__author=self.request.user)
    
    def perform_update(self, serializer):
        item = serializer.save()
        
        if item.is_other and item.name != 'Other':
            item.is_other = False
            item.save()
        
        item.pocket.update_other_item()


class ItemDelete(generics.DestroyAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Item.objects.filter(pocket__author=self.request.user)
    
    def perform_destroy(self, instance):
        pocket = instance.pocket
        is_deleting_other = instance.is_other
        instance.delete()
        
        if not is_deleting_other:
            pocket.update_other_item()
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    UserSerializer, PocketSerializer, CategorySerializer, ItemSerializer,
    SortedIncomeSerializer, SortedPocketSerializer, SortedItemSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Pocket, Category, Item, SortedIncome, SortedPocket, SortedItem
from .frequency_utils import convert_amount, calculate_pocket_monthly_equivalent
from .income_sort_utils import calculate_pocket_total_for_period
from decimal import Decimal
from datetime import datetime

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


class CalculateIncomeSortView(APIView):
    """
    Calculate prorated amounts for all pockets based on income and period.
    This doesn't save anything - it's just for the UI to display initial amounts.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        income_amount = Decimal(str(request.data.get('income_amount', 0)))
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        period_type = request.data.get('period_type', 'custom')
        
        if not all([income_amount, start_date_str, end_date_str]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pockets = Pocket.objects.filter(author=request.user)
        
        result = []
        for pocket in pockets:
            if period_type == 'oneoff':
                # One-off income: no items, just pocket total
                pocket_data = calculate_pocket_total_for_oneoff(pocket, income_amount)
            else:
                # Regular periodic income: calculate with items
                pocket_data = calculate_pocket_total_for_period(
                    pocket, 
                    income_amount, 
                    start_date, 
                    end_date,
                    period_type
                )
            
            result.append({
                'id': pocket.id,
                'name': pocket.name,
                'color': pocket.color,
                'category_name': pocket.category.name if pocket.category else None,
                'calculated_total': str(pocket_data['total']),
                'items': pocket_data['items'],
            })
        
        return Response(result)


class IncomeSortCreateView(APIView):
    """
    Save a finalized income sort instance with all pocket/item snapshots.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        income_amount = request.data.get('income_amount')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        pockets_data = request.data.get('pockets', [])
        
        if not all([income_amount, start_date_str, end_date_str]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            income_amount = Decimal(str(income_amount))
        except (ValueError, Exception) as e:
            return Response(
                {'error': f'Invalid data: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sort_instance = SortedIncome.objects.create(
            author=request.user,
            income_amount=income_amount,
            start_date=start_date,
            end_date=end_date,
        )
        
        for pocket_data in pockets_data:
            original_pocket_id = pocket_data.get('original_pocket_id')
            original_pocket = None
            
            if original_pocket_id:
                try:
                    original_pocket = Pocket.objects.get(
                        id=original_pocket_id, 
                        author=request.user
                    )
                except Pocket.DoesNotExist:
                    pass
            
            sorted_pocket = SortedPocket.objects.create(
                sorted_income=sort_instance,
                name=pocket_data.get('name'),
                color=pocket_data.get('color'),
                category_name=pocket_data.get('category_name'),
                total_amount=Decimal(str(pocket_data.get('total_amount', 0))),
                original_pocket=original_pocket,
            )
            
            for item_data in pocket_data.get('items', []):
                original_item_id = item_data.get('original_item_id')
                original_item = None
                
                if original_item_id:
                    try:
                        original_item = Item.objects.get(id=original_item_id)
                    except Item.DoesNotExist:
                        pass
                
                SortedItem.objects.create(
                    sorted_pocket=sorted_pocket,
                    name=item_data.get('name'),
                    amount=Decimal(str(item_data.get('amount', 0))),
                    is_other=item_data.get('is_other', False),
                    is_percentage=item_data.get('is_percentage', False),
                    percentage_value=Decimal(str(item_data.get('percentage_value'))) if item_data.get('percentage_value') else None,
                    original_item=original_item,
                )
        
        serializer = SortedIncomeSerializer(sort_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IncomeSortListView(generics.ListAPIView):
    """
    List all income sort instances for the authenticated user.
    """
    serializer_class = SortedIncomeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SortedIncome.objects.filter(author=self.request.user)


class IncomeSortDetailView(generics.RetrieveAPIView):
    """
    Get details of a specific income sort instance.
    """
    serializer_class = SortedIncomeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SortedIncome.objects.filter(author=self.request.user)
    
    
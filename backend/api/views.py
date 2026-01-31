from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
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
from .income_sort_utils import calculate_pocket_total_for_period, calculate_pocket_total_for_oneoff
from decimal import Decimal
from datetime import datetime
from rest_framework_simplejwt.tokens import RefreshToken

class CreateUserView(generics.CreateAPIView):  
    """Register a new user and initialize default data."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # --- Preload Default Data ---
        try:
            # 1. Create Categories
            cat_essentials = Category.objects.create(name="Essentials", order=0, author=user)
            cat_savings = Category.objects.create(name="Savings", order=1, author=user)
            cat_lifestyle = Category.objects.create(name="Lifestyle", order=2, author=user)
            
            # 2. Create Pockets
            Pocket.objects.create(
                name="Rent",
                amount=0,
                frequency="monthly",
                color="#E74C3C",
                category=cat_essentials,
                author=user
            )
            Pocket.objects.create(
                name="Groceries",
                amount=0,
                frequency="monthly",
                color="#98D8C8", 
                category=cat_essentials,
                author=user
            )
            
            Pocket.objects.create(
                name="Bills",
                amount=0,
                frequency="monthly",
                color="#45B7D1", 
                category=cat_essentials,
                author=user
            )
            
            Pocket.objects.create(
                name="Emergency Fund",
                amount=0,
                frequency="monthly",
                color="#0D7377", 
                category=cat_savings,
                author=user
            )
            Pocket.objects.create(
                name="Investments",
                amount=0,
                frequency="monthly",
                color="#F1CB34FF",
                category=cat_savings,
                author=user
            )
            
            Pocket.objects.create(
                name="Entertainment",
                amount=0,
                frequency="monthly",
                color="#9B59B6",
                category=cat_lifestyle,
                author=user
            )
        except Exception as e:
            print(f"Error creating default data for user {user.username}: {str(e)}")
        
        # --- End Preload ---
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': serializer.data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class PocketListCreate(generics.ListCreateAPIView):
    """List or create pockets for auth user."""
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
    """Delete a pocket."""
    serializer_class = PocketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Pocket.objects.filter(author=user)

class PocketUpdate(generics.UpdateAPIView):
    """Update a pocket, recalculates 'Other' item."""
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
    """Manage budget categories."""
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Category.objects.filter(author=user).order_by('order', 'id')
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class CategoryDelete(generics.DestroyAPIView):
    """Delete category if unused."""
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


class CategoryReorderView(APIView):
    """Save new category display order."""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        category_order = request.data.get('categories', [])
        
        if not category_order:
            return Response(
                {'error': 'No category order provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            for item in category_order:
                category_id = item.get('id')
                order = item.get('order')
                
                if category_id is None or order is None:
                    continue
                    
                Category.objects.filter(
                    id=category_id,
                    author=request.user
                ).update(order=order)
            
            return Response({'message': 'Category order updated successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ItemListCreate(generics.ListCreateAPIView):
    """Manage items inside a specific pocket."""
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
    """Update item and recalculate pocket remainder."""
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
    """Delete item and recalculate pocket remainder."""
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
    Project pocket allocations for a given income and date range.
    Does not save to database.
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
                pocket_data = calculate_pocket_total_for_oneoff(pocket, income_amount)
            else:
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
    """Finalize and save an income sorting session."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        income_amount = request.data.get('income_amount')
        name = request.data.get('name')
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
            name=name if name else None,
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
    """History of sorted incomes."""
    serializer_class = SortedIncomeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SortedIncome.objects.filter(author=self.request.user)

class IncomeSortDetailView(generics.RetrieveDestroyAPIView):

    """Get details of or delete a specific income sort instance."""
    serializer_class = SortedIncomeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SortedIncome.objects.filter(author=self.request.user)

class UserProfileView(APIView):
    """View and edit user profile settings."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'currency': profile.currency
        })
    
    def patch(self, request):
        from .models import UserProfile
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        new_username = request.data.get('username')
        if new_username:
            if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                return Response(
                    {'username': ['This username is already taken']}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = new_username
            user.save()
        
        new_currency = request.data.get('currency')
        if new_currency:
            profile.currency = new_currency
            profile.save()
        
        if not new_username and not new_currency:
            return Response(
                {'error': 'No data provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'username': user.username,
            'currency': profile.currency
        })
    
    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdatePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Both current and new passwords are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not check_password(current_password, user.password):
            return Response(
                {'current_password': ['Current password is incorrect']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'new_password': ['Password must be at least 8 characters']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password updated successfully'})
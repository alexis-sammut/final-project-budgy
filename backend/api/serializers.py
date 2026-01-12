from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Pocket, Category, Item

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {"write_only": True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category 
        fields = ['id', 'name', 'created_at', 'author']
        extra_kwargs = {'author': {'read_only': True}}


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'amount', 'pocket', 'is_other', 'created_at', 'updated_at']
        extra_kwargs = {
            'pocket': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }


class PocketSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    items = ItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pocket 
        fields = [
            'id', 
            'name', 
            'color',
            'amount', 
            'frequency',
            'category',
            'category_name',
            'items',
            'created_at',
            'updated_at',
            'author'
        ]
        extra_kwargs = {
            'author': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def validate(self, data):
        """
        Validate that amount and frequency go together:
        - If amount is set, frequency must not be 'none'
        - If frequency is not 'none', amount must be set
        """
        amount = data.get('amount')
        frequency = data.get('frequency', 'none')
        
        has_amount = amount is not None and amount > 0
        has_frequency = frequency and frequency != 'none'
        
        # Amount without frequency
        if has_amount and not has_frequency:
            raise serializers.ValidationError(
                "A pocket with a recurring amount must have a frequency (weekly, biweekly, or monthly)."
            )
        
        # Frequency without amount
        if has_frequency and not has_amount:
            raise serializers.ValidationError(
                "A pocket with a frequency must have a recurring amount."
            )
        
        return data
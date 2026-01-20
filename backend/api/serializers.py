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
        fields = [
            'id', 
            'name', 
            'amount', 
            'amount_display', 
            'frequency', 
            'pocket', 
            'is_other', 
            'is_percentage',
            'percentage_value',
            'created_at', 
            'updated_at'
        ]
        extra_kwargs = {
            'pocket': {'read_only': True},
            'amount_display': {'read_only': True},
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
            'amount_display',
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
            'amount_display': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
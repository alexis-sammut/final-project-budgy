from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Pocket, Category

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


class PocketSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
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
            'created_at',
            'updated_at',
            'author'
        ]
        extra_kwargs = {
            'author': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
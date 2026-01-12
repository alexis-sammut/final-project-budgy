from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    """
    Budget categories that users can create and assign to pockets
    Examples: Food, Transportation, Entertainment, Bills, etc.
    """
    name = models.CharField(max_length=50)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Pocket(models.Model):
    """
    Budget pockets - containers for organizing expenses with recurring amounts
    """
    FREQUENCY_CHOICES = [
        ('none', 'No recurring amount'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Biweekly (Every 2 weeks)'),
        ('monthly', 'Monthly'),
    ]
    
    # Basic Info
    name = models.CharField(max_length=50)
    color = models.CharField(
        max_length=7, 
        default='#0D7377',
        help_text='Hex color code (e.g., #FF6B6B)'
    )
    
    # Budget Info
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text='Recurring amount to allocate to this pocket'
    )
    frequency = models.CharField(
        max_length=10, 
        choices=FREQUENCY_CHOICES, 
        default='none',
        help_text='How often to allocate the recurring amount'
    )
    
    # Category
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="pockets",
        help_text='Budget category for organizing pockets'
    )
    
    # Metadata
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pockets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):  
        return f"{self.name} - €{self.amount if self.amount else 0}"


class Item(models.Model):
    """
    Items within a pocket - individual expense line items
    """
    name = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Amount allocated to this item'
    )
    pocket = models.ForeignKey(
        Pocket,
        on_delete=models.CASCADE,
        related_name='items',
        help_text='The pocket this item belongs to'
    )
    is_other = models.BooleanField(
        default=False,
        help_text='Whether this is the auto-generated "Other" item'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['is_other', 'created_at']  # Other item always last
    
    def __str__(self):
        return f"{self.name} - €{self.amount}"
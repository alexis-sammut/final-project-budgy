from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    """Budget categories for organizing pockets"""
    name = models.CharField(max_length=50)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Pocket(models.Model):
    """Budget pocket with recurring expenses"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Biweekly (Every 2 weeks)'),
        ('4-week', '4-Week (Every 28 days)'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly (Every 3 months)'),
        ('yearly', 'Yearly'),
    ]
    
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#0D7377')
    
    # High precision for conversions
    amount = models.DecimalField(max_digits=20, decimal_places=10, default=0)
    amount_display = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='monthly')
    
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="pockets"
    )
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pockets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):  
        return f"{self.name} - €{self.amount if self.amount else 0}"
    
    def save(self, *args, **kwargs):
        from decimal import Decimal, ROUND_HALF_UP
        
        if self.amount is not None:
            self.amount_display = Decimal(str(self.amount)).quantize(
                Decimal('0.01'), 
                rounding=ROUND_HALF_UP
            )
        else:
            self.amount_display = Decimal('0.00')
        
        super().save(*args, **kwargs)
    
    def update_other_item(self):
        from .frequency_utils import convert_amount
        from decimal import Decimal
        
        regular_items = self.items.filter(is_other=False)
        
        # Convert everything to pocket frequency and sum
        total_regular = Decimal('0')
        for item in regular_items:
            converted = convert_amount(item.amount, item.frequency, self.frequency)
            total_regular += converted
        
        leftover = self.amount - total_regular
        
        other_item, created = Item.objects.get_or_create(
            pocket=self,
            is_other=True,
            defaults={
                'name': 'Other',
                'amount': leftover,
                'frequency': self.frequency
            }
        )
        
        if not created:
            other_item.amount = leftover
            other_item.frequency = self.frequency
            other_item.save()
        
        if leftover <= 0:
            other_item.delete()


class Item(models.Model):
    """Individual expense items within a pocket"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Biweekly (Every 2 weeks)'),
        ('4-week', '4-Week (Every 28 days)'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly (Every 3 months)'),
        ('yearly', 'Yearly'),
    ]
    
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=20, decimal_places=10, default=0)
    amount_display = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='monthly')
    pocket = models.ForeignKey(Pocket, on_delete=models.CASCADE, related_name='items')
    is_other = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['is_other', 'created_at']
    
    def __str__(self):
        return f"{self.name} - €{self.amount}"
    
    def save(self, *args, **kwargs):
        from decimal import Decimal, ROUND_HALF_UP
        
        if self.amount is not None:
            self.amount_display = Decimal(str(self.amount)).quantize(
                Decimal('0.01'), 
                rounding=ROUND_HALF_UP
            )
        else:
            self.amount_display = Decimal('0.00')
        
        super().save(*args, **kwargs)
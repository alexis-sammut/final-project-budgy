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
        
        regular_items = self.items.filter(is_other=False, is_percentage=False)
        
        # Convert everything to pocket frequency and sum
        total_regular = Decimal('0')
        for item in regular_items:
            converted = convert_amount(item.amount, item.frequency, self.frequency)
            total_regular += converted
        
        leftover = self.amount - total_regular
        
        # First, clean up any duplicate "Other" items
        other_items = self.items.filter(is_other=True)
        if other_items.count() > 1:
            # Keep the first one, delete the rest
            first_other = other_items.first()
            other_items.exclude(id=first_other.id).delete()
            other_item = first_other
            created = False
        elif other_items.count() == 1:
            other_item = other_items.first()
            created = False
        else:
            # Create new "Other" item
            other_item = Item.objects.create(
                pocket=self,
                is_other=True,
                name='Other',
                amount=leftover,
                frequency=self.frequency
            )
            created = True
        
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
        ('yearly', 'Yearly'),
        ('percentage', 'Ratio'),
    ]
    
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=20, decimal_places=10, default=0)
    amount_display = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='monthly')
    due_date = models.IntegerField(null=True, blank=True)
    pocket = models.ForeignKey(Pocket, on_delete=models.CASCADE, related_name='items')
    is_other = models.BooleanField(default=False)
    is_percentage = models.BooleanField(default=False)
    percentage_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['is_other', 'is_percentage', 'created_at']
    
    def __str__(self):
        if self.is_percentage:
            return f"{self.name} - {self.percentage_value}%"
        return f"{self.name} - €{self.amount}"
    
    def save(self, *args, **kwargs):
        from decimal import Decimal, ROUND_HALF_UP
        
        if self.is_percentage:
            self.frequency = 'percentage'
            self.amount = Decimal('0')
            self.amount_display = Decimal('0')
        else:
            if self.amount is not None:
                self.amount_display = Decimal(str(self.amount)).quantize(
                    Decimal('0.01'), 
                    rounding=ROUND_HALF_UP
                )
            else:
                self.amount_display = Decimal('0.00')
        
        super().save(*args, **kwargs)


class IncomeSortInstance(models.Model):
    """Instance of a periodic income sort"""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="income_sorts")
    income_amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"€{self.income_amount} - {self.start_date} to {self.end_date}"


class SortedPocket(models.Model):
    """Snapshot of a pocket during an income sort"""
    sort_instance = models.ForeignKey(IncomeSortInstance, on_delete=models.CASCADE, related_name='sorted_pockets')
    
    # Snapshot of pocket details
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7)
    category_name = models.CharField(max_length=50, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Reference to original pocket
    original_pocket = models.ForeignKey(Pocket, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.name} - €{self.total_amount}"


class SortedItem(models.Model):
    """Snapshot of an item during an income sort"""
    sorted_pocket = models.ForeignKey(SortedPocket, on_delete=models.CASCADE, related_name='sorted_items')
    
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_other = models.BooleanField(default=False)
    is_percentage = models.BooleanField(default=False)
    percentage_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Reference to original item
    original_item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['is_other', 'is_percentage', 'created_at']
    
    def __str__(self):
        if self.is_percentage:
            return f"{self.name} - {self.percentage_value}%"
        return f"{self.name} - €{self.amount}"
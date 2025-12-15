from django.db import models
from django.contrib.auth.models import User

class Pocket(models.Model):
    name = models.CharField(max_length=50)
    amount = models.TextField()
    created_at = models.DateTimeField(auto_now_add= True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pockets")
    
    def __str__(self):  
        return self.name
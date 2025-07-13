from django.db import models
from django.contrib.auth.models import AbstractUser
from academics.models import Department

class User(AbstractUser):
    ROLES = (
        ('student', 'סטודנט'),
        ('lecturer', 'מרצה'),
        ('admin', 'מנהל'),
    )
    
    role = models.CharField(max_length=20, choices=ROLES, default='student')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_approved = models.BooleanField(default=False)
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token_created_at = models.DateTimeField(null=True, blank=True)
    id_number = models.CharField(max_length=9, unique=True, null=True, blank=True)

    # הוספת related_name כדי למנוע התנגשויות
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

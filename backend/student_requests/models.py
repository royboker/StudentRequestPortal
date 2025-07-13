from django.db import models
from users.models import User
from academics.models import Course

class Request(models.Model):
    STATUS_CHOICES = [
        ('pending', 'ממתין'),
        ('approved', 'אושר'),
        ('rejected', 'נדחה'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    request_type = models.CharField(max_length=50)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    attached_file = models.FileField(upload_to='request_files/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_lecturer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_requests',
        limit_choices_to={'role': 'lecturer'}
    )
    feedback = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.request_type}"

    def get_status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

class RequestComment(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.request}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.get_full_name()}"

class Feedback(models.Model):
    RATING_CHOICES = [
        (1, '1 - גרוע מאוד'),
        (2, '2 - גרוע'),
        (3, '3 - בסדר'),
        (4, '4 - טוב'),
        (5, '5 - מעולה'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    category = models.CharField(max_length=50, choices=[
        ('website', 'האתר'),
        ('process', 'תהליך הבקשות'),
        ('general', 'כללי'),
    ], default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_name = "אנונימי" if self.is_anonymous else self.user.get_full_name()
        return f"משוב מ{user_name} - דירוג: {self.rating}"

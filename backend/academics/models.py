from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)

    # קשר רבים-לרבים עם מרצים בלבד
    lecturers = models.ManyToManyField(
        'users.User',  # שימוש במחרוזת כדי למנוע circular import
        limit_choices_to={'role': 'lecturer'},
        blank=True,
        related_name='courses'
    )

    def __str__(self):
        return f"{self.code} – {self.name}"

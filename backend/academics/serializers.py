from rest_framework import serializers
from .models import Department, Course
from users.serializers import UserSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class CourseSerializer(serializers.ModelSerializer):
    lecturers = UserSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'department', 'department_name', 'lecturers']

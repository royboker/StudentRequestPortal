# academics/urls.py
from django.urls import path
from .views import DepartmentListAPIView, CoursesByDepartmentAPIView

urlpatterns = [
    path('departments/', DepartmentListAPIView.as_view(), name='department-list'),
    path('api/departments/', DepartmentListAPIView.as_view(), name='department-list-api'),
    path('courses/', CoursesByDepartmentAPIView.as_view(), name='courses-by-department'),
    path('api/courses/', CoursesByDepartmentAPIView.as_view(), name='courses-by-department-api'),
]

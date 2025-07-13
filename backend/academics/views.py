from rest_framework import generics
from .models import Department, Course
from .serializers import DepartmentSerializer, CourseSerializer
from rest_framework.permissions import AllowAny

# שליפת כל המחלקות
class DepartmentListAPIView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

# שליפת כל הקורסים לפי department ID
class CoursesByDepartmentAPIView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        try:
            department_id = self.request.query_params.get('department')
            if not department_id:
                return Course.objects.none()
            
            return Course.objects.filter(department__id=department_id)
        except Exception as e:
            print(f"Error fetching courses: {str(e)}")
            return Course.objects.none()

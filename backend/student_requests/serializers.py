from rest_framework import serializers
from .models import Request, RequestComment, Notification, Feedback
from users.models import User
from users.serializers import UserSerializer
from academics.serializers import CourseSerializer

class LecturerShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class RequestCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    class Meta:
        model = RequestComment
        fields = ['id', 'author_name', 'content', 'timestamp', 'is_read']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'message', 'is_read', 'created_at']

class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'user_name', 'rating', 'rating_display', 'comment', 'category', 'category_display', 'created_at', 'is_anonymous']
        read_only_fields = ['id', 'created_at', 'user_name']

    def get_user_name(self, obj):
        if obj.is_anonymous:
            return None
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class RequestSerializer(serializers.ModelSerializer):
    assigned_lecturer = LecturerShortSerializer(read_only=True)
    student_name = serializers.SerializerMethodField()
    feedback = serializers.CharField(allow_blank=True, required=False)
    request_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True, required=False)
    
    # Add student_id field for creating requests
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),  # Allow any user to be set as student
        source='student',
        write_only=True,
        required=False
    )

    assigned_lecturer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='lecturer'),
        source='assigned_lecturer',
        write_only=True,
        required=False
    )

    class Meta:
        model = Request
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'request_type',
            'request_type_display',
            'subject',
            'description',
            'attached_file',
            'submitted_at',
            'status',
            'status_display',
            'assigned_lecturer',
            'assigned_lecturer_id',
            'feedback',
        ]
        read_only_fields = ['id', 'submitted_at']
        extra_kwargs = {
            'student': {'required': False},  # Make student field optional for creation
        }

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.first_name} {obj.student.last_name}".strip()
        return ""

    def get_request_type_display(self, obj):
        request_type_map = {
            'appeal': 'ערעור',
            'exemption': 'פטור',
            'military': 'מילואים',
            'other': 'אחר'
        }
        return request_type_map.get(obj.request_type, obj.request_type)

    def get_status_display(self, obj):
        status_map = {
            'pending': 'ממתין',
            'in_progress': 'בטיפול',
            'approved': 'אושר',
            'rejected': 'נדחה'
        }
        return status_map.get(obj.status, obj.status)

    def to_representation(self, instance):
        # Get the default representation
        ret = super().to_representation(instance)
        
        # Map status values from English to Hebrew for frontend compatibility
        status_map = {
            'pending': 'ממתין',
            'in_progress': 'בטיפול',
            'approved': 'אושר',
            'rejected': 'נדחה'
        }
        
        # Override the status field with Hebrew value
        ret['status'] = status_map.get(instance.status, instance.status)
        
        return ret

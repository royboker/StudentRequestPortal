from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Request, RequestComment, Notification, Feedback
from .serializers import RequestSerializer, RequestCommentSerializer, NotificationSerializer, FeedbackSerializer
from users.models import User
from rest_framework.parsers import MultiPartParser, FormParser

class RequestCreateAPIView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    renderer_classes = [JSONRenderer]

    def post(self, request):
        try:
            print(f"Received request data keys: {request.data.keys()}")
            
            # Extract student_id from the request (check both 'student_id' and 'student' fields)
            student_id = request.data.get('student_id') or request.data.get('student')
            print(f"Student ID from request: {student_id}")
            
            if not student_id:
                return Response({'error': 'נדרש מזהה סטודנט'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the student exists
            try:
                student = User.objects.get(id=student_id)
                print(f"Found student: {student.id}, {student.first_name} {student.last_name}")
            except User.DoesNotExist:
                return Response({'error': 'סטודנט לא נמצא'}, status=status.HTTP_404_NOT_FOUND)
            
            # Create a new Request object directly
            new_request = Request(
                student=student,
                request_type=request.data.get('request_type', 'other'),
                subject=request.data.get('subject', ''),
                description=request.data.get('description', ''),
                status='pending'
            )
            
            # Handle the assigned lecturer if provided
            assigned_lecturer_id = request.data.get('assigned_lecturer_id')
            if assigned_lecturer_id:
                try:
                    lecturer = User.objects.get(id=assigned_lecturer_id, role='lecturer')
                    new_request.assigned_lecturer = lecturer
                except User.DoesNotExist:
                    pass
            
            # Handle file upload
            if 'attached_file' in request.FILES:
                new_request.attached_file = request.FILES['attached_file']
            
            # Save the request
            new_request.save()
            
            print(f"Created new request: {new_request.id}, type: {new_request.request_type}")
            
            # Serialize for response without reading the file
            serializer = RequestSerializer(new_request)
            response_data = serializer.data
            
            # Return success response
            return Response({
                'id': new_request.id,
                'message': 'בקשה נוצרה בהצלחה',
                'status': 'success'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in RequestCreateAPIView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserRequestsListAPIView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        try:
            student_id = request.query_params.get('student_id')
            print(f"Received GET request for student_id: {student_id}")
            
            if not student_id:
                print("No student_id provided")
                return Response({'error': 'נדרש מזהה סטודנט'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                student = User.objects.get(id=student_id)
                print(f"Found student: {student.id}, {student.first_name} {student.last_name}, role: {student.role}")
            except User.DoesNotExist:
                print(f"Student with id {student_id} not found")
                return Response({'error': 'סטודנט לא נמצא'}, status=status.HTTP_404_NOT_FOUND)
            
            # Removed role check to allow any user to see their requests
            requests = Request.objects.filter(student=student)
            print(f"Found {requests.count()} requests for student {student_id}")
            
            serializer = RequestSerializer(requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in UserRequestsListAPIView GET: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            student_id = request.data.get('student_id')
            print(f"Received POST request for student_id: {student_id}")
            
            if not student_id:
                print("No student_id provided in POST body")
                return Response({'error': 'נדרש מזהה סטודנט'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                student = User.objects.get(id=student_id)
                print(f"Found student: {student.id}, {student.first_name} {student.last_name}, role: {student.role}")
            except User.DoesNotExist:
                print(f"Student with id {student_id} not found")
                return Response({'error': 'סטודנט לא נמצא'}, status=status.HTTP_404_NOT_FOUND)
            
            # Removed role check to allow any user to see their requests
            requests = Request.objects.filter(student=student)
            print(f"Found {requests.count()} requests for student {student_id}")
            
            serializer = RequestSerializer(requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in UserRequestsListAPIView POST: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def requests_by_student(request):
    if request.user.role not in ['lecturer', 'admin']:
        return Response({'error': 'אין לך הרשאה לראות בקשות לפי סטודנט'}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    student_id = request.query_params.get('student_id')
    if not student_id:
        return Response({'error': 'נדרש מזהה סטודנט'}, status=status.HTTP_400_BAD_REQUEST)
    
    student = get_object_or_404(User, id=student_id, role='student')
    requests = Request.objects.filter(student=student)
    serializer = RequestSerializer(requests, many=True)
    return Response(serializer.data)

class ManageRequestsView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        try:
            student_id = request.query_params.get('student_id')
            if student_id:
                student = get_object_or_404(User, id=student_id, role='student')
                requests = Request.objects.filter(student=student)
            else:
                requests = Request.objects.all()
            
            serializer = RequestSerializer(requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            department_id = request.data.get('department_id')
            lecturer_id = request.data.get('lecturer_id')

            if department_id:
                # אם זה אדמין, להחזיר בקשות מהמחלקה שלו
                requests = Request.objects.filter(student__department=department_id)
            elif lecturer_id:
                # אם זה מרצה, להחזיר בקשות שהוקצו אליו
                requests = Request.objects.filter(assigned_lecturer_id=lecturer_id)
            else:
                requests = Request.objects.all()

            serializer = RequestSerializer(requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UpdateRequestStatusView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def put(self, request, pk):
        print(f"=== UpdateRequestStatusView PUT called for request {pk} ===")
        print(f"Request data: {request.data}")
        try:
            print(f"Updating request {pk} with data:", request.data)
            student_request = get_object_or_404(Request, pk=pk)
            print(f"Current request status: {student_request.status}")
            
            new_status = request.data.get('status')
            print(f"New status from request: {new_status}")
            
            if not new_status:
                return Response({'error': 'נדרש סטטוס חדש'}, status=status.HTTP_400_BAD_REQUEST)
            
            # המרת הסטטוס לערך הנכון
            status_mapping = {
                'ממתין': 'pending',
                'בטיפול': 'in_progress',
                'אושר': 'approved',
                'נדחה': 'rejected'
            }
            
            new_status_value = status_mapping.get(new_status)
            if not new_status_value:
                return Response({'error': 'סטטוס לא תקין'}, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Converting status from {new_status} to {new_status_value}")
            
            # Update the status
            student_request.status = new_status_value
            student_request.feedback = request.data.get('feedback', '')
            
            # Save and refresh from database
            student_request.save()
            student_request.refresh_from_db()
            print(f"Updated request status: {student_request.status}")
            
            # Create notification for student
            print(f"Creating notification for student: {student_request.student.id}")
            
            # Get request type display name
            request_type_map = {
                'appeal': 'ערעור',
                'exemption': 'פטור',
                'military': 'מילואים',
                'other': 'אחר'
            }
            request_type_display = request_type_map.get(student_request.request_type, student_request.request_type)
            
            notification = Notification.objects.create(
                user=student_request.student,
                message=f'הבקשה שלך "{request_type_display}" עודכנה לסטטוס: {new_status}'
            )
            print(f"Created notification: {notification.id}, message: {notification.message}")
            
            # Serialize and return the updated request
            serializer = RequestSerializer(student_request)
            response_data = serializer.data
            print(f"Returning response data: {response_data}")
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error updating request status: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RequestCommentsView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request, pk):
        try:
            student_request = get_object_or_404(Request, pk=pk)
            comments = student_request.comments.all()
            serializer = RequestCommentSerializer(comments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pk):
        print(f"=== RequestCommentsView POST called for request {pk} ===")
        print(f"Request data: {request.data}")
        try:
            student_request = get_object_or_404(Request, pk=pk)
            author_id = request.data.get('author_id')
            content = request.data.get('content')
            
            if not author_id:
                return Response({'error': 'נדרש מזהה מחבר'}, status=status.HTTP_400_BAD_REQUEST)
            if not content:
                return Response({'error': 'נדרש תוכן לתגובה'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                author = User.objects.get(id=author_id)
            except User.DoesNotExist:
                return Response({'error': 'מחבר לא נמצא'}, status=status.HTTP_404_NOT_FOUND)
                
            # בדיקה שהמחבר הוא הסטודנט או המרצה המוקצה
            if author != student_request.student and author != student_request.assigned_lecturer and author.role != 'admin':
                return Response({'error': 'אין לך הרשאה להוסיף תגובות'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            comment = RequestComment.objects.create(
                request=student_request,
                author=author,
                content=content
            )
            
            # Create notification for the other user
            print(f"Comment author: {author.id} ({author.role})")
            print(f"Request student: {student_request.student.id}")
            print(f"Assigned lecturer: {student_request.assigned_lecturer.id if student_request.assigned_lecturer else 'None'}")
            
            # Determine who should get the notification
            notification_users = []
            
            if author == student_request.student:
                # Student commented - notify lecturer and admin
                if student_request.assigned_lecturer:
                    notification_users.append(student_request.assigned_lecturer)
                # Also notify admin users from the same department
                admins = User.objects.filter(role='admin', department=student_request.student.department)
                notification_users.extend(admins)
            elif author == student_request.assigned_lecturer:
                # Lecturer commented - notify student
                notification_users.append(student_request.student)
            elif author.role == 'admin':
                # Admin commented - notify student and lecturer
                notification_users.append(student_request.student)
                if student_request.assigned_lecturer:
                    notification_users.append(student_request.assigned_lecturer)
            
            # Remove duplicates and author from notification list
            notification_users = list(set(notification_users))
            if author in notification_users:
                notification_users.remove(author)
            
            print(f"Will notify users: {[u.id for u in notification_users]}")
            
            # Create notifications
            for user in notification_users:
                print(f"Creating notification for user: {user.id} about comment from {author.id}")
                notification = Notification.objects.create(
                    user=user,
                    message=f'התקבלה תגובה חדשה לבקשה "{student_request.request_type}" מאת {author.first_name} {author.last_name}'
                )
                print(f"Created comment notification: {notification.id}, message: {notification.message}")
            
            if not notification_users:
                print("No users to notify about comment")
            
            serializer = RequestCommentSerializer(comment)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class NotificationsView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request, user_id):
        try:
            print(f"Fetching notifications for user: {user_id}")
            notifications = Notification.objects.filter(user_id=user_id, is_read=False)
            print(f"Found {notifications.count()} unread notifications")
            for notif in notifications:
                print(f"  - Notification {notif.id}: {notif.message}")
            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching notifications: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, user_id):
        try:
            Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
            return Response({'message': 'כל ההתראות סומנו כנקראו'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FeedbackView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        """שליפת כל המשובים (למנהלים)"""
        try:
            feedbacks = Feedback.objects.all()
            serializer = FeedbackSerializer(feedbacks, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """יצירת משוב חדש"""
        try:
            user_id = request.data.get('user_id')
            rating = request.data.get('rating')
            comment = request.data.get('comment')
            category = request.data.get('category', 'general')
            is_anonymous = request.data.get('is_anonymous', False)

            if not user_id:
                return Response({'error': 'נדרש מזהה משתמש'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not rating or not comment:
                return Response({'error': 'נדרש דירוג ותגובה'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'משתמש לא נמצא'}, status=status.HTTP_404_NOT_FOUND)

            # יצירת המשוב
            feedback = Feedback.objects.create(
                user=user,
                rating=rating,
                comment=comment,
                category=category,
                is_anonymous=is_anonymous
            )

            serializer = FeedbackSerializer(feedback)
            return Response({
                'message': 'המשוב נשלח בהצלחה',
                'feedback': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, feedback_id=None):
        """מחיקת משוב (למנהלים בלבד)"""
        try:
            if not feedback_id:
                return Response({'error': 'נדרש מזהה משוב'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                feedback = Feedback.objects.get(id=feedback_id)
            except Feedback.DoesNotExist:
                return Response({'error': 'משוב לא נמצא'}, status=status.HTTP_404_NOT_FOUND)
            
            feedback.delete()
            return Response({'message': 'המשוב נמחק בהצלחה'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

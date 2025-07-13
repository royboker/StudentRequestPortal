# student_requests/urls.py
from django.urls import path
from .views import (
    RequestCreateAPIView,
    UserRequestsListAPIView,
    ManageRequestsView,
    UpdateRequestStatusView,
    RequestCommentsView,
    NotificationsView,
    FeedbackView
)

urlpatterns = [
    path('create/', RequestCreateAPIView.as_view(), name='request-create'),
    path('user-requests/', UserRequestsListAPIView.as_view(), name='user-requests'),
    path('by-student/', UserRequestsListAPIView.as_view(), name='by-student'),
    path('manage/', ManageRequestsView.as_view(), name='manage-requests'),
    path('update-status/<int:pk>/', UpdateRequestStatusView.as_view(), name='update-request-status'),
    path('comments/<int:pk>/', RequestCommentsView.as_view(), name='request-comments'),
    path('comments/add/<int:pk>/', RequestCommentsView.as_view(), name='add-request-comment'),
    path('notifications/<int:user_id>/', NotificationsView.as_view(), name='notifications'),
    path('unread/<int:user_id>/', NotificationsView.as_view(), name='unread-notifications'),
    path('mark-read/<int:user_id>/', NotificationsView.as_view(), name='mark-read-notifications'),
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('feedback/<int:feedback_id>/', FeedbackView.as_view(), name='delete-feedback'),
]
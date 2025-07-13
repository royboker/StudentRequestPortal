from django.urls import path
from . import views
from .views import RegisterAPIView, LoginAPIView, ForgotPasswordAPIView, ResetPasswordAPIView, chatbot_view
from django.urls import path
from .views import users_by_department
from .views import assign_courses_to_lecturer

from .views import (
    RegisterAPIView,
    LoginAPIView,
    ForgotPasswordAPIView,
    ResetPasswordAPIView,
    update_user,
    ChangePasswordAPIView,
    delete_user,
)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('login/', LoginAPIView.as_view(), name='api-login'),
    path('forgot-password/', ForgotPasswordAPIView.as_view()),
    path('reset-password/<int:user_id>/<str:token>/', ResetPasswordAPIView.as_view()),
    path('update/<int:user_id>/', update_user),
    path('change-password/<int:user_id>/', ChangePasswordAPIView.as_view()),
    path('department/<int:department_id>/', users_by_department, name='users-by-dept'),
    path('delete/<int:user_id>/', delete_user, name='api-delete-user'),
    path('assign-courses/<int:pk>/', assign_courses_to_lecturer),
    path('chatbot/', chatbot_view, name='chatbot-api'),
]


# backend/backend_project/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('User/', include('users.urls')),

    # 2. בשביל API של department:
    #    /api/users/department/<id>/
    path('api/users/', include('users.urls')),

    path('academics/', include('academics.urls')),
    path('api/requests/', include('student_requests.urls')),
    path('api/notifications/', include('student_requests.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
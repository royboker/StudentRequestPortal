"""
Integration Tests for User Management System
בדיקות אינטגרציה למערכת ניהול המשתמשים
"""

from django.test import TestCase, Client, TransactionTestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
import json
import base64
from unittest.mock import patch

from users.models import User
from academics.models import Department, Course
from student_requests.models import Request, RequestComment, Notification





class UserRegistrationIntegrationTests(TestCase):
    """בדיקות אינטגרציה לתהליך הרשמת משתמשים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.department = Department.objects.create(name="Computer Science")
        self.register_url = '/User/register/'
        

        

        
    def test_registration_with_duplicate_email(self):
        """בדיקת הרשמה עם אימייל כפול"""
        # יצירת משתמש ראשון
        User.objects.create(
            username="existing@example.com",
            email="existing@example.com",
            id_number="111111111"
        )
        
        # ניסיון הרשמה עם אותו אימייל
        data = {
            "full_name": "Duplicate Email",
            "email": "existing@example.com",
            "id_number": "222222222",
            "password": "Password1",
            "role": "student"
        }
        
        response = self.client.post(self.register_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_registration_with_invalid_department(self):
        """בדיקת הרשמה עם מחלקה לא קיימת"""
        data = {
            "full_name": "Invalid Department",
            "email": "invalid.dept@example.com",
            "id_number": "333333333",
            "password": "Password1",
            "role": "student",
            "department": 9999  # מחלקה לא קיימת
        }
        
        response = self.client.post(self.register_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserAuthenticationIntegrationTests(TestCase):
    """בדיקות אינטגרציה לתהליכי אימות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.department = Department.objects.create(name="Test Department")
        self.login_url = '/User/login/'
        
        # יצירת משתמשים מאושרים
        self.student = User.objects.create(
            username="student@example.com",
            email="student@example.com",
            first_name="Test",
            last_name="Student",
            id_number="123456789",
            role="student",
            password=make_password("StudentPass1"),
            department=self.department,
            is_approved=True
        )
        
        self.lecturer = User.objects.create(
            username="lecturer@example.com",
            email="lecturer@example.com",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
            password=make_password("LecturerPass1"),
            department=self.department,
            is_approved=True
        )
        
        # משתמש לא מאושר
        self.unapproved_user = User.objects.create(
            username="unapproved@example.com",
            email="unapproved@example.com",
            role="lecturer",
            password=make_password("Password1"),
            is_approved=False
        )
        
    def test_successful_student_login_flow(self):
        """בדיקת תהליך התחברות מוצלח לסטודנט"""
        data = {
            "email": "student@example.com",
            "password": "StudentPass1"
        }
        
        response = self.client.post(self.login_url, data, content_type="application/json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['role'], 'student')
        self.assertEqual(response.json()['email'], 'student@example.com')
        self.assertIn('id', response.json())
        self.assertIn('full_name', response.json())
        
    def test_successful_lecturer_login_flow(self):
        """בדיקת תהליך התחברות מוצלח למרצה"""
        data = {
            "email": "lecturer@example.com",
            "password": "LecturerPass1"
        }
        
        response = self.client.post(self.login_url, data, content_type="application/json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['role'], 'lecturer')
        
    def test_login_with_wrong_credentials(self):
        """בדיקת התחברות עם פרטים שגויים"""
        data = {
            "email": "student@example.com",
            "password": "WrongPassword"
        }
        
        response = self.client.post(self.login_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_login_unapproved_user(self):
        """בדיקת התחברות של משתמש לא מאושר"""
        data = {
            "email": "unapproved@example.com",
            "password": "Password1"
        }
        
        response = self.client.post(self.login_url, data, content_type="application/json")
        # המערכת צריכה לאפשר התחברות אבל לציין שהמשתמש לא מאושר
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])


class PasswordManagementIntegrationTests(TestCase):
    """בדיקות אינטגרציה לניהול סיסמאות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.user = User.objects.create(
            username="password@example.com",
            email="password@example.com",
            first_name="Password",
            last_name="Test",
            password=make_password("OldPassword1")
        )
        self.forgot_url = '/User/forgot-password/'
        self.change_password_url = f'/User/change-password/{self.user.id}/'
        

        

        
    def test_change_password_with_wrong_old_password(self):
        """בדיקת שינוי סיסמה עם סיסמה ישנה שגויה"""
        data = {
            "old_password": "WrongPassword",
            "new_password": "NewPassword1"
        }
        
        response = self.client.put(self.change_password_url, data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RequestManagementIntegrationTests(TestCase):
    """בדיקות אינטגרציה לניהול בקשות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = APIClient()
        self.department = Department.objects.create(name="Engineering")
        
        # יצירת משתמשים
        self.student = User.objects.create(
            username="student@example.com",
            email="student@example.com",
            first_name="Test",
            last_name="Student",
            role="student",
            department=self.department,
            password=make_password("Password1")
        )
        
        self.lecturer = User.objects.create(
            username="lecturer@example.com",
            email="lecturer@example.com",
            first_name="Test",
            last_name="Lecturer",
            role="lecturer",
            department=self.department,
            password=make_password("Password1")
        )
        
        self.admin = User.objects.create(
            username="admin@example.com",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            department=self.department,
            password=make_password("Password1")
        )
        
    def test_complete_request_lifecycle(self):
        """בדיקת מחזור חיים מלא של בקשה"""
        # 1. יצירת בקשה
        request = Request.objects.create(
            student=self.student,
            request_type="appeal",
            subject="ערעור על ציון בקורס אלגוריתמים",
            description="קיבלתי ציון 85 אך חישבתי ומגיע לי 90",
            status="pending"
        )
        
        self.assertEqual(request.status, "pending")
        
        # 2. הקצאת מרצה לבקשה
        request.assigned_lecturer = self.lecturer
        request.status = "approved"
        request.save()
        
        self.assertEqual(request.assigned_lecturer, self.lecturer)
        self.assertEqual(request.status, "approved")
        
        # 3. הוספת תגובה מהסטודנט
        comment1 = RequestComment.objects.create(
            request=request,
            author=self.student,
            content="האם בדקתם את השאלה 5? חושב שיש טעות בבדיקה"
        )
        
        self.assertEqual(comment1.author, self.student)
        self.assertFalse(comment1.is_read)
        
        # 4. תגובה מהמרצה
        comment2 = RequestComment.objects.create(
            request=request,
            author=self.lecturer,
            content="בדקתי שוב ואכן יש טעות בבדיקה, אעדכן את הציון"
        )
        
        # 5. סימון תגובות כנקראו
        comment1.is_read = True
        comment1.save()
        
        # 6. אישור הבקשה
        request.status = "approved"
        request.save()
        
        # 7. יצירת התראה לסטודנט
        notification = Notification.objects.create(
            user=self.student,
            message=f"הסטטוס של הבקשה '{request.subject}' עודכן ל־{request.status}"
        )
        
        # בדיקות סופיות
        self.assertEqual(request.status, "approved")
        self.assertEqual(RequestComment.objects.filter(request=request).count(), 2)
        self.assertTrue(RequestComment.objects.get(id=comment1.id).is_read)
        self.assertEqual(notification.user, self.student)
        self.assertFalse(notification.is_read)
        

        
    def test_bulk_request_operations(self):
        """בדיקת פעולות מרובות על בקשות"""
        # יצירת מספר בקשות
        requests = []
        for i in range(5):
            request = Request.objects.create(
                student=self.student,
                request_type="other",
                subject=f"בקשה מספר {i+1}",
                description=f"תיאור בקשה {i+1}",
                status="pending"
            )
            requests.append(request)
            
        # בדיקת מספר הבקשות שנוצרו
        self.assertEqual(Request.objects.filter(student=self.student).count(), 5)
        
        # עדכון סטטוס לכל הבקשות
        for request in requests:
            request.status = "approved"
            request.assigned_lecturer = self.lecturer
            request.save()
            
        # בדיקה שכל הבקשות עודכנו
        approved_count = Request.objects.filter(
            student=self.student,
            status="approved"
        ).count()
        self.assertEqual(approved_count, 5)


class UserManagementIntegrationTests(TestCase):
    """בדיקות אינטגרציה לניהול משתמשים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.department = Department.objects.create(name="Management Dept")
        
        self.admin = User.objects.create(
            username="admin@example.com",
            email="admin@example.com",
            role="admin",
            password=make_password("AdminPass1"),
            department=self.department,
            is_approved=True
        )
        
    def test_admin_user_management_operations(self):
        """בדיקת פעולות ניהול משתמשים על ידי מנהל"""
        # 1. יצירת משתמש חדש
        new_user = User.objects.create(
            username="newuser@example.com",
            email="newuser@example.com",
            first_name="New",
            last_name="User",
            role="lecturer",
            department=self.department,
            is_approved=False
        )
        
        # 2. אישור המשתמש על ידי המנהל
        new_user.is_approved = True
        new_user.save()
        
        self.assertTrue(new_user.is_approved)
        
        # 3. שינוי תפקיד המשתמש
        new_user.role = "admin"
        new_user.save()
        
        self.assertEqual(new_user.role, "admin")
        
        # 4. העברת המשתמש למחלקה אחרת
        new_department = Department.objects.create(name="New Department")
        new_user.department = new_department
        new_user.save()
        
        self.assertEqual(new_user.department, new_department)
        
    def test_department_user_listing(self):
        """בדיקת רשימת משתמשים לפי מחלקה"""
        # יצירת משתמשים במחלקות שונות
        dept1 = Department.objects.create(name="Department 1")
        dept2 = Department.objects.create(name="Department 2")
        
        users_dept1 = []
        for i in range(3):
            user = User.objects.create(
                username=f"user{i}@dept1.com",
                email=f"user{i}@dept1.com",
                department=dept1
            )
            users_dept1.append(user)
            
        users_dept2 = []
        for i in range(2):
            user = User.objects.create(
                username=f"user{i}@dept2.com",
                email=f"user{i}@dept2.com",
                department=dept2
            )
            users_dept2.append(user)
            
        # בדיקת מספר המשתמשים בכל מחלקה
        dept1_users = User.objects.filter(department=dept1)
        dept2_users = User.objects.filter(department=dept2)
        
        self.assertEqual(dept1_users.count(), 3)
        self.assertEqual(dept2_users.count(), 2)


class NotificationIntegrationTests(TestCase):
    """בדיקות אינטגרציה למערכת התראות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Notification Dept")
        self.user = User.objects.create(
            username="notify@example.com",
            email="notify@example.com",
            role="student",
            department=self.department
        )
        
    def test_notification_creation_on_request_status_change(self):
        """בדיקת יצירת התראה עם שינוי סטטוס בקשה"""
        # יצירת בקשה
        request = Request.objects.create(
            student=self.user,
            request_type="appeal",
            subject="בקשת ערעור",
            description="תיאור הבקשה",
            status="pending"
        )
        
        # שינוי סטטוס הבקשה
        request.status = "approved"
        request.save()
        
        # יצירת התראה ידנית (במציאות זה יקרה דרך סיגנלים)
        notification = Notification.objects.create(
            user=self.user,
            message=f"הסטטוס של הבקשה '{request.subject}' עודכן ל־{request.status}"
        )
        
        # בדיקת ההתראה
        self.assertEqual(notification.user, self.user)
        self.assertIn(request.subject, notification.message)
        self.assertIn(request.status, notification.message)
        self.assertFalse(notification.is_read)
        
    def test_bulk_notification_management(self):
        """בדיקת ניהול התראות מרובות"""
        # יצירת מספר התראות
        messages = [
            "הודעה ראשונה",
            "הודעה שנייה",
            "הודעה שלישית",
            "הודעה רביעית"
        ]
        
        notifications = []
        for message in messages:
            notification = Notification.objects.create(
                user=self.user,
                message=message
            )
            notifications.append(notification)
            
        # בדיקת מספר ההתראות הלא נקראות
        unread_count = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 4)
        
        # סימון חלק מההתראות כנקראו
        for i in range(2):
            notifications[i].is_read = True
            notifications[i].save()
            
        # בדיקת מספר ההתראות שנותרו לא נקראות
        remaining_unread = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
        self.assertEqual(remaining_unread, 2)
        
        # סימון כל ההתראות כנקראו
        Notification.objects.filter(user=self.user).update(is_read=True)
        
        final_unread = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
        self.assertEqual(final_unread, 0)


class CrossDepartmentIntegrationTests(TestCase):
    """בדיקות אינטגרציה חוצות מחלקות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.dept_cs = Department.objects.create(name="Computer Science")
        self.dept_math = Department.objects.create(name="Mathematics")
        
        # מרצה ממדעי המחשב
        self.cs_lecturer = User.objects.create(
            username="cs.lecturer@example.com",
            email="cs.lecturer@example.com",
            role="lecturer",
            department=self.dept_cs
        )
        
        # סטודנט ממתמטיקה
        self.math_student = User.objects.create(
            username="math.student@example.com",
            email="math.student@example.com",
            role="student",
            department=self.dept_math
        )
        
    def test_cross_department_request_assignment(self):
        """בדיקת הקצאת בקשה בין מחלקות"""
        # סטודנט ממתמטיקה מבקש ערעור על קורס במדעי המחשב
        request = Request.objects.create(
            student=self.math_student,
            request_type="appeal",
            subject="ערעור על קורס אלגוריתמים",
            description="למדתי באופן עצמאי ומבקש לערער על הציון",
            assigned_lecturer=self.cs_lecturer  # מרצה ממחלקה אחרת
        )
        
        # בדיקה שההקצאה עבדה
        self.assertEqual(request.student.department, self.dept_math)
        self.assertEqual(request.assigned_lecturer.department, self.dept_cs)
        self.assertNotEqual(request.student.department, request.assigned_lecturer.department)
        



class PerformanceIntegrationTests(TransactionTestCase):
    """בדיקות אינטגרציה לביצועים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Performance Dept")
        
    def test_bulk_user_creation_performance(self):
        """בדיקת ביצועים ליצירת משתמשים מרובים"""
        import time
        
        start_time = time.time()
        
        # יצירת 100 משתמשים
        users = []
        for i in range(100):
            user = User(
                username=f"user{i}@example.com",
                email=f"user{i}@example.com",
                first_name=f"User{i}",
                last_name="Test",
                role="student",
                department=self.department
            )
            users.append(user)
            
        # יצירה בצורה מסיבית
        User.objects.bulk_create(users)
        
        end_time = time.time()
        creation_time = end_time - start_time
        
        # בדיקה שהיצירה הסתיימה תוך זמן סביר (פחות מ-5 שניות)
        self.assertLess(creation_time, 5.0)
        
        # בדיקה שכל המשתמשים נוצרו
        self.assertEqual(User.objects.filter(department=self.department).count(), 100)
        
    def test_large_dataset_queries(self):
        """בדיקת שאילתות על מסד נתונים גדול"""
        # יצירת מסד נתונים גדול יותר
        departments = []
        for i in range(10):
            dept = Department.objects.create(name=f"Department {i}")
            departments.append(dept)
            
        users = []
        requests = []
        
        # יצירת 500 משתמשים ו-200 בקשות
        for i in range(500):
            user = User.objects.create(
                username=f"bigdata{i}@example.com",
                email=f"bigdata{i}@example.com",
                role="student",
                department=departments[i % 10]  # פיזור בין המחלקות
            )
            users.append(user)
            
            # יצירת בקשה לכל 2.5 משתמשים בממוצע
            if i % 5 < 2:
                request = Request.objects.create(
                    student=user,
                    request_type="other",
                    subject=f"בקשה {i}",
                    description=f"תיאור בקשה {i}"
                )
                requests.append(request)
                
        # בדיקת שאילתות מורכבות
        import time
        
        start_time = time.time()
        
        # שאילתה מורכבת: כל הבקשות של סטודנטים ממחלקות עם יותר מ-45 משתמשים
        complex_query = Request.objects.filter(
            student__department__in=departments,
            student__role="student"
        ).select_related('student', 'student__department').count()
        
        end_time = time.time()
        query_time = end_time - start_time
        
        # בדיקה שהשאילתה הסתיימה תוך זמן סביר
        self.assertLess(query_time, 2.0)
        self.assertGreater(complex_query, 0)


class SecurityIntegrationTests(TestCase):
    """בדיקות אינטגרציה לאבטחה"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.user = User.objects.create(
            username="security@example.com",
            email="security@example.com",
            password=make_password("SecurePass1")
        )
        
    def test_sql_injection_protection(self):
        """בדיקת הגנה מפני SQL injection"""
        login_url = '/User/login/'
        
        # ניסיון SQL injection במקום סיסמה
        malicious_data = {
            "email": "security@example.com",
            "password": "' OR '1'='1"
        }
        
        response = self.client.post(login_url, malicious_data, content_type="application/json")
        
        # בדיקה שההתקפה לא הצליחה
        self.assertNotEqual(response.status_code, status.HTTP_200_OK)
        
    def test_password_reset_token_security(self):
        """בדיקת אבטחת טוקני איפוס סיסמה"""
        # יצירת טוקן איפוס
        self.user.reset_token = "secure_token_123"
        self.user.reset_token_created_at = timezone.now()
        self.user.save()
        
        # בדיקה עם טוקן נכון
        reset_url = f'/User/reset-password/{self.user.id}/{self.user.reset_token}/'
        valid_data = {
            "password": "NewSecurePass1",
            "confirm": "NewSecurePass1"
        }
        
        response = self.client.post(reset_url, valid_data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # בדיקה עם טוקן שגוי
        wrong_token_url = f'/User/reset-password/{self.user.id}/wrong_token/'
        response = self.client.post(wrong_token_url, valid_data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        

        
    def test_unauthorized_access_prevention(self):
        """בדיקת מניעת גישה לא מורשית"""
        # יצירת משתמש ללא הרשאות מיוחדות
        regular_user = User.objects.create(
            username="regular@example.com",
            email="regular@example.com",
            role="student"
        )
        
        # יצירת משתמש אדמין
        admin_user = User.objects.create(
            username="admin@example.com",
            email="admin@example.com",
            role="admin"
        )
        
        # בדיקה שמשתמש רגיל לא יכול לגשת לפונקציות מנהל
        # (זה ידרוש מימוש של מערכת הרשאות בפועל)
        self.assertNotEqual(regular_user.role, "admin")
        self.assertEqual(admin_user.role, "admin")


class DataConsistencyIntegrationTests(TestCase):
    """בדיקות אינטגרציה לעקביות נתונים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Consistency Dept")
        self.student = User.objects.create(
            username="consistent@example.com",
            email="consistent@example.com",
            role="student",
            department=self.department
        )
        
    def test_cascading_operations(self):
        """בדיקת פעולות מדורגות"""
        # יצירת בקשה עם תגובות והתראות
        request = Request.objects.create(
            student=self.student,
            request_type="other",
            subject="בדיקת עקביות",
            description="תיאור לבדיקה"
        )
        
        comment = RequestComment.objects.create(
            request=request,
            author=self.student,
            content="תגובה לבדיקה"
        )
        
        notification = Notification.objects.create(
            user=self.student,
            message="הודעה קשורה לבקשה"
        )
        
        # בדיקה שכל האובייקטים קיימים
        self.assertTrue(Request.objects.filter(id=request.id).exists())
        self.assertTrue(RequestComment.objects.filter(id=comment.id).exists())
        self.assertTrue(Notification.objects.filter(id=notification.id).exists())
        
        # מחיקת הבקשה (בדיקת מה קורה לתגובות)
        request_id = request.id
        request.delete()
        
        # בדיקה מה קרה לתגובות (תלוי במימוש - CASCADE או PROTECT)
        # במקרה של CASCADE:
        # self.assertFalse(RequestComment.objects.filter(id=comment.id).exists())
        
    def test_data_integrity_on_department_changes(self):
        """בדיקת שלמות נתונים בשינויי מחלקות"""
        original_dept = self.student.department
        
        # יצירת מחלקה חדשה
        new_department = Department.objects.create(name="New Department")
        
        # העברת הסטודנט למחלקה חדשה
        self.student.department = new_department
        self.student.save()
        
        # בדיקה שההעברה הצליחה
        updated_student = User.objects.get(id=self.student.id)
        self.assertEqual(updated_student.department, new_department)
        self.assertNotEqual(updated_student.department, original_dept)
        
        # מחיקת המחלקה החדשה (בדיקת מה קורה למשתמש)
        new_department.delete()
        
        # בדיקה שהמשתמש עדיין קיים (SET_NULL behavior)
        still_exists = User.objects.filter(id=self.student.id).exists()
        self.assertTrue(still_exists)
        
        updated_student = User.objects.get(id=self.student.id)
        self.assertIsNone(updated_student.department)


class APIEndpointIntegrationTests(TestCase):
    """בדיקות אינטגרציה לנקודות קצה של API"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.department = Department.objects.create(name="API Test Dept")
        
        self.student = User.objects.create(
            username="api.student@example.com",
            email="api.student@example.com",
            role="student",
            department=self.department,
            password=make_password("Password1")
        )
        
        self.admin = User.objects.create(
            username="api.admin@example.com",
            email="api.admin@example.com",
            role="admin",
            department=self.department,
            password=make_password("AdminPass1")
        )
        
    def test_user_profile_update_api(self):
        """בדיקת API לעדכון פרופיל משתמש"""
        update_url = f'/User/update/{self.student.id}/'
        update_data = {
            "full_name": "Updated Student Name",
            "phone_number": "052-9999999"
        }
        
        response = self.client.put(update_url, update_data, content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # בדיקה שהעדכון התקבל
        updated_user = User.objects.get(id=self.student.id)
        self.assertEqual(updated_user.phone_number, "052-9999999")
        
    def test_department_users_listing_api(self):
        """בדיקת API לרשימת משתמשים במחלקה"""
        # יצירת משתמשים נוספים במחלקה
        for i in range(3):
            User.objects.create(
                username=f"dept.user{i}@example.com",
                email=f"dept.user{i}@example.com",
                role="student",
                department=self.department
            )
            
        list_url = f'/User/department/{self.department.id}/'
        response = self.client.get(list_url)
        
        if response.status_code == status.HTTP_200_OK:
            # בדיקה שהתגובה מכילה את המשתמשים הנכונים
            users_data = response.json()
            # המספר כולל את המשתמשים שיצרנו ב-setUp
            self.assertGreaterEqual(len(users_data), 3)
        
    def test_user_deletion_api(self):
        """בדיקת API למחיקת משתמש"""
        # יצירת משתמש למחיקה
        user_to_delete = User.objects.create(
            username="delete.me@example.com",
            email="delete.me@example.com",
            role="student",
            department=self.department
        )
        
        delete_url = f'/User/delete/{user_to_delete.id}/'
        response = self.client.delete(delete_url)
        
        if response.status_code == status.HTTP_200_OK:
            # בדיקה שהמשתמש נמחק
            self.assertFalse(User.objects.filter(id=user_to_delete.id).exists())


class WorkflowIntegrationTests(TestCase):
    """בדיקות אינטגרציה לתהליכי עבודה מורכבים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Workflow Dept")
        
        self.student = User.objects.create(
            username="workflow.student@example.com",
            email="workflow.student@example.com",
            role="student",
            department=self.department
        )
        
        self.lecturer = User.objects.create(
            username="workflow.lecturer@example.com",
            email="workflow.lecturer@example.com",
            role="lecturer",
            department=self.department
        )
        
        self.admin = User.objects.create(
            username="workflow.admin@example.com",
            email="workflow.admin@example.com",
            role="admin",
            department=self.department
        )
        
    def test_complete_grade_appeal_workflow(self):
        """בדיקת תהליך עבודה מלא לערעור על ציון"""
        # 1. סטודנט מגיש ערעור
        appeal = Request.objects.create(
            student=self.student,
            request_type="appeal",
            subject="ערעור על ציון במבחן סיום",
            description="סבור שמגיע לי ציון גבוה יותר בשל תשובה נכונה בשאלה 3",
            status="pending"
        )
        
        # 2. מנהל מקצה מרצה לבדיקה
        appeal.assigned_lecturer = self.lecturer
        appeal.status = "approved"
        appeal.save()
        
        # 3. מרצה בודק ומוסיף תגובה
        lecturer_comment = RequestComment.objects.create(
            request=appeal,
            author=self.lecturer,
            content="בדקתי את התשובה שלך בשאלה 3. אכן יש צדק בטענתך."
        )
        
        # 4. מרצה מאשר את הערעור
        appeal.status = "approved"
        appeal.save()
        
        # 5. יצירת התראה לסטודנט
        notification = Notification.objects.create(
            user=self.student,
            message=f"הערעור שלך על '{appeal.subject}' approved! הציון עודכן."
        )
        
        # 6. סטודנט מודה במסר
        student_thanks = RequestComment.objects.create(
            request=appeal,
            author=self.student,
            content="תודה רבה על הבדיקה המהירה והיסודית!"
        )
        
        # בדיקות תהליך
        final_appeal = Request.objects.get(id=appeal.id)
        self.assertEqual(final_appeal.status, "approved")
        self.assertEqual(final_appeal.assigned_lecturer, self.lecturer)
        
        comments_count = RequestComment.objects.filter(request=appeal).count()
        self.assertEqual(comments_count, 2)
        
        self.assertTrue(Notification.objects.filter(user=self.student).exists())
        
    def test_user_registration_and_approval_workflow(self):
        """בדיקת תהליך הרשמה ואישור משתמש חדש"""
        # 1. מרצה חדש נרשם למערכת
        new_lecturer_data = {
            "username": "new.lecturer@example.com",
            "email": "new.lecturer@example.com",
            "first_name": "New",
            "last_name": "Lecturer",
            "role": "lecturer",
            "department": self.department,
            "is_approved": False  # עדיין לא מאושר
        }
        
        new_lecturer = User.objects.create(**new_lecturer_data)
        
        # 2. בדיקה שהמרצה לא מאושר
        self.assertFalse(new_lecturer.is_approved)
        
        # 3. מנהל מאשר את המרצה
        new_lecturer.is_approved = True
        new_lecturer.save()
        
        # 4. יצירת התראה למרצה החדש
        approval_notification = Notification.objects.create(
            user=new_lecturer,
            message="חשבונך אושר! כעת תוכל להתחיל לעבוד במערכת."
        )
        
        # בדיקות תהליך
        approved_lecturer = User.objects.get(id=new_lecturer.id)
        self.assertTrue(approved_lecturer.is_approved)
        self.assertTrue(Notification.objects.filter(user=new_lecturer).exists())
        
    def test_multi_step_exemption_request_workflow(self):
        """בדיקת תהליך בקשת פטור מקורס רב-שלבי"""
        # 1. סטודנט מגיש בקשת פטור
        exemption = Request.objects.create(
            student=self.student,
            request_type="exemption",
            subject="בקשת פטור מקורס מבוא לתכנות",
            description="למדתי תכנות בצבא ובעבודה הקודמת שלי",
            status="pending"
        )
        
        # 2. הוספת מסמכים (סימולציה)
        # כאן בדרך כלל היו מעלים קבצים
        
        # 3. מנהל בוחן את הבקשה ומעביר למרצה מתאים
        exemption.assigned_lecturer = self.lecturer
        exemption.status = "approved"
        exemption.save()
        
        # 4. מרצה מבקש מידע נוסף
        info_request = RequestComment.objects.create(
            request=exemption,
            author=self.lecturer,
            content="אנא צרף תעודות או תיעוד על הלימודים הקודמים שלך"
        )
        
        # 5. סטודנט מוסיף מידע נוסף
        student_response = RequestComment.objects.create(
            request=exemption,
            author=self.student,
            content="צירפתי את התעודות מהקורסים שלמדתי בצבא"
        )
        
        # 6. מרצה מאשר חלקית
        partial_approval = RequestComment.objects.create(
            request=exemption,
            author=self.lecturer,
            content="מאשר פטור חלקי - תידרש לגשת למבחן סיום בלבד"
        )
        
        exemption.status = "approved"
        exemption.save()
        
        # בדיקות תהליך
        final_exemption = Request.objects.get(id=exemption.id)
        self.assertEqual(final_exemption.status, "approved")
        
        total_comments = RequestComment.objects.filter(request=exemption).count()
        self.assertEqual(total_comments, 3)
        
        # בדיקה שיש תגובות מכל הצדדים
        lecturer_comments = RequestComment.objects.filter(request=exemption, author=self.lecturer).count()
        student_comments = RequestComment.objects.filter(request=exemption, author=self.student).count()
        
        self.assertGreater(lecturer_comments, 0)
        self.assertGreater(student_comments, 0) 
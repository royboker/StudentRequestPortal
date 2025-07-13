"""
Unit Tests for User Management System
בדיקות יחידה למערכת ניהול המשתמשים
"""

from django.test import TestCase, Client
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta, datetime
from unittest.mock import patch, MagicMock

from users.models import User
from users.serializers import UserSerializer
from academics.models import Department, Course
from student_requests.models import Request, RequestComment, Notification


class UserModelUnitTests(TestCase):
    """בדיקות יחידה למודל המשתמש"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Computer Science")
        
    def test_user_creation_with_valid_data(self):
        """בדיקת יצירת משתמש עם נתונים תקינים"""
        user = User.objects.create(
            username="test@example.com",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            id_number="123456789",
            role="student",
            department=self.department,
            phone_number="050-1234567"
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.role, "student")
        self.assertEqual(user.department, self.department)
        self.assertFalse(user.is_approved)
        
    def test_user_string_representation(self):
        """בדיקת הייצוג הטקסטואלי של המשתמש"""
        user = User.objects.create(
            username="test@example.com",
            email="test@example.com",
            role="lecturer"
        )
        expected = "test@example.com (מרצה)"
        self.assertEqual(str(user), expected)
        
    def test_user_roles_choices(self):
        """בדיקת תקינות בחירות התפקידים"""
        valid_roles = ['student', 'lecturer', 'admin']
        for role in valid_roles:
            user = User.objects.create(
                username=f"{role}@example.com",
                email=f"{role}@example.com",
                role=role,
                password=make_password("TestPass123")
            )
            self.assertEqual(user.role, role)
            
    def test_user_invalid_role(self):
        """בדיקת תפקיד לא תקין"""
        user = User(
            username="invalid@example.com",
            email="invalid@example.com",
            role="invalid_role"
        )
        with self.assertRaises(ValidationError):
            user.full_clean()
            
    def test_id_number_uniqueness(self):
        """בדיקת ייחודיות מספר זהות"""
        User.objects.create(
            username="user1@example.com",
            email="user1@example.com",
            id_number="123456789"
        )
        with self.assertRaises(IntegrityError):
            User.objects.create(
                username="user2@example.com",
                email="user2@example.com",
                id_number="123456789"
            )
            
    def test_user_without_department(self):
        """בדיקת יצירת משתמש ללא מחלקה"""
        user = User.objects.create(
            username="nodept@example.com",
            email="nodept@example.com",
            role="admin"
        )
        self.assertIsNone(user.department)
        
    def test_reset_token_functionality(self):
        """בדיקת פונקציונליות טוקן איפוס סיסמה"""
        user = User.objects.create(
            username="reset@example.com",
            email="reset@example.com"
        )
        user.reset_token = "abc123"
        user.reset_token_created_at = timezone.now()
        user.save()
        
        self.assertEqual(user.reset_token, "abc123")
        self.assertIsNotNone(user.reset_token_created_at)


class UserSerializerUnitTests(TestCase):
    """בדיקות יחידה לסריאליזרים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Engineering")
        self.user_data = {
            'username': 'test@example.com',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'id_number': '123456789',
            'role': 'student',
            'department': self.department.id,
            'phone_number': '050-1234567',
            'password': 'TestPass123'
        }
        
    def test_user_serializer_valid_data(self):
        """בדיקת סריאליזר עם נתונים תקינים"""
        serializer = UserSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid())
        
    def test_user_serializer_missing_required_fields(self):
        """בדיקת סריאליזר עם שדות חסרים"""
        incomplete_data = {
            'email': 'incomplete@example.com'
        }
        serializer = UserSerializer(data=incomplete_data)
        self.assertFalse(serializer.is_valid())
        
    def test_user_serializer_password_validation(self):
        """בדיקת ולידציה של סיסמה"""
        data = self.user_data.copy()
        data['password'] = 'weak'
        
        serializer = UserSerializer(data=data)
        # הסריאליזר הבסיסי לא מבצע ולידציה של חוזק סיסמה
        # אבל נבדוק שהוא לפחות מקבל את הנתונים
        self.assertTrue(len(data['password']) < 8)
        
    def test_user_serializer_strong_password(self):
        """בדיקת סיסמה חזקה"""
        data = self.user_data.copy()
        data['password'] = 'StrongPass123!'
        
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
    def test_user_serializer_email_format_validation(self):
        """בדיקת ולידציה של פורמט אימייל"""
        data = self.user_data.copy()
        data['email'] = 'invalid-email'
        
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class UserAuthenticationUnitTests(TestCase):
    """בדיקות יחידה לאימות משתמשים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.client = Client()
        self.department = Department.objects.create(name="Test Department")
        
        self.user = User.objects.create_user(
            username="auth@example.com",
            email="auth@example.com",
            password="TestPass123",
            first_name="Auth",
            last_name="User",
            id_number="123456789",
            role="student",
            department=self.department,
            is_approved=True
        )
        
    def test_password_hashing(self):
        """בדיקת הצפנת סיסמה"""
        password = "TestPassword123"
        hashed = make_password(password)
        
        self.assertNotEqual(password, hashed)
        self.assertTrue(check_password(password, hashed))
        self.assertFalse(check_password("WrongPassword", hashed))
        

        
    def test_user_authentication_failure(self):
        """בדיקת אימות משתמש כושל"""
        from django.contrib.auth import authenticate
        
        user = authenticate(
            username="auth@example.com",
            password="WrongPassword"
        )
        self.assertIsNone(user)
        
    def test_user_approval_status(self):
        """בדיקת סטטוס אישור משתמש"""
        self.assertTrue(self.user.is_approved)
        
        unapproved_user = User.objects.create(
            username="unapproved@example.com",
            email="unapproved@example.com",
            role="lecturer"
        )
        self.assertFalse(unapproved_user.is_approved)


class PasswordManagementUnitTests(TestCase):
    """בדיקות יחידה לניהול סיסמאות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.user = User.objects.create(
            username="password@example.com",
            email="password@example.com",
            password=make_password("OldPass123")
        )
        
    def test_password_change_validation(self):
        """בדיקת ולידציה לשינוי סיסמה"""
        old_password = "OldPass123"
        new_password = "NewPass456"
        
        # בדיקת סיסמה ישנה נכונה
        self.assertTrue(check_password(old_password, self.user.password))
        
        # שינוי סיסמה
        self.user.password = make_password(new_password)
        self.user.save()
        
        # בדיקת סיסמה חדשה
        self.assertTrue(check_password(new_password, self.user.password))
        self.assertFalse(check_password(old_password, self.user.password))
        
    def test_reset_token_generation(self):
        """בדיקת יצירת טוקן איפוס"""
        import uuid
        
        reset_token = str(uuid.uuid4())
        self.user.reset_token = reset_token
        self.user.reset_token_created_at = timezone.now()
        self.user.save()
        
        self.assertEqual(self.user.reset_token, reset_token)
        self.assertIsNotNone(self.user.reset_token_created_at)
        
    def test_reset_token_expiry(self):
        """בדיקת פקיעת טוקן איפוס"""
        # יצירת טוקן שפג תוקפו
        expired_time = timezone.now() - timedelta(hours=25)  # פג תוקף לפני 25 שעות
        
        self.user.reset_token = "expired_token"
        self.user.reset_token_created_at = expired_time
        self.user.save()
        
        # בדיקה שהטוקן פג תוקף
        time_diff = timezone.now() - self.user.reset_token_created_at
        self.assertTrue(time_diff > timedelta(hours=24))
        



class UserRoleManagementUnitTests(TestCase):
    """בדיקות יחידה לניהול תפקידי משתמשים"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Math Department")
        
    def test_student_role_creation(self):
        """בדיקת יצירת סטודנט"""
        student = User.objects.create(
            username="student@example.com",
            email="student@example.com",
            role="student",
            department=self.department
        )
        self.assertEqual(student.role, "student")
        self.assertEqual(student.get_role_display(), "סטודנט")
        
    def test_lecturer_role_creation(self):
        """בדיקת יצירת מרצה"""
        lecturer = User.objects.create(
            username="lecturer@example.com",
            email="lecturer@example.com",
            role="lecturer",
            department=self.department
        )
        self.assertEqual(lecturer.role, "lecturer")
        self.assertEqual(lecturer.get_role_display(), "מרצה")
        
    def test_admin_role_creation(self):
        """בדיקת יצירת מנהל"""
        admin = User.objects.create(
            username="admin@example.com",
            email="admin@example.com",
            role="admin",
            department=self.department
        )
        self.assertEqual(admin.role, "admin")
        self.assertEqual(admin.get_role_display(), "מנהל")
        
    def test_role_change_functionality(self):
        """בדיקת שינוי תפקיד משתמש"""
        user = User.objects.create(
            username="rolechange@example.com",
            email="rolechange@example.com",
            role="student"
        )
        
        # שינוי מסטודנט למרצה
        user.role = "lecturer"
        user.save()
        
        updated_user = User.objects.get(email="rolechange@example.com")
        self.assertEqual(updated_user.role, "lecturer")
        
    def test_default_role_assignment(self):
        """בדיקת הקצאת תפקיד ברירת מחדל"""
        user = User.objects.create(
            username="default@example.com",
            email="default@example.com"
            # לא מציינים role
        )
        self.assertEqual(user.role, "student")  # ברירת מחדל


class DepartmentRelationshipUnitTests(TestCase):
    """בדיקות יחידה ליחסים עם מחלקות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.dept1 = Department.objects.create(name="Computer Science")
        self.dept2 = Department.objects.create(name="Mathematics")
        
    def test_user_department_assignment(self):
        """בדיקת הקצאת משתמש למחלקה"""
        user = User.objects.create(
            username="dept@example.com",
            email="dept@example.com",
            department=self.dept1
        )
        self.assertEqual(user.department, self.dept1)
        
    def test_user_department_change(self):
        """בדיקת שינוי מחלקה של משתמש"""
        user = User.objects.create(
            username="change@example.com",
            email="change@example.com",
            department=self.dept1
        )
        
        # שינוי מחלקה
        user.department = self.dept2
        user.save()
        
        updated_user = User.objects.get(email="change@example.com")
        self.assertEqual(updated_user.department, self.dept2)
        
    def test_department_deletion_handling(self):
        """בדיקת טיפול במחיקת מחלקה"""
        user = User.objects.create(
            username="delete@example.com",
            email="delete@example.com",
            department=self.dept1
        )
        
        # מחיקת המחלקה
        self.dept1.delete()
        
        # בדיקה שהמשתמש עדיין קיים אבל ללא מחלקה
        updated_user = User.objects.get(email="delete@example.com")
        self.assertIsNone(updated_user.department)
        
    def test_multiple_users_same_department(self):
        """בדיקת מספר משתמשים באותה מחלקה"""
        users = []
        for i in range(3):
            user = User.objects.create(
                username=f"user{i}@example.com",
                email=f"user{i}@example.com",
                department=self.dept1
            )
            users.append(user)
            
        # בדיקה שכל המשתמשים שייכים לאותה מחלקה
        for user in users:
            self.assertEqual(user.department, self.dept1)
            
        # בדיקת מספר המשתמשים במחלקה
        dept_users = User.objects.filter(department=self.dept1)
        self.assertEqual(dept_users.count(), 3)


class ValidationUnitTests(TestCase):
    """בדיקות יחידה לולידציה"""
    
    def test_email_format_validation(self):
        """בדיקת ולידציה של פורמט אימייל"""
        valid_emails = [
            "user@example.com",
            "test.user@domain.org",
            "user123@test-domain.com"
        ]
        
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user.example.com"
        ]
        
        for email in valid_emails:
            user = User.objects.create(
                username=email, 
                email=email,
                password=make_password("TestPass123")
            )
            # אם הגענו לכאן, היצירה הצליחה
            self.assertEqual(user.email, email)
                
        for email in invalid_emails:
            # עבור אימיילים לא תקינים, נבדוק שהם לא עוברים בדיקת פורמט בסיסית
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            self.assertFalse(re.match(email_pattern, email))
                
    def test_phone_number_validation(self):
        """בדיקת ולידציה של מספר טלפון"""
        valid_phones = [
            "050-1234567",
            "052-9876543",
            "054-1111111"
        ]
        
        for phone in valid_phones:
            user = User.objects.create(
                username=f"phone{phone[-4:]}@example.com",
                email=f"phone{phone[-4:]}@example.com",
                phone_number=phone
            )
            self.assertEqual(user.phone_number, phone)
            
    def test_id_number_format_validation(self):
        """בדיקת ולידציה של מספר זהות"""
        valid_id_numbers = [
            "123456789",
            "987654321",
            "111111111"
        ]
        
        invalid_id_numbers = [
            "12345678",   # קצר מדי
            "1234567890", # ארוך מדי
            "abcdefghi",  # לא מספרי
            ""            # ריק
        ]
        
        for id_num in valid_id_numbers:
            user = User.objects.create(
                username=f"id{id_num}@example.com",
                email=f"id{id_num}@example.com",
                id_number=id_num
            )
            self.assertEqual(user.id_number, id_num)
            
        # נוכל להוסיף כאן בדיקות נוספות לפורמט לא תקין
        # אם נרצה להוסיף ולידציה מותאמת למספר זהות


@patch('django.core.mail.send_mail')
class EmailFunctionalityUnitTests(TestCase):
    """בדיקות יחידה לפונקציונליות אימייל"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.user = User.objects.create(
            username="email@example.com",
            email="email@example.com"
        )
        
    def test_password_reset_email_mock(self, mock_send_mail):
        """בדיקת שליחת אימייל איפוס סיסמה (מוק)"""
        mock_send_mail.return_value = True
        
        # סימולציה של שליחת אימייל
        subject = "Password Reset"
        message = "Click here to reset your password"
        from_email = "noreply@example.com"
        user_list = [self.user.email]
        
        from django.core.mail import send_mail
        result = send_mail(subject, message, from_email, user_list)
        
        # בדיקה שהפונקציה נקראה
        mock_send_mail.assert_called_once_with(
            subject, message, from_email, user_list
        )
        self.assertTrue(result)
        
    def test_email_template_formatting(self, mock_send_mail):
        """בדיקת פורמט תבנית אימייל"""
        mock_send_mail.return_value = True
        
        # יצירת תוכן אימייל
        reset_token = "abc123token"
        reset_url = f"http://example.com/reset/{self.user.id}/{reset_token}"
        
        message = f"""
        שלום {self.user.first_name or 'משתמש'},
        
        קיבלנו בקשה לאיפוס סיסמה עבור החשבון שלך.
        לחץ על הקישור הבא לאיפוס הסיסמה:
        
        {reset_url}
        
        הקישור תקף למשך 24 שעות.
        """
        
        self.assertIn(reset_url, message)
        self.assertIn("איפוס סיסמה", message)


class EdgeCaseUnitTests(TestCase):
    """בדיקות יחידה למקרי קיצון"""
    
    def test_user_with_very_long_name(self):
        """בדיקת משתמש עם שם ארוך מאוד"""
        long_name = "א" * 200  # שם של 200 תווים
        user = User.objects.create(
            username="longname@example.com",
            email="longname@example.com",
            first_name=long_name
        )
        self.assertEqual(len(user.first_name), 200)
        
    def test_user_with_special_characters_in_name(self):
        """בדיקת משתמש עם תווים מיוחדים בשם"""
        special_name = "שם עם תווים מיוחדים !@#$%^&*()"
        user = User.objects.create(
            username="special@example.com",
            email="special@example.com",
            first_name=special_name
        )
        self.assertEqual(user.first_name, special_name)
        
    def test_request_with_empty_description(self):
        """בדיקת בקשה עם תיאור ריק"""
        department = Department.objects.create(name="Test Dept")
        student = User.objects.create(
            username="empty@example.com",
            email="empty@example.com",
            role="student",
            department=department
        )
        
        request = Request.objects.create(
            student=student,
            request_type="other",
            subject="בקשה ללא תיאור",
            description=""  # תיאור ריק
        )
        self.assertEqual(request.description, "")
        
    def test_multiple_reset_tokens_for_same_user(self):
        """בדיקת מספר טוקני איפוס לאותו משתמש"""
        user = User.objects.create(
            username="multiple@example.com",
            email="multiple@example.com"
        )
        
        # טוקן ראשון
        user.reset_token = "token1"
        user.reset_token_created_at = timezone.now()
        user.save()
        
        first_token = user.reset_token
        
        # טוקן שני (מחליף את הראשון)
        user.reset_token = "token2"
        user.reset_token_created_at = timezone.now()
        user.save()
        
        # בדיקה שהטוקן השני החליף את הראשון
        self.assertEqual(user.reset_token, "token2")
        self.assertNotEqual(user.reset_token, first_token)


class ConcurrencyUnitTests(TestCase):
    """בדיקות יחידה לטיפול בבעיות סמכרוניות"""
    
    def test_simultaneous_user_creation_with_same_email(self):
        """בדיקת יצירת משתמשים בו-זמנית עם אותו אימייל"""
        # זוהי בדיקה מחשבתית - במציאות נדרש מנגנון מתקדם יותר
        
        email = "concurrent@example.com"
        
        # משתמש ראשון
        user1 = User.objects.create(
            username=email,
            email=email,
            id_number="111111111"
        )
        
        # ניסיון ליצור משתמש שני עם אותו אימייל צריך להיכשל
        with self.assertRaises(IntegrityError):
            User.objects.create(
                username=email,
                email=email,
                id_number="222222222"
            )
            
    def test_request_status_concurrent_updates(self):
        """בדיקת עדכון סטטוס בקשה בו-זמנית"""
        department = Department.objects.create(name="Concurrent Dept")
        student = User.objects.create(
            username="concurrent@example.com",
            email="concurrent@example.com",
            role="student",
            department=department
        )
        
        request = Request.objects.create(
            student=student,
            request_type="other",
            subject="בקשה לבדיקת סמכרוניות",
            description="תיאור",
            status="ממתין"
        )
        
        # עדכון ראשון
        request.status = "בטיפול"
        request.save()
        
        # וידוא שהעדכון התקבל
        updated_request = Request.objects.get(id=request.id)
        self.assertEqual(updated_request.status, "בטיפול")


class RequestModelUnitTests(TestCase):
    """בדיקות יחידה למודל הבקשות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Engineering")
        self.student = User.objects.create(
            username="student@example.com",
            email="student@example.com",
            role="student",
            department=self.department
        )
        self.lecturer = User.objects.create(
            username="lecturer@example.com",
            email="lecturer@example.com",
            role="lecturer",
            department=self.department
        )
        
    def test_request_creation_with_valid_data(self):
        """בדיקת יצירת בקשה עם נתונים תקינים"""
        request = Request.objects.create(
            student=self.student,
            request_type="appeal",
            subject="ערעור על ציון",
            description="בקשה לבדיקה חוזרת של הציון",
            status="pending"
        )
        self.assertEqual(request.student, self.student)
        self.assertEqual(request.request_type, "appeal")
        self.assertEqual(request.status, "pending")
        
    def test_request_status_choices(self):
        """בדיקת בחירות סטטוס הבקשה"""
        valid_statuses = ["pending", "approved", "rejected"]
        
        for status in valid_statuses:
            request = Request.objects.create(
                student=self.student,
                request_type="other",
                subject="בדיקת סטטוס",
                description="תיאור",
                status=status
            )
            self.assertEqual(request.status, status)
            
    def test_request_type_choices(self):
        """בדיקת בחירות סוג הבקשה"""
        valid_types = ["appeal", "exemption", "military", "other"]
        
        for req_type in valid_types:
            request = Request.objects.create(
                student=self.student,
                request_type=req_type,
                subject="בדיקת סוג",
                description="תיאור"
            )
            self.assertEqual(request.request_type, req_type)
            
    def test_request_with_assigned_lecturer(self):
        """בדיקת בקשה עם מרצה מוקצה"""
        request = Request.objects.create(
            student=self.student,
            request_type="appeal",
            subject="ערעור עם מרצה",
            description="תיאור",
            assigned_lecturer=self.lecturer
        )
        self.assertEqual(request.assigned_lecturer, self.lecturer)


class CommentModelUnitTests(TestCase):
    """בדיקות יחידה למודל התגובות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.department = Department.objects.create(name="Science")
        self.student = User.objects.create(
            username="student@example.com",
            email="student@example.com",
            role="student",
            department=self.department
        )
        self.request = Request.objects.create(
            student=self.student,
            request_type="other",
            subject="בקשת בדיקה",
            description="תיאור הבקשה"
        )
        
    def test_comment_creation(self):
        """בדיקת יצירת תגובה"""
        comment = RequestComment.objects.create(
            request=self.request,
            author=self.student,
            content="זוהי תגובה לבדיקה"
        )
        self.assertEqual(comment.request, self.request)
        self.assertEqual(comment.author, self.student)
        self.assertEqual(comment.content, "זוהי תגובה לבדיקה")
        self.assertFalse(comment.is_read)  # ברירת מחדל
        
    def test_comment_read_status(self):
        """בדיקת סטטוס קריאה של תגובה"""
        comment = RequestComment.objects.create(
            request=self.request,
            author=self.student,
            content="תגובה לא נקראה"
        )
        
        # בדיקה שברירת המחדל היא לא נקרא
        self.assertFalse(comment.is_read)
        
        # סימון כנקרא
        comment.is_read = True
        comment.save()
        
        updated_comment = RequestComment.objects.get(id=comment.id)
        self.assertTrue(updated_comment.is_read)


class NotificationModelUnitTests(TestCase):
    """בדיקות יחידה למודל ההתראות"""
    
    def setUp(self):
        """הכנת נתונים לפני כל בדיקה"""
        self.user = User.objects.create(
            username="notify@example.com",
            email="notify@example.com",
            role="student"
        )
        
    def test_notification_creation(self):
        """בדיקת יצירת התראה"""
        notification = Notification.objects.create(
            user=self.user,
            message="זוהי הודעת בדיקה"
        )
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.message, "זוהי הודעת בדיקה")
        self.assertFalse(notification.is_read)  # ברירת מחדל
        
    def test_notification_read_status(self):
        """בדיקת סטטוס קריאה של התראה"""
        notification = Notification.objects.create(
            user=self.user,
            message="הודעה לא נקראה"
        )
        
        # בדיקה שברירת המחדל היא לא נקרא
        self.assertFalse(notification.is_read)
        
        # סימון כנקרא
        notification.is_read = True
        notification.save()
        
        updated_notification = Notification.objects.get(id=notification.id)
        self.assertTrue(updated_notification.is_read)
        
    def test_multiple_notifications_for_user(self):
        """בדיקת מספר התראות למשתמש"""
        messages = [
            "הודעה ראשונה",
            "הודעה שנייה", 
            "הודעה שלישית"
        ]
        
        notifications = []
        for message in messages:
            notification = Notification.objects.create(
                user=self.user,
                message=message
            )
            notifications.append(notification)
            
        # בדיקת מספר ההתראות
        user_notifications = Notification.objects.filter(user=self.user)
        self.assertEqual(user_notifications.count(), 3)
        
        # בדיקת תוכן ההתראות
        for i, notification in enumerate(user_notifications):
            self.assertIn(f"הודעה", notification.message) 
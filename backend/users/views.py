# backend/users/views.py

from django.conf import settings
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import User
from .serializers import UserSerializer
from academics.models import Department
from academics.models import Course
import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

class RegisterAPIView(APIView):
    """
    POST /User/register/
    רישום משתמש חדש – כולל department ו-phone_number ב־User עצמו
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': next(iter(serializer.errors.values()))[0]},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        send_mail(
            subject='הרשמה בוצעה בהצלחה',
            message=f"שלום {user.get_full_name()}, ההרשמה הושלמה!",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )
        return Response({'message': 'User registered successfully.'},
                        status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """
    POST /User/login/
    התחברות – מחזיר גם את department ו–phone_number מתוך ה־User
    """
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'אנא מלא אימייל וסיסמה.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'משתמש לא נמצא.'},
                            status=status.HTTP_404_NOT_FOUND)

        if not check_password(password, user.password):
            return Response({'error': 'סיסמה שגויה!'},
                            status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            'message': 'התחברת בהצלחה!',
            'id': user.id,
            'full_name': user.get_full_name(),
            'email': user.email,
            'role': user.role,
            'department': user.department.id if user.department else None,
            'phone_number': user.phone_number,
            'registration_date': user.date_joined,
        }, status=status.HTTP_200_OK)


class ForgotPasswordAPIView(APIView):
    """
    POST /User/forgot-password/
    שולח קישור לאיפוס סיסמה למייל
    """
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'נא להזין אימייל.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'אימייל לא נמצא.'},
                            status=status.HTTP_404_NOT_FOUND)

        token = get_random_string(50)
        user.reset_token = token
        user.save()

        reset_link = f"http://localhost:3000/reset-password/{user.id}/{token}"
        send_mail(
            subject='איפוס סיסמה',
            message=f'לשינוי הסיסמה, לחץ כאן: {reset_link}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'קישור איפוס נשלח למייל.'},
                        status=status.HTTP_200_OK)


class ResetPasswordAPIView(APIView):
    """
    POST /User/reset-password/<user_id>/<token>/
    מאפס סיסמה על פי טוקן
    """
    def post(self, request, user_id, token):
        pwd = request.data.get('password')
        confirm = request.data.get('confirm')
        if not pwd or pwd != confirm:
            return Response({'error': 'הסיסמאות לא תואמות.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id, reset_token=token)
        except User.DoesNotExist:
            return Response({'error': 'קישור לא תקין.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(pwd)
        user.reset_token = None
        user.save()
        return Response({'message': 'הסיסמה אופסה בהצלחה.'},
                        status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_user(request, user_id):
    """
    PUT /User/update/<user_id>/
    עדכון פרופיל: full_name, email, id_number, role,
                 department (id), phone_number
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'משתמש לא נמצא.'},
                        status=status.HTTP_404_NOT_FOUND)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'error': next(iter(serializer.errors.values()))[0]},
                        status=status.HTTP_400_BAD_REQUEST)

    # בדיקת department אם נשלח
    dept_id = request.data.get('department')
    if 'department' in request.data and dept_id:
        try:
            Department.objects.get(id=dept_id)
        except Department.DoesNotExist:
            return Response({'error': 'מחלקה לא קיימת.'},
                            status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    return Response({'message': 'הפרופיל עודכן בהצלחה!'},
                    status=status.HTTP_200_OK)


class ChangePasswordAPIView(APIView):
    """
    PUT /User/change-password/<user_id>/
    משנה סיסמה קיימת
    """
    def put(self, request, user_id):
        old = request.data.get('old_password')
        new = request.data.get('new_password')
        if not old or not new:
            return Response({'error': 'נא למלא סיסמה ישנה וחדשה.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'משתמש לא נמצא.'},
                            status=status.HTTP_404_NOT_FOUND)

        if not check_password(old, user.password):
            return Response({'error': 'הסיסמה הנוכחית שגויה.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(new)
        user.save()
        return Response({'message': 'הסיסמה עודכנה בהצלחה!'},
                        status=status.HTTP_200_OK)


@api_view(['GET'])
def users_by_department(request, department_id):
    """
    GET /api/users/department/<department_id>/
    מחזיר את כל המשתמשים ב־Department עם ה-ID שנשלח
    """
    users = User.objects.filter(department__id=department_id)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_user(request, user_id):
    """
    DELETE /User/delete/<user_id>/
    מוחק משתמש לפי ID
    """
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'error': 'משתמש לא נמצא.'},
                        status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def assign_courses_to_lecturer(request, pk):
    try:
        lecturer = User.objects.get(id=pk, role='lecturer')
    except User.DoesNotExist:
        return Response({'error': 'Lecturer not found'}, status=404)

    course_ids = request.data.get('course_ids', [])
    courses = Course.objects.filter(id__in=course_ids, department=lecturer.department)

    lecturer.courses.set(courses)  # מעדכן את כל הקורסים עבור המרצה
    return Response({'success': True})

# פתיחת הלקוח עם המפתח מהסביבה
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# מילון גלובלי לשמירת הקשר לפי מזהה סטודנט
conversation_context = {}

from rest_framework.decorators import api_view
from rest_framework.response import Response
from student_requests.models import Request


from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def chatbot_view(request):
    user_message = request.data.get('message', '').lower().strip()
    student_id = request.data.get('student_id')

    if not user_message:
        return Response({'reply': 'לא התקבלה הודעה'}, status=400)

    try:
        # 🔍 בדיקת סטטוס בקשות
        if any(kw in user_message for kw in ["מה מצב הבקשות", "מה הסטטוס", "הבקשות שלי", "עדכון על הבקשות"]):
            if not student_id:
                return Response({'reply': 'חסרים פרטי מזהה סטודנט לבדיקת בקשות.'}, status=400)

            requests = Request.objects.filter(student__id=student_id)
            if not requests.exists():
                return Response({'reply': 'לא נמצאו בקשות קודמות במערכת.'})

            reply_lines = ["📋 הנה רשימת הבקשות שלך:\n"]
            for r in requests:
                reply_lines.append(f"• {r.subject} ({r.request_type}) – סטטוס: {r.status}")
            return Response({'reply': "\n".join(reply_lines)})

        # 🧠 ניסוח בקשה לפי הקשר
        if any(kw in user_message for kw in ["ניסוח", "ניסח", "לא יודע מה לרשום", "איך לנסח", "תעזור לי לנסח", "עזור לי לכתוב", "לרשום נימוק", "איך לכתוב", "איך מתחילים"]):
            if "ערעור" in user_message:
                return Response({'reply': (
                    "📄 הנה דוגמה לנימוק לערעור על ציון:\n\n"
                    "נימוק לדוגמה: במהלך הבחינה עניתי על כל השאלות, אך שאלה מספר 3 כנראה לא נבדקה כלל. בנוסף, ייתכן והייתה טעות בהזנת הציון. אשמח לבדיקה נוספת.\n\n"
                    "✅ תוכל לערוך את הנוסח הזה בהתאם למקרה שלך או לספק לי פרטים ואנסח עבורך."
                )})
            elif "פטור" in user_message:
                return Response({'reply': (
                    "📄 הנה דוגמה לנימוק לבקשת פטור מקורס:\n\n"
                    "נימוק לדוגמה: הקורס 'מבוא לסטטיסטיקה' נלמד באוניברסיטת תל אביב בשנת 2022. תכניו חופפים לתכני הקורס הנוכחי, כולל חישובי הסתברות ורגרסיה. מצורפים סילבוס וגיליון ציונים.\n\n"
                    "✅ תוכל לשנות את הפרטים או לספר לי יותר כדי שאנסח עבורך גרסה מותאמת."
                )})
            elif "מילואים" in user_message:
                return Response({'reply': (
                    "📄 דוגמה לניסוח לבקשת מילואים:\n\n"
                    "נימוק לדוגמה: שירתתי במילואים בין 03.05 ל־15.05, דבר שמנע ממני להגיש את העבודה בזמן. אני מבקש הארכת מועד בהתאם להנחיות. מצורף צו קריאה.\n\n"
                    "✅ אפשר לשנות או לנסח יחד לפי הפרטים שלך."
                )})
            else:
                return Response({'reply': (
                    "📝 אשמח לעזור בניסוח! באיזו בקשה מדובר?\n"
                    "• ערעור על ציון\n"
                    "• פטור מקורס\n"
                    "• בקשת מילואים\n"
                    "• בקשה אחרת\n\n"
                    "כתוב לי את סוג הבקשה ופרטים חשובים, ואנסח עבורך נוסח מקצועי."
                )})

        # 💬 תגובות מותאמות לפי נושא
        if any(kw in user_message for kw in ["איך להגיש בקשה", "להגיש בקשה", "איפה מגישים", "איך אני מגיש"]):
            return Response({'reply': (
                "📝 ניתן להגיש באתר 4 סוגי בקשות:\n"
                "1️⃣ ערעור על ציון\n"
                "2️⃣ בקשה לפטור מקורס\n"
                "3️⃣ בקשת מילואים\n"
                "4️⃣ בקשה אחרת\n\n"
                "גש לעמוד הגשת בקשה ובחר את הסוג המתאים מהרשימה."
            )})

        elif "ערעור" in user_message:
            return Response({'reply': (
                "📝 כדי להגיש ערעור על ציון, נא למלא את השדות הבאים:\n"
                "• שם הקורס\n"
                "• שם המרצה\n"
                "• מועד הבחינה\n"
                "• הציון שהתקבל\n"
                "• נימוק לערעור (לדוגמה: טעות סריקה, שאלה לא נבדקה)\n"
                "📎 ניתן גם לצרף קובץ (לא חובה).\n\n"
                "גש לטופס 'ערעור על ציון' בעמוד הבקשות."
            )})

        elif "פטור" in user_message:
            return Response({'reply': (
                "🎓 בקשה לפטור מקורס מחייבת את המידע הבא:\n"
                "• שם הקורס ממנו מבוקש הפטור\n"
                "• שם המוסד הקודם\n"
                "• שם הקורס שנלמד שם\n"
                "• נימוק (לדוגמה: תוכן קורס זהה, הישגים גבוהים וכו')\n"
                "📎 חובה לצרף סילבוס וגיליון ציונים.\n\n"
                "גש לטופס 'פטור מקורס' בעמוד הבקשות."
            )})

        elif "מילואים" in user_message:
            return Response({'reply': (
                "🪖 לבקשת מילואים יש למלא את הפרטים הבאים:\n"
                "• תאריך תחילת שירות\n"
                "• תאריך סיום (אם קיים)\n"
                "• מספר צו או יחידה\n"
                "• פירוט הבקשה (דחיית מבחן, הארכת מועד וכו')\n"
                "📎 ניתן לצרף את צו המילואים.\n\n"
                "גש לטופס 'בקשת מילואים' בעמוד הבקשות."
            )})

        elif "בקשה אחרת" in user_message or "בקשה מיוחדת" in user_message:
            return Response({'reply': (
                "📄 לבקשות מיוחדות יש למלא:\n"
                "• נושא הבקשה (כותרת קצרה)\n"
                "• פירוט מלא וברור\n"
                "📎 ניתן לצרף מסמכים תומכים אם רלוונטי.\n\n"
                "גש לטופס 'בקשה אחרת' בעמוד הבקשות."
            )})

        # 🤖 ברירת מחדל – שימוש ב־GPT
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "קוראים לך אקדמוס"
                        "אתה עוזר וירטואלי לסטודנטים באתר המיועד להגשת בקשות אקדמיות. "
                        "אתה מסייע בהכוונה, הסבר וכתיבה של בקשות מסוגים שונים כגון ערעור על ציון, "
                        "פטור מקורס, בקשת מילואים ובקשות מיוחדות. "
                        "אם הסטודנט שואל שאלה כללית, עזור לו להבין איזה סוג בקשה עליו להגיש והפנה אותו לעמוד הרלוונטי."

                    )
                },
                {"role": "user", "content": user_message}
            ]
        )
        reply = response.choices[0].message.content
        return Response({'reply': reply})

    except Exception as e:
        return Response({'reply': f"שגיאה: {str(e)}"}, status=500)

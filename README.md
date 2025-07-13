# מערכת אינטראקטיבית למילוי בקשות סטודנט

**פרויקט גמר בקורס ניהול פרויקטי תוכנה | SCE 2025**

מערכת דיגיטלית אינטואיטיבית להגשת ומעקב אחר בקשות סטודנטים, מרצים ומזכירות.  
המערכת מספקת חוויית שימוש מתקדמת, אוטומציה, שקיפות ותהליך זרימה מהיר ונוח.

---

## ⚡ התקנה והרצה מקומית

### שלב ראשון – קובץ .env
- יש להוריד את קובץ ה-`.env` מהקישור הבא: https://drive.google.com/file/d/1UHJvjXulNRyFLYQp0fViOkuItKpPrQcz/view?usp=sharing
- יש למקם אותו בתיקיית `backend` אחרי שהורדת את הקוד (`git clone`).

---

### טרמינל ראשון – הפעלת ה-Backend (Django)

1. **נווט לתיקיית** `backend` בטרמינל.
2. **מחק את תיקיית** `venv` הקיימת אם יש.
3. הפעל:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate    # ב-Windows
    pip install -r requirements.txt
    ```
4. הרץ:
    ```bash
    python manage.py makemigrations
    ```
    - אם קופצת שגיאה שחסרות חבילות (למשל `dotenv`, `openai`), התקן ידנית (`pip install package_name`) והרץ שוב את הפקודה עד שתצליח.
5. המשך:
    ```bash
    python manage.py migrate
    python manage.py createsuperuser
    ```
    - צור משתמש אדמין (לכניסה לכתובת http://localhost:8000/admin/)
6. הפעל את השרת:
    ```bash
    python manage.py runserver
    ```

---

### טרמינל שני – הפעלת ה-Frontend (React)

1. **נווט לתיקיית** `frontend` בטרמינל.
2. הפעל:
    ```bash
    npm install
    npm start
    ```

---

> **לאחר ההרצה, יש להיכנס לממשק admin וליצור מחלקה לפני ההרשמה למערכת!**

---

## 🧩 טכנולוגיות עיקריות

- **Backend:** Django, Django REST Framework (Python)
- **Frontend:** React
- **DB:** SQLite (פיתוח)
- **DevOps:** GitHub, Jira, Jenkins (CI/CD)
- **AI:** אינטגרציה עם ChatBot מבוסס OpenAI

---

## 🚀 פיצ'רים עיקריים

- הרשמה והתחברות עם שכחת סיסמה לכל סוג משתמש
- פרופיל אישי ועדכון פרטים (כולל העלאת מסמך מילואים)
- הגשת בקשות חכמות: ערעורים, אישורים, חריגות ועוד
- ניהול ומעקב סטטוס בקשות, התראות ועדכונים
- Dashboard ניהולי למזכירות, מרצים וסטודנטים
- מערכת דירוגים ומשובים
- חיפוש וסינון בקשות מתקדם
- צ'אט־בוט חכם (AI) למענה מהיר על שאלות

---

## 👨‍💻 צוות הפרויקט

- מקסי ישראל קרוטינסקי
- גל משה טאייב
- רוי בוקר
- נועם קדוש
  

---

## הערות ודרישות מערכת

- הפרויקט פועל בתצורת Client-Server – חובה להפעיל את ה-Backend וה-Frontend במקביל.
- Python 3.11 ומעלה, NodeJS עדכני.
- עבודה רציפה עם GitHub, Jira, Jenkins.
- כל שינוי – קומיט ו־Push מסודר ל־GitHub.

---

בהצלחה!  
כל שאלה, אפשר לפנות ל־admin או לכתוב בקבוצת הפרויקט 🙌

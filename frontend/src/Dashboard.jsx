import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Map roles to Hebrew labels
const roleLabels = {
  student: 'סטודנט',
  lecturer: 'מרצה',
  admin: 'מזכירה',
};

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // הגדרת פונקציות המרת תאריך לפורמט עברי
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('he-IL', options);
  };

  // מדידת ימים נותרים עד לתאריך יעד
  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // פונקציה לשליפת תאריכים חשובים והודעות מערכת
  const fetchSystemData = async () => {
    try {
      // שליפת תאריכים חשובים
      const deadlinesResponse = await fetch('http://localhost:8000/api/system/deadlines/');
      if (deadlinesResponse.ok) {
        const data = await deadlinesResponse.json();
        // חישוב ימים נותרים והוספה למערך
        const deadlinesWithDays = data.map(deadline => ({
          ...deadline,
          days: getDaysRemaining(deadline.date)
        }));
        // מיון לפי דחיפות (ימים נותרים)
        deadlinesWithDays.sort((a, b) => a.days - b.days);
        setUpcomingDeadlines(deadlinesWithDays);
      } else {
        // אם אין API או הוא לא זמין, נשתמש בנתונים קבועים
        const defaultDeadlines = [
          { id: 1, title: 'מועד אחרון להגשת ערעורים', date: '2023-06-15', days: 10 },
          { id: 2, title: 'מועד אחרון לרישום לקורסי בחירה', date: '2023-06-05', days: 2 },
          { id: 3, title: 'תחילת בחינות סמסטר ב', date: '2023-06-20', days: 15 }
        ];
        setUpcomingDeadlines(defaultDeadlines);
      }

      // שליפת הודעות מערכת
      const announcementsResponse = await fetch('http://localhost:8000/api/system/announcements/');
      if (announcementsResponse.ok) {
        const data = await announcementsResponse.json();
        // מיון לפי תאריך - החדשות ביותר קודם
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAnnouncements(data);
      } else {
        // אם אין API או הוא לא זמין, נשתמש בנתונים קבועים
        const defaultAnnouncements = [
          { id: 1, title: 'פעילות תחזוקה מתוכננת', content: 'המערכת תהיה בתחזוקה ביום שישי הקרוב בין השעות 22:00-24:00.', date: '2023-05-13' },
          { id: 2, title: 'עדכון טפסי בקשות', content: 'הטפסים לבקשות פטור ומילואים עודכנו. אנא השתמשו בגרסאות החדשות.', date: '2023-05-10' }
        ];
        setAnnouncements(defaultAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
      // במקרה של שגיאה - נתונים קבועים
      setUpcomingDeadlines([
        { id: 1, title: 'מועד אחרון להגשת ערעורים', date: '2023-06-15', days: 10 },
        { id: 2, title: 'מועד אחרון לרישום לקורסי בחירה', date: '2023-06-05', days: 2 },
        { id: 3, title: 'תחילת בחינות סמסטר ב', date: '2023-06-20', days: 15 }
      ]);
      setAnnouncements([
        { id: 1, title: 'פעילות תחזוקה מתוכננת', content: 'המערכת תהיה בתחזוקה ביום שישי הקרוב בין השעות 22:00-24:00.', date: '2023-05-13' },
        { id: 2, title: 'עדכון טפסי בקשות', content: 'הטפסים לבקשות פטור ומילואים עודכנו. אנא השתמשו בגרסאות החדשות.', date: '2023-05-10' }
      ]);
    }
  };

  // פונקציה לשליפת נתונים עבור הבקשות
  const fetchRequestStats = async (userId, userRole, departmentId) => {
    try {
      let requestsData = [];
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // אם יש מנגנון אימות
      };
      
      // שליפת בקשות לפי תפקיד
      if (userRole === 'student') {
        // סטודנט - שליפת הבקשות האישיות
        const response = await fetch(`http://localhost:8000/api/requests/by-student/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: userId }),
        });
        if (response.ok) {
          requestsData = await response.json();
        }
      } else if (userRole === 'lecturer') {
        // מרצה - שליפת הבקשות שהוא אחראי עליהן
        const data = { lecturer_id: userId };
        const response = await fetch('http://localhost:8000/api/requests/manage/', {
          method: 'POST', 
          headers,
          body: JSON.stringify(data)
        });
        if (response.ok) {
          requestsData = await response.json();
        }
      } else if (userRole === 'admin') {
        // מזכירה - שליפת בקשות לפי מחלקה
        const data = { department_id: departmentId };
        const response = await fetch('http://localhost:8000/api/requests/manage/', {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        if (response.ok) {
          requestsData = await response.json();
        }
      }
      
      // חישוב סטטיסטיקות מהנתונים
      if (requestsData && requestsData.length > 0) {
        const total = requestsData.length;
        const pending = requestsData.filter(req => req.status === 'ממתין').length;
        const inProgress = requestsData.filter(req => req.status === 'בטיפול').length;
        const approved = requestsData.filter(req => req.status === 'אושר').length;
        const rejected = requestsData.filter(req => req.status === 'נדחה').length;
        
        return { total, pending, inProgress, approved, rejected };
      }
      
      // ערכי ברירת מחדל אם אין מידע
      console.log('No data found, returning default values');
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        approved: 0,
        rejected: 0
      };
    } catch (error) {
      console.error('Error fetching request stats:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        approved: 0,
        rejected: 0
      };
    }
  };

  // פונקציה לשליפת הבקשות האחרונות
  const fetchRecentRequests = async (userId, userRole, departmentId) => {
    try {
      let requests = [];
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // אם יש מנגנון אימות
      };
      
      if (userRole === 'student') {
        // עבור סטודנט, נשתמש ב-API של הבקשות שלו
        const response = await fetch(`http://localhost:8000/api/requests/by-student/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: userId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          requests = data;
        }
      } else if (userRole === 'lecturer') {
        // עבור מרצה, נשתמש ב-API לניהול בקשות של המרצה הספציפי
        const data = { lecturer_id: userId };
        const response = await fetch('http://localhost:8000/api/requests/manage/', {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          requests = await response.json();
        }
      } else if (userRole === 'admin') {
        // עבור מזכירה, נשתמש ב-API לניהול בקשות של המחלקה
        const data = { department_id: departmentId };
        const response = await fetch('http://localhost:8000/api/requests/manage/', {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          requests = await response.json();
        }
      }
      
      // מיון הבקשות לפי תאריך ושליפת 5 האחרונות
      if (requests && requests.length > 0) {
        requests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        return requests.slice(0, 5);
      }
      
      // אם אין נתונים, מחזירים מערך ריק
      console.log('No recent requests found');
      return [];
    } catch (error) {
      console.error('Error fetching recent requests:', error);
      return [];
    }
  };

  useEffect(() => {
    // קריאת מידע המשתמש מהלוקאל סטורג'
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // טעינת נתונים לפי תפקיד המשתמש
      const loadData = async () => {
        try {
          // טעינת מידע מערכתי (תאריכים והודעות)
          await fetchSystemData();
          
          // ודא שיש לנו את כל המידע הנדרש לשליפת נתונים
          const userId = parsedUser.id;
          const userRole = parsedUser.role;
          const departmentId = parsedUser.department || parsedUser.departmentId;
          
          if (!userId || !userRole) {
            console.error('Missing user data: id or role missing');
            setLoading(false);
            return;
          }
          
          if (userRole === 'admin' && !departmentId) {
            console.warn('Admin user missing department ID');
          }
          
          // טעינת סטטיסטיקות בקשות
          const requestStatsData = await fetchRequestStats(userId, userRole, departmentId);
          setStats(requestStatsData);
          
          // טעינת בקשות אחרונות
          const recentRequestsData = await fetchRecentRequests(userId, userRole, departmentId);
          setRecentRequests(recentRequestsData);
          
          setLoading(false);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setLoading(false);
        }
      };
      
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  // אם יש טעינה או אין משתמש מחובר
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">טוען את הפורטל...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">לא מחובר</h1>
          <p className="text-gray-600 mb-6">עליך להתחבר למערכת כדי לצפות בדף הבית.</p>
          <Link to="/" className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
            התחבר למערכת
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Hero Section - מותאם לפי תפקיד */}
      <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 text-white shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start gap-6 rtl">
            <div className="hidden md:block">
              <div className="relative w-44 h-44 bg-white/20 backdrop-blur-sm rounded-full flex justify-center items-center">
                <div className="w-36 h-36 bg-white rounded-full flex justify-center items-center text-5xl font-bold text-blue-900">
                  {user.full_name?.split(' ').map(name => name[0]).join('')}
                </div>
              </div>
            </div>
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl font-bold">
                שלום {user.full_name} 👋
              </h1>
              <p className="text-blue-100 leading-relaxed">
                {user.role === 'student' ? (
                  'ברוך הבא לפורטל Student+, כאן תוכל להגיש בקשות אקדמיות ולעקוב אחר הסטטוס שלהן בקלות. מהממשק הידידותי תוכל לצפות בכל הבקשות שלך ולתקשר עם צוות המוסד.'
                ) : user.role === 'lecturer' ? (
                  'ברוך הבא לפורטל Student+, כאן תוכל לנהל בקשות של סטודנטים מהמחלקה שלך, לראות סטטיסטיקות ולטפל בבקשות הממתינות לאישורך.'
                ) : (
                  'ברוך הבא לפורטל הניהולי Student+, מכאן תוכל לנהל בקשות של כלל הסטודנטים במערכת, לעקוב אחר נתונים סטטיסטיים ולשפר את יעילות הטיפול בפניות.'
                )}
              </p>
              <div className="flex space-x-4 rtl:space-x-reverse">
                {user.role === 'student' ? (
                  <>
                    <Link to="/request" className="bg-white text-blue-900 font-medium px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      הגש בקשה חדשה
                    </Link>
                    <Link to="/my-requests" className="bg-transparent text-white border border-white/40 px-5 py-2 rounded-lg hover:bg-white/10 transition-colors">
                      הבקשות שלי
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/manage-requests" className="bg-white text-blue-900 font-medium px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      ניהול בקשות
                    </Link>
                    {user.role === 'admin' && (
                      <Link to={`/user-management/users/${user.department}`} className="bg-transparent text-white border border-white/40 px-5 py-2 rounded-lg hover:bg-white/10 transition-colors">
                        ניהול משתמשים
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* חלק תחתון עם שני אזורים */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* בקשות אחרונות */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              {user.role === 'student' ? 'הבקשות האחרונות שלי' : 'בקשות אחרונות במערכת'}
            </h2>
            <Link 
              to={user.role === 'student' ? '/my-requests' : '/manage-requests'} 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {user.role === 'student' ? 'צפה בכל הבקשות שלי' : 'ניהול בקשות'}
            </Link>
          </div>
          <div className="divide-y">
            {recentRequests.map(request => (
              <div key={request.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1 text-lg">{request.subject}</h3>
                  <div className="flex items-center flex-wrap">
                    {/* שם הסטודנט - מוצג רק למרצים ומנהלים */}
                    {user.role !== 'student' && (
                      <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-1 mr-2 mb-1">
                        {request.student_name || (request.student && request.student.full_name) || 'סטודנט'}
                      </span>
                    )}
                    
                    {/* סטטוס */}
                    <div className={`py-1 px-2 rounded-full text-xs font-medium mr-2 mb-1 ${
                      request.status === 'אושר' ? 'bg-green-100 text-green-800' : 
                      request.status === 'נדחה' ? 'bg-red-100 text-red-800' : 
                      request.status === 'בטיפול' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </div>
                    
                    {/* סוג בקשה */}
                    <span className="text-xs text-gray-500 mr-2 mb-1">
                      {request.request_type === 'appeal' ? 'ערעור' : 
                       request.request_type === 'exemption' ? 'פטור' : 
                       request.request_type === 'military' ? 'מילואים' : 'אחר'}
                    </span>
                  </div>
                  
                  {/* שם המרצה המטפל - מוצג בשורה נפרדת */}
                  {request.assigned_lecturer && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-900 font-bold">
                        מרצה: {request.assigned_lecturer.full_name || 'לא מוגדר'}
                      </span>
                    </div>
                  )}
                  
                  {/* תאריך - מוצג בשורה נפרדת */}
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDate(request.submitted_at)}
                    </span>
                  </div>
                </div>
                <div>
                  <Link 
                    to={user.role === 'student' ? `/my-requests` : `/manage-requests`}
                    className="text-gray-400 hover:text-blue-600 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
            {recentRequests.length === 0 && (
              <div className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">אין בקשות להצגה</p>
                {user.role === 'student' && (
                  <Link to="/request" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    הגש בקשה חדשה
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* לוח זמנים */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-gray-800">תאריכים חשובים</h2>
          </div>
          <div className="divide-y">
            {upcomingDeadlines.map(deadline => (
              <div key={deadline.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className={`p-2 mr-4 rounded-lg ${deadline.days <= 3 ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${deadline.days <= 3 ? 'text-red-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mr-2">
                    <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">{deadline.date}</span>
                      <span className={`mr-2 text-xs font-medium ${deadline.days <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                        {deadline.days} ימים נותרו
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* הודעות מערכת */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-gray-800">הודעות מערכת</h2>
          </div>
          <div className="divide-y">
            {announcements.map(announcement => (
              <div key={announcement.id} className="p-4 hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                <p className="text-xs text-gray-500 mt-2">{announcement.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* מדריך מהיר - מותאם לפי תפקיד */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {user.role === 'student' ? 'מדריך מהיר לסטודנטים' : 'טיפים מהירים למשתמשי המערכת'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user.role === 'student' ? (
            <>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">הגשת בקשה</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  לחץ על "הגש בקשה חדשה", בחר את סוג הבקשה הרצוי ומלא את הטופס המתאים.
                </p>
              </div>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">מעקב בקשות</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  צפה בכל הבקשות שלך בעמוד "הבקשות שלי" וקבל עדכונים אוטומטיים על שינויי סטטוס.
                </p>
              </div>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">תקשורת</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  תוכל לתקשר ישירות עם הסגל האקדמי דרך מערכת התגובות בכל בקשה.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">ניהול וטיפול בבקשות</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  באזור "ניהול בקשות" תוכל לצפות, לטפל ולעדכן סטטוס של בקשות סטודנטים הממתינות לאישורך.
                </p>
              </div>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">תקשורת עם סטודנטים</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  ניתן להגיב לכל בקשה ולהשאיר הודעות/הערות לסטודנט ישירות מעמוד הבקשה.
                </p>
              </div>
              <div className="border border-dashed border-gray-300 p-4 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <h3 className="mr-2 text-lg font-medium text-gray-900">נתונים סטטיסטיים</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  עקוב אחר מגמות וסטטיסטיקות המערכת לייעול תהליך הטיפול בבקשות והעלאת שביעות רצון הסטודנטים.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

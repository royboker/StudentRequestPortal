import React, { useState, useEffect } from 'react';

// Map roles to Hebrew labels
const roleLabels = {
  student: 'סטודנט',
  lecturer: 'מרצה',
  admin: 'מזכירה',
};

const categoryLabels = {
  website: 'האתר',
  process: 'תהליך הבקשות',
  general: 'כללי'
};

const ratingLabels = {
  1: 'גרוע מאוד',
  2: 'גרוע',
  3: 'בסדר',
  4: 'טוב',
  5: 'מעולה'
};

function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    rating: 'all',
    sortBy: 'newest'
  });
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    byCategory: {},
    byRating: {}
  });

  useEffect(() => {
    // בדיקת הרשאות
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'admin') {
        setError('אין לך הרשאה לצפות בדף זה');
        setLoading(false);
        return;
      }
      
      fetchFeedbacks();
    } else {
      setError('עליך להתחבר למערכת');
      setLoading(false);
    }
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/requests/feedback/');
      
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
        calculateStats(data);
      } else {
        setError('שגיאה בטעינת המשובים');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשוב הזה?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/requests/feedback/${feedbackId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // הסרת המשוב מהרשימה מבלי לטעון מחדש את כל הנתונים
        const updatedFeedbacks = feedbacks.filter(f => f.id !== feedbackId);
        setFeedbacks(updatedFeedbacks);
        calculateStats(updatedFeedbacks);
      } else {
        alert('שגיאה במחיקת המשוב');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('שגיאה בחיבור לשרת');
    }
  };

  const calculateStats = (feedbackData) => {
    const total = feedbackData.length;
    const averageRating = total > 0 
      ? (feedbackData.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
      : 0;

    const byCategory = {};
    const byRating = {};

    feedbackData.forEach(feedback => {
      // סטטיסטיקות לפי קטגוריה
      byCategory[feedback.category] = (byCategory[feedback.category] || 0) + 1;
      
      // סטטיסטיקות לפי דירוג
      byRating[feedback.rating] = (byRating[feedback.rating] || 0) + 1;
    });

    setStats({ total, averageRating, byCategory, byRating });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredFeedbacks = () => {
    let filtered = [...feedbacks];

    // סינון לפי קטגוריה
    if (filters.category !== 'all') {
      filtered = filtered.filter(f => f.category === filters.category);
    }

    // סינון לפי דירוג
    if (filters.rating !== 'all') {
      filtered = filtered.filter(f => f.rating === parseInt(filters.rating));
    }

    // מיון
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filtered;
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען משובים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">שגיאה</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const filteredFeedbacks = getFilteredFeedbacks();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 text-white shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-start gap-6 rtl">
            <div className="hidden md:block">
              <div className="relative w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex justify-center items-center">
                <div className="w-24 h-24 bg-white rounded-full flex justify-center items-center text-4xl">
                  📊
                </div>
              </div>
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold">
                ניהול משובים 📈
              </h1>
              <p className="text-blue-100 leading-relaxed text-lg">
                כאן תוכלי לצפות בכל המשובים שהתקבלו מסטודנטים ומרצים, לנתח מגמות ולזהות נקודות לשיפור במערכת.
              </p>
              <div className="flex items-center space-x-6 rtl:space-x-reverse text-blue-100">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📝</span>
                  <span>{stats.total} משובים</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">⭐</span>
                  <span>ממוצע: {stats.averageRating}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  <span>ניתוח מפורט</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg ml-4">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">סה"כ משובים</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg ml-4">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">דירוג ממוצע</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg ml-4">
              <span className="text-2xl">👍</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">דירוגים גבוהים (4-5)</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.byRating[4] || 0) + (stats.byRating[5] || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg ml-4">
              <span className="text-2xl">👎</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">דירוגים נמוכים (1-2)</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.byRating[1] || 0) + (stats.byRating[2] || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* פילטרים */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">סינון וחיפוש</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">כל הקטגוריות</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">דירוג</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">כל הדירוגים</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>{rating} כוכבים</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מיון</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">החדשים ביותר</option>
              <option value="oldest">הישנים ביותר</option>
              <option value="highest">דירוג גבוה לנמוך</option>
              <option value="lowest">דירוג נמוך לגבוה</option>
            </select>
          </div>
        </div>
      </div>

      {/* רשימת משובים */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">משובים ({filteredFeedbacks.length})</h2>
            <button
              onClick={fetchFeedbacks}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              רענן
            </button>
          </div>
        </div>

        <div className="divide-y">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">אין משובים להצגה</h3>
              <p className="text-gray-600">לא נמצאו משובים התואמים לקריטריונים שנבחרו</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* כותרת עם פרטי המשתמש */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold">
                          {feedback.is_anonymous ? '?' : feedback.user_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {feedback.is_anonymous ? 'משתמש אנונימי' : feedback.user_name || 'משתמש לא ידוע'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(feedback.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* תגיות */}
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {categoryLabels[feedback.category] || feedback.category}
                      </span>
                      <div className="flex items-center">
                        <span className={`text-lg ${getRatingColor(feedback.rating)}`}>
                          {getRatingStars(feedback.rating)}
                        </span>
                        <span className="text-sm text-gray-600 mr-2">
                          ({feedback.rating}/5 - {ratingLabels[feedback.rating]})
                        </span>
                      </div>
                      {feedback.is_anonymous && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          אנונימי
                        </span>
                      )}
                    </div>

                    {/* תוכן המשוב */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed">{feedback.comment}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 rtl:space-x-reverse">
                    <button
                      onClick={() => deleteFeedback(feedback.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                      title="מחק משוב"
                    >
                      <span className="text-sm">🗑️</span>
                      <span className="text-sm">מחק</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackManagement; 
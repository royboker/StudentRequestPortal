import React, { useState, useEffect } from 'react';

function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // שליפת פרטי המשתמש מ-localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage('שגיאה: לא נמצא משתמש מחובר');
      return;
    }

    if (rating === 0) {
      setMessage('אנא בחר דירוג');
      return;
    }

    if (!comment.trim()) {
      setMessage('אנא כתב תגובה');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/requests/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          rating: rating,
          comment: comment,
          category: category,
          is_anonymous: isAnonymous
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('המשוב נשלח בהצלחה! תודה על התגובה שלך.');
        // איפוס הטופס
        setRating(0);
        setComment('');
        setCategory('general');
        setIsAnonymous(false);
      } else {
        setMessage(data.error || 'שגיאה בשליחת המשוב');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setMessage('שגיאה בחיבור לשרת');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'website', label: 'האתר', icon: '🌐' },
    { value: 'process', label: 'תהליך הבקשות', icon: '📋' },
    { value: 'general', label: 'כללי', icon: '💬' }
  ];

  const StarRating = () => {
    return (
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            className={`text-3xl transition-all duration-200 ${
              star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-300'
            } hover:text-yellow-400 hover:scale-110`}
          >
            ★
          </button>
        ))}
        <span className="mr-3 text-lg text-gray-600 font-medium">
          {rating > 0 && `(${rating}/5)`}
        </span>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">לא מחובר</h1>
          <p className="text-gray-600 mb-6">עליך להתחבר למערכת כדי לשלוח משוב.</p>
        </div>
      </div>
    );
  }

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
                  💬
                </div>
              </div>
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold">
                שתף אותנו במחשבות שלך 🌟
              </h1>
              <p className="text-blue-100 leading-relaxed text-lg">
                המשוב שלך חשוב לנו מאוד! עזור לנו לשפר את המערכת ואת השירות שלנו. 
                כל הערה, הצעה או ביקורת יכולה לעזור לנו להפוך את החוויה שלך לטובה יותר.
              </p>
              <div className="flex items-center space-x-4 rtl:space-x-reverse text-blue-100">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">⭐</span>
                  <span>דירוג מ-1 עד 5</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🔒</span>
                  <span>אפשרות אנונימיות</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">📝</span>
                  <span>תגובה מפורטת</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* טופס המשוב */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">טופס משוב</h2>
              <p className="text-gray-600 mt-2">
                מלא את הפרטים למטה ושלח לנו את המשוב שלך
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* קטגוריה */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-4">
                  בחר קטגוריה
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* דירוג */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-4">
                  איך היית מדרג את החוויה שלך?
                </label>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <StarRating />
                  <p className="text-sm text-gray-500 mt-3">
                    לחץ על הכוכבים כדי לדרג (1 = גרוע מאוד, 5 = מעולה)
                  </p>
                </div>
              </div>

              {/* תגובה */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-4">
                  ספר לנו יותר על החוויה שלך
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                  placeholder="שתף אותנו במחשבות שלך על המערכת, תהליך הבקשות, או כל דבר אחר שתרצה לשפר..."
                />
              </div>

              {/* אנונימי */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="mr-3 text-lg text-gray-700">
                    שלח באופן אנונימי
                  </label>
                  <span className="text-sm text-gray-500">
                    (שמך לא יוצג עם המשוב)
                  </span>
                </div>
              </div>

              {/* הודעה */}
              {message && (
                <div className={`p-4 rounded-xl text-lg ${
                  message.includes('בהצלחה') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* כפתור שליחה */}
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || !comment.trim()}
                className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 ${
                  isSubmitting || rating === 0 || !comment.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    שולח...
                  </div>
                ) : (
                  'שלח משוב 🚀'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* מידע נוסף */}
        <div className="space-y-6">
          {/* למה חשוב המשוב */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">למה חשוב לנו המשוב שלך?</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🎯</div>
                  <div>
                    <h4 className="font-medium text-gray-900">שיפור מתמיד</h4>
                    <p className="text-sm text-gray-600">עוזר לנו לזהות נקודות לשיפור</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🚀</div>
                  <div>
                    <h4 className="font-medium text-gray-900">פיתוח תכונות</h4>
                    <p className="text-sm text-gray-600">מכוון אותנו לפתח מה שחשוב לכם</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🔧</div>
                  <div>
                    <h4 className="font-medium text-gray-900">תיקון בעיות</h4>
                    <p className="text-sm text-gray-600">מאפשר לנו לפתור בעיות מהר יותר</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">💡</div>
                  <div>
                    <h4 className="font-medium text-gray-900">רעיונות חדשים</h4>
                    <p className="text-sm text-gray-600">נותן לנו רעיונות לחידושים</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* סטטיסטיקות */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">המשוב שלנו</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">זמן תגובה ממוצע</span>
                  <span className="font-bold text-green-600">24 שעות</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">שביעות רצון כללית</span>
                  <div className="flex items-center">
                    <span className="font-bold text-yellow-600 mr-1">4.2</span>
                    <span className="text-yellow-400">★★★★☆</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">משובים השבוע</span>
                  <span className="font-bold text-blue-600">47</span>
                </div>
              </div>
            </div>
          </div>

          {/* טיפים */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">💡 טיפים למשוב יעיל</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• היה ספציפי ככל האפשר</li>
              <li>• תאר את הבעיה או ההצעה בפירוט</li>
              <li>• ציין באיזה דפדפן או מכשיר השתמשת</li>
              <li>• הוסף צילומי מסך אם רלוונטי</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback; 
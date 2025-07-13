import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('http://localhost:8000/api/requests/by-student/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: currentUser.id }),
        });
        if (!res.ok) throw new Error('Response not OK');
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setError('שגיאה בטעינת הבקשות');
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const fetchComments = async (requestId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/requests/comments/${requestId}/`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('שגיאה בטעינת תגובות:', err);
    }
  };

  const markCommentsAsRead = async (requestId) => {
    try {
      await fetch(`http://localhost:8000/api/requests/comments/mark-read/${requestId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
    } catch (err) {
      console.warn('שגיאה בסימון תגובות כנקראו');
    }
  };

  const handleOpenModal = async (req) => {
    setSelectedRequest(req);
    setNewComment('');
    await fetchComments(req.id);
    await markCommentsAsRead(req.id);  // סימון כנקראו
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await fetch(`http://localhost:8000/api/requests/comments/add/${selectedRequest.id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: currentUser.id,
          content: newComment,
        }),
      });
      setNewComment('');
      await fetchComments(selectedRequest.id);
    } catch {
      alert('שגיאה בשליחת התגובה');
    }
  };

  const translateType = (type) => {
    switch (type) {
      case 'appeal': return 'ערעור על ציון';
      case 'exemption': return 'פטור מקורס';
      case 'military': return 'בקשת מילואים';
      case 'other': return 'בקשה אחרת';
      default: return type;
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'ממתין': return '⏳ ממתין';
      case 'בטיפול': return '🔄 בטיפול';
      case 'אושר': return '✅ אושר';
      case 'נדחה': return '❌ נדחה';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ממתין': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'בטיפול': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'אושר': return 'bg-green-100 text-green-800 border-green-300';
      case 'נדחה': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const grouped = {
    open: requests.filter(r => r.status === 'ממתין' || r.status === 'בטיפול'),
    closed: requests.filter(r => r.status === 'אושר' || r.status === 'נדחה'),
  };
  const shownRequests = activeTab === 'open' ? grouped.open : grouped.closed;

  // Get counts for statistics
  const getStatusCounts = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'ממתין').length;
    const inProgress = requests.filter(r => r.status === 'בטיפול').length;
    const approved = requests.filter(r => r.status === 'אושר').length;
    const rejected = requests.filter(r => r.status === 'נדחה').length;

    return { total, pending, inProgress, approved, rejected };
  };

  const stats = getStatusCounts();

  // Request card component
  const RequestCard = ({ request }) => (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all mb-4 bg-white">
      <div className="flex flex-col md:flex-row">
        {/* Status indicator */}
        <div className={`p-4 md:w-16 flex flex-row md:flex-col items-center justify-center ${getStatusColor(request.status)}`}>
          <div className="text-xl mb-0 md:mb-2">{request.status === 'ממתין' ? '⏳' : request.status === 'בטיפול' ? '🔄' : request.status === 'אושר' ? '✅' : '❌'}</div>
          <div className="text-xs font-medium mr-2 md:mr-0">{request.status}</div>
        </div>

        {/* Request content */}
        <div className="flex-1 p-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1 truncate">{request.subject}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {translateType(request.request_type)}
                </span>
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {new Date(request.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal(request)}
              className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-full transition-colors"
            >
              פרטים מלאים
            </button>
          </div>

          <div className="mt-2">
            {request.assigned_lecturer && (
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700">מרצה: {request.assigned_lecturer?.full_name || '—'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען בקשות...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-xl">
        <div className="p-6 text-center bg-red-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">{error}</h3>
          <p className="mt-2 text-red-600">אירעה שגיאה בטעינת הבקשות, אנא נסה שוב מאוחר יותר.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 rounded-2xl shadow-xl mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">הבקשות שלי</h1>
          <p className="text-blue-100 max-w-2xl">
            צפה בכל הבקשות שהגשת למערכת, עקוב אחר הסטטוס שלהן, ותקשר ישירות עם צוות המרצים.
          </p>

          {/* Quick statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">סך הכל</div>
              <div className="text-white text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">ממתינות</div>
              <div className="text-white text-2xl font-bold">{stats.pending}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">בטיפול</div>
              <div className="text-white text-2xl font-bold">{stats.inProgress}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">אושרו</div>
              <div className="text-white text-2xl font-bold">{stats.approved}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">נדחו</div>
              <div className="text-white text-2xl font-bold">{stats.rejected}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtering and search section */}
      {/* (Remove the search/filter UI block here) */}

      {/* Requests list with tabs */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <div className="flex space-x-1 rtl:space-x-reverse border rounded-lg p-1 bg-gray-50 text-sm">
              <button
                className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'open' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('open')}
              >
                בקשות פתוחות ({grouped.open.length})
              </button>
              <button
                className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'closed' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTab('closed')}
              >
                בקשות שטופלו ({grouped.closed.length})
              </button>
            </div>
          </div>
        </div>
        
        <div>
          {shownRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">לא נמצאו בקשות</h3>
              <p className="text-gray-600">לא נמצאו בקשות להצגה</p>
            </div>
          ) : (
            <div>
              {shownRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request details modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl relative mx-auto max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="absolute top-4 left-4 text-black/80 hover:text-black hover:bg-gray-100/80 rounded-full p-2 transition-all duration-200"
                aria-label="סגור"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-start justify-between">
                <div className="flex-1 pl-12">
                  <h2 className="text-3xl font-bold mb-2">{selectedRequest.subject}</h2>
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {translateType(selectedRequest.request_type)}
                    </span>
                    <span className="text-white/80 text-sm">
                      הוגש ב-{new Date(selectedRequest.submitted_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg ${getStatusColor(selectedRequest.status)} border-2 border-white/20`}>
                  {translateStatus(selectedRequest.status)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-3 gap-6 p-6">
                {/* פרטי הבקשה */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Request Details Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="flex items-center text-xl font-bold text-gray-800 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center ml-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      תיאור הבקשה
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                        {selectedRequest.description}
                      </p>
                    </div>
                    
                    {selectedRequest.attached_file && (
                      <div className="mt-4">
                        <a 
                          href={`http://localhost:8000${selectedRequest.attached_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors duration-200 border border-blue-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          הורד קובץ מצורף
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Additional Details Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="flex items-center text-xl font-bold text-gray-800 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      פרטים נוספים
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-32">מרצה אחראי:</span>
                        <div className="flex items-center">
                          {selectedRequest.assigned_lecturer ? (
                            <>
                              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold ml-2 text-sm">
                                {selectedRequest.assigned_lecturer.full_name?.charAt(0) || "M"}
                              </div>
                              <span className="text-gray-900">{selectedRequest.assigned_lecturer.full_name}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">לא הוקצה מרצה</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-32">תאריך הגשה:</span>
                        <span className="text-gray-900">
                          {new Date(selectedRequest.submitted_at).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-fit">
                  <h3 className="flex items-center text-xl font-bold text-gray-800 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center ml-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    תגובות ({comments.length})
                  </h3>
                  
                  {/* Comments List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className={`flex ${comment.author_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-3 ${comment.author_id === currentUser.id ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 text-xs">{comment.author_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleDateString('he-IL', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm">אין תגובות עדיין</p>
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">הוסף תגובה</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
                      placeholder="כתוב תגובה..."
                    ></textarea>
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      className="mt-3 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      שלח תגובה
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/UserManagement/UserManagementPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const roleLabels = {
  student:  'סטודנט',
  lecturer: 'מרצה',
  admin:    'מזכירה',
};

const roleColors = {
  student: 'bg-blue-100 text-blue-800 border-blue-300',
  lecturer: 'bg-purple-100 text-purple-800 border-purple-300',
  admin: 'bg-green-100 text-green-800 border-green-300',
};

export default function UserManagementPage() {
  const { departmentId } = useParams();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    full_name: '',
    id_number: '',
    phone_number: '',
    role: '',
    department: '',
  });
  const [courseDialogUser, setCourseDialogUser] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/users/department/${departmentId}/`);
      setUsers(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const fetchDepartments = async () => {
    const res = await axios.get('http://localhost:8000/academics/api/departments/');
    setDepartments(res.data);
  };

  const fetchCourses = async () => {
    const res = await axios.get(`http://localhost:8000/academics/api/courses/?department=${departmentId}`);
    setCourses(res.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchCourses();
  }, [departmentId]);

  const handleEditClick = u => {
    // ניקוי קודם של ה-editData למניעת בעיות
    setEditData({});
    
    // הגדרת ה-ID לעריכה
    setEditingId(u.id);
    
    // עיכוב קצר לאפשר לקומפוננטה להתרנדר מחדש
    setTimeout(() => {
      console.log('Setting edit data for user:', u);
      // פיצול שם מלא לשם פרטי ושם משפחה
      const nameParts = (u.full_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setEditData({
        first_name: u.first_name || firstName,
        last_name: u.last_name || lastName,
        id_number: u.id_number || '',
        phone_number: u.phone_number || '',
        role: u.role || 'student',
        department: u.department || '',
      });
    }, 50);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSaveClick = async id => {
    try {
      await axios.put(`http://localhost:8000/User/update/${id}/`, editData);
      setEditingId(null);
      fetchUsers();
    } catch {
      alert('שגיאה בעדכון המשתמש');
    }
  };

  const handleDeleteClick = async id => {
    if (!window.confirm('בטוח שברצונך למחוק משתמש זה?')) return;
    try {
      await axios.delete(`http://localhost:8000/User/delete/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      alert('שגיאה במחיקת המשתמש');
    }
  };

  const handleApprove = async id => {
    try {
      await axios.put(`http://localhost:8000/User/update/${id}/`, { is_approved: true });
      fetchUsers();
    } catch {
      alert('שגיאה באישור המרצה');
    }
  };

  const handleAssignCourses = (u) => {
    setCourseDialogUser(u);
    setSelectedCourses(u.courses || []);
  };

  const handleCourseChange = (id) => {
    setSelectedCourses(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const saveCourseAssignment = async () => {
    try {
      await axios.put(`http://localhost:8000/User/assign-courses/${courseDialogUser.id}/`, {
        course_ids: selectedCourses,
      });
      setCourseDialogUser(null);
      fetchUsers();
    } catch {
      alert('שגיאה בהשמת הקורסים');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
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
          <h3 className="text-lg font-medium text-red-800">שגיאה בטעינת הנתונים</h3>
          <p className="mt-2 text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const students = users.filter(u => u.role === 'student');
  const approvedLecturers = users.filter(u => u.role === 'lecturer' && u.is_approved);
  const pendingLecturers = users.filter(u => u.role === 'lecturer' && !u.is_approved);
  const admins = users.filter(u => u.role === 'admin');

  const currentDepartmentName = departments.find(d => d.id === Number(departmentId))?.name || 'כל המחלקות';

  // Filter users based on search term
  const filterUsersBySearch = (usersList) => {
    if (!searchTerm) return usersList;
    
    return usersList.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id_number.includes(searchTerm)
    );
  };

  // Get active tab users
  const getActiveTabUsers = () => {
    switch (activeTab) {
      case 'students':
        return filterUsersBySearch(students);
      case 'lecturers':
        return filterUsersBySearch(approvedLecturers);
      case 'pending':
        return filterUsersBySearch(pendingLecturers);
      case 'admins':
        return filterUsersBySearch(admins);
      default:
        return [];
    }
  };

  const activeUsers = getActiveTabUsers();

  // User Card Component
  const UserCard = ({ user, type }) => {
    const isPending = type === 'pending';
    const isEditing = editingId === user.id && !isPending;
    const deptName = departments.find(d => d.id === user.department)?.name || 'לא מוגדר';
    const userInitial = user.full_name?.charAt(0) || "U";
    
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg border border-gray-100 mb-4">
        {isEditing ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם פרטי</label>
                <input
                  name="first_name"
                  value={editData.first_name || ''}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                  lang="he"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם משפחה</label>
                <input
                  name="last_name"
                  value={editData.last_name || ''}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                  lang="he"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ת"ז</label>
                <input
                  name="id_number"
                  value={editData.id_number || ''}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                <input
                  name="phone_number"
                  value={editData.phone_number || ''}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תפקיד</label>
                <select
                  name="role"
                  value={editData.role}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                >
                  <option value="student">סטודנט</option>
                  <option value="lecturer">מרצה</option>
                  <option value="admin">מזכירה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מחלקה</label>
                <select
                  name="department"
                  value={editData.department}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-600 border border-gray-200">{user.email}</div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-100">
              <button
                onClick={handleCancelClick}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={() => handleSaveClick(user.id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start space-x-4 space-x-reverse">
              {/* Avatar and role badge */}
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-500 h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {userInitial}
                </div>
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium text-center ${roleColors[user.role]} border`}>
                  {roleLabels[user.role]}
                </div>
              </div>
              
              {/* User information */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h3>
                    <p className="text-gray-600 mb-4 break-all">{user.email}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 font-medium w-20 flex-shrink-0">ת"ז:</span>
                        <span className="text-gray-900">{user.id_number || '—'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 font-medium w-20 flex-shrink-0">טלפון:</span>
                        <span className="text-gray-900">{user.phone_number || '—'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 font-medium w-20 flex-shrink-0">מחלקה:</span>
                        <span className="text-gray-900">{deptName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-4 lg:mt-0 lg:mr-4 flex flex-wrap gap-2">
                    {isPending ? (
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition-colors font-medium inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        אישור מרצה
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors font-medium inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg transition-colors font-medium inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          מחק
                        </button>
                        {user.role === 'lecturer' && (
                          <button
                            onClick={() => handleAssignCourses(user)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg transition-colors font-medium inline-flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            השמת קורסים
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 rounded-2xl shadow-xl mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">ניהול משתמשים</h1>
          <p className="text-blue-100 max-w-2xl">
            ניהול משתמשים במחלקת {currentDepartmentName}. כאן תוכל לצפות, לערוך ולנהל משתמשים במערכת.
          </p>
          
          {/* Quick statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">סטודנטים</div>
              <div className="text-white text-2xl font-bold">{students.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">מרצים מאושרים</div>
              <div className="text-white text-2xl font-bold">{approvedLecturers.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">מרצים ממתינים</div>
              <div className="text-white text-2xl font-bold">{pendingLecturers.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white text-sm opacity-80">אנשי מנהלה</div>
              <div className="text-white text-2xl font-bold">{admins.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {/* Tabs only */}
        <div className="mb-4">
          <div className="flex space-x-1 rtl:space-x-reverse border rounded-lg p-1 bg-gray-50 text-sm">
            <button
              className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('students')}
            >
              סטודנטים ({students.length})
            </button>
            <button
              className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'lecturers' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('lecturers')}
            >
              מרצים ({approvedLecturers.length})
            </button>
            <button
              className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('pending')}
            >
              ממתינים לאישור ({pendingLecturers.length})
            </button>
            <button
              className={`py-2 px-4 rounded-md transition-colors font-medium ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('admins')}
            >
              מנהלה ({admins.length})
            </button>
          </div>
        </div>
        
        {/* Search bar - positioned below tabs and aligned to right */}
        <div className="text-right mb-6">
          <div className="relative inline-block w-64">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או ת.ז..."
              className="pl-4 pr-10 py-2 border rounded-lg w-full text-right"
              dir="rtl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Users list */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {activeTab === 'students' && 'סטודנטים'}
            {activeTab === 'lecturers' && 'מרצים מאושרים'}
            {activeTab === 'pending' && 'מרצים ממתינים לאישור'}
            {activeTab === 'admins' && 'אנשי מנהלה'}
          </h2>
          
          {activeUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">לא נמצאו משתמשים</h3>
              {searchTerm ? (
                <p className="text-gray-600">לא נמצאו משתמשים התואמים את החיפוש שלך</p>
              ) : (
                <p className="text-gray-600">אין משתמשים בקטגוריה זו</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {activeUsers.map(user => (
                <UserCard key={user.id} user={user} type={activeTab} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Course assignment modal */}
        {courseDialogUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">השמת קורסים עבור {courseDialogUser.full_name}</h2>
            </div>
            
            <div className="p-6">
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-6">
                {courses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">אין קורסים זמינים במחלקה זו</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map(course => (
                      <label key={course.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600 ml-2"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => handleCourseChange(course.id)}
                        />
                        <span>{course.name}</span>
                  </label>
                ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setCourseDialogUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={saveCourseAssignment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  שמור שינויים
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

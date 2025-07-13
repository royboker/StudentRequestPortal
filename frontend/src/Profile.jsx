// src/Profile.jsx

import React, { useState, useEffect } from 'react';

// Map roles to Hebrew labels
const roleLabels = {
  student: 'סטודנט',
  lecturer: 'מרצה',
  admin: 'מזכירה',
};

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [matchError, setMatchError] = useState('');
  const [loading, setLoading] = useState(true);

  const hasUpper = str => /[A-Z]/.test(str);
  const hasLower = str => /[a-z]/.test(str);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:8000/api/academics/departments/')
        .then(res => res.json())
        .catch(err => {
          console.error("Error fetching departments:", err);
          return [];
        }),
      
      new Promise(resolve => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          setEditedData({
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number || ''
          });
        }
        resolve();
      })
    ]).then(([deptData]) => {
      setDepartments(deptData);
      setLoading(false);
    });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
    
    // Update currentUser state immediately for name changes to show in header
    if (name === 'full_name') {
      setCurrentUser(prev => ({ ...prev, full_name: value }));
    }
  };

  const handlePasswordInput = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if ((name === 'confirm_password' || name === 'new_password') && passwordData.new_password) {
      const newPwd = name === 'new_password' ? value : passwordData.new_password;
      const conf  = name === 'confirm_password' ? value : passwordData.confirm_password;
      setMatchError(newPwd !== conf ? 'הסיסמאות אינן תואמות' : '');
    }
  };

  const showPopup = msg => {
    setSuccessMessage(msg);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const saveChanges = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/User/update/${currentUser.id}/`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedData)
        }
      );
      const data = await res.json();
      if (res.ok) {
        const updated = { 
          ...currentUser, 
          ...editedData,
          full_name: editedData.full_name
        };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        setCurrentUser(updated);
        setIsEditing(false);
        showPopup('הפרטים עודכנו בהצלחה!');
      } else {
        alert(data.error || 'שגיאה בעדכון הפרופיל');
      }
    } catch {
      alert('שגיאת רשת - נסה שוב מאוחר יותר');
    }
  };

  const handlePasswordChange = async () => {
    const { old_password, new_password, confirm_password } = passwordData;
    if (!old_password || !new_password || !confirm_password) {
      alert('יש למלא את כל שדות הסיסמה');
      return;
    }
    if (new_password.length < 6 || !hasUpper(new_password) || !hasLower(new_password)) {
      alert('הסיסמה חייבת לכלול לפחות 6 תווים, אות גדולה ואות קטנה');
      return;
    }
    if (new_password !== confirm_password) {
      alert('הסיסמאות אינן תואמות');
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8000/User/change-password/${currentUser.id}/`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ old_password, new_password })
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPasswordData({ old_password:'', new_password:'', confirm_password:'' });
        showPopup('הסיסמה עודכנה בהצלחה!');
      } else {
        alert(data.error || 'שגיאה בשינוי סיסמה');
      }
    } catch {
      alert('שגיאת רשת - נסה שוב מאוחר יותר');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">לא התחברת למערכת</h2>
          <p className="text-red-600">יש להתחבר למערכת כדי לצפות בפרופיל האישי</p>
        </div>
      </div>
    );
  }

  const deptName = departments.find(d => d.id === currentUser.department)?.name || 'לא מוגדר';
  const userInitial = currentUser.full_name?.charAt(0) || "U";

  return (
    <div dir="rtl" className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Success Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-gray-800 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 rounded-2xl shadow-xl mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="bg-white/20 backdrop-blur-sm h-24 w-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 md:mb-0 md:ml-6">
              {userInitial}
            </div>
            <div className="text-center md:text-right">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{currentUser.full_name}</h1>
              <p className="text-blue-100 mb-1">
                <span className="opacity-80">תפקיד:</span> {roleLabels[currentUser.role] || currentUser.role}
              </p>
              <p className="text-blue-100">
                <span className="opacity-80">מחלקה:</span> {deptName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">פרטים אישיים</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  ערוך פרטים
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                    <input
                      name="full_name"
                      value={editedData.full_name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                    <input
                      name="email"
                      value={editedData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון</label>
                    <input
                      name="phone_number"
                      value={editedData.phone_number}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                      type="tel"
                    />
                  </div>
                  <div className="flex justify-end mt-6 space-x-3 space-x-reverse">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={saveChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      שמור שינויים
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">שם מלא</div>
                      <div className="font-medium">{currentUser.full_name}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">אימייל</div>
                      <div className="font-medium">{currentUser.email}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">מספר טלפון</div>
                      <div className="font-medium">{currentUser.phone_number || 'לא הוגדר'}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">תפקיד</div>
                      <div className="font-medium">{roleLabels[currentUser.role] || currentUser.role}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Password Change Card */}
        <div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">שינוי סיסמה</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
                  <input
                    name="old_password"
                    type="password"
                    value={passwordData.old_password}
                    onChange={handlePasswordInput}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
                  <input
                    name="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={handlePasswordInput}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  />
                  <p className="text-xs text-gray-500 mt-1">הסיסמה חייבת לכלול לפחות 6 תווים, אות גדולה ואות קטנה</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה חדשה</label>
                  <input
                    name="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordInput}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  />
                  {matchError && (
                    <p className="text-red-500 text-sm mt-1">{matchError}</p>
                  )}
                </div>
                <button
                  onClick={handlePasswordChange}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                >
                  עדכן סיסמה
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

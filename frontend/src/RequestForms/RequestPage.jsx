import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RequestPage() {
  const navigate = useNavigate();

  const requestTypes = [
    { 
      label: 'ערעור על ציון', 
      path: 'appeal', 
      color: 'from-pink-500 to-red-500',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'הגש ערעור על ציון שקיבלת בקורס'
    },
    { 
      label: 'בקשה לפטור מקורס', 
      path: 'exemption', 
      color: 'from-yellow-400 to-yellow-600',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      description: 'בקש פטור מקורס על סמך לימודים קודמים'
    },
    { 
      label: 'בקשת מילואים', 
      path: 'military', 
      color: 'from-green-400 to-green-600',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      description: 'בקש הקלות עקב שירות מילואים'
    },
    { 
      label: 'בקשה אחרת', 
      path: 'other', 
      color: 'from-purple-400 to-purple-600',
      textColor: 'text-gray-900',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      description: 'הגש בקשה אחרת שאינה מופיעה ברשימה'
    },
  ];

  const navigateBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-700 to-indigo-900 rounded-2xl shadow-xl mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">הגשת בקשה חדשה</h1>
          <p className="text-blue-100 max-w-2xl">
            בחר את סוג הבקשה שברצונך להגיש. מלא את הטופס עם כל הפרטים הנדרשים כדי לזרז את הטיפול בבקשתך.
          </p>
          
          <button
            onClick={navigateBack}
            className="mt-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            חזרה
          </button>
        </div>
      </div>
      
      {/* Request type selection */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">בחר סוג בקשה</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requestTypes.map((req) => (
            <div
              key={req.path}
              onClick={() => navigate(`/request/${req.path}`)}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className={`h-2 w-full bg-gradient-to-r ${req.color}`}></div>
              <div className="p-6">
                <div className={`inline-flex items-center justify-center rounded-full p-3 bg-gradient-to-r ${req.color} bg-opacity-10 text-white mb-4`}>
                  {req.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{req.label}</h3>
                <p className="text-gray-700 text-lg font-semibold mb-4">{req.description}</p>
                <div className={`inline-flex items-center text-sm font-medium bg-gradient-to-r ${req.color} ${req.textColor} px-4 py-2 rounded-lg group-hover:scale-105 transition-transform`}>
                  <span className="ml-2">בחר</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

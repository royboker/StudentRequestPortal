// src/components/Sidebar.jsx

import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Map roles to Hebrew labels
const roleLabels = {
  student: 'סטודנט',
  lecturer: 'מרצה',
  admin: 'מזכירה',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('');
  const [hover, setHover] = useState('');

  // ── here we pull the logged-in user out of localStorage ───────────────────────
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('Current user from localStorage:', currentUser);
  const role = currentUser.role;
  const departmentId = currentUser.departmentId ?? currentUser.department;
  
  // Get first letter of first and last name for avatar
  const getInitials = () => {
    if (!currentUser.full_name) return '?';
    return currentUser.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes('dashboard')) setActiveTab('dashboard');
    else if (path.includes('profile')) setActiveTab('profile');
    else if (path.includes('feedback-management')) setActiveTab('feedback-management');
    else if (path.includes('feedback')) setActiveTab('feedback');
    else if (path.includes('user-management')) setActiveTab('user-management');
    else if (path.includes('my-requests')) setActiveTab('my-requests');
    else if (path.includes('manage-requests')) setActiveTab('manage-requests');
    else if (path.includes('request')) setActiveTab('request');
    else setActiveTab('');
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  // fetch unread notifications
  const fetchNotifications = async () => {
    if (!currentUser.id) return;
    console.log(`Fetching notifications for user: ${currentUser.id}`);
    try {
      const res = await fetch(
        `http://localhost:8000/api/notifications/unread/${currentUser.id}/`
      );
      console.log(`Notification response status: ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log(`Received notifications:`, data);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  // mark all as read
  const markAllAsRead = async () => {
    if (!currentUser.id) return;
    try {
      await fetch(
        `http://localhost:8000/api/notifications/mark-read/${currentUser.id}/`,
        { method: 'POST' }
      );
      setNotifications([]);
      setShowNotifs(false);
    } catch {
      alert('שגיאה בסימון כנקראו');
    }
  };

  // dismiss a single notification
  const markOneAsRead = async (id) => {
    // call same endpoint then remove locally
    await fetch(
      `http://localhost:8000/api/notifications/mark-read/${currentUser.id}/`,
      { method: 'POST' }
    );
    setNotifications(notifications.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up interval to fetch notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showNotifs]);

  // Navigation icons mapping
  const getIcon = (type) => {
    switch(type) {
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        );
      case 'profile':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        );
      case 'user-management':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        );
      case 'request':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        );
      case 'my-requests':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      case 'manage-requests':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        );
      case 'logout':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={`fixed z-20 h-full top-0 right-0 flex flex-col ${isExpanded ? 'w-72' : 'w-20'} transition-all duration-300 bg-white shadow-xl`}>
      {/* Subtle decorative top gradient */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-blue-600 via-purple-500 to-blue-400 rounded-bl-md"></div>
      
      {/* Toggle expand/collapse button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-5 bg-white text-blue-600 rounded-full p-1 shadow-lg hover:bg-blue-50 transition z-50"
      >
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Logo + User Profile + Notifications */}
      <div className={`relative flex flex-col items-center py-6 ${isExpanded ? 'px-4' : 'px-2'}`}>
        {/* Logo with subtle effect */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-blue-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <img src="/logo.png" alt="Logo" className={`relative ${isExpanded ? 'w-32 h-32' : 'w-14 h-14'} transition-all duration-300`} />
        </div>
        
        {/* User avatar and info */}
        <div className={`w-full ${isExpanded ? 'flex items-center' : 'flex flex-col items-center'} bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4 shadow-sm hover:shadow transition-shadow duration-300`}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-500 text-white h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner">
            {getInitials()}
          </div>
          
          {isExpanded && (
            <div className="flex-1 mr-3 text-gray-700">
              <h3 className="font-semibold truncate">{currentUser.full_name || 'משתמש'}</h3>
              <p className="text-xs text-gray-500">{roleLabels[role] || role || 'לא מוגדר'}</p>
            </div>
          )}
          
          {/* Notification button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowNotifs(v => !v);
                if (!showNotifs) fetchNotifications();
              }}
              className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${!isExpanded && 'mt-3'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6
                     0 10-12 0v3.159c0 .538-.214 1.055-.595
                     1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-md">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifs && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <span className="font-semibold text-gray-700 text-sm">התראות</span>
                  {notifications.length > 0 && (
                    <button onClick={markAllAsRead} className="text-blue-600 text-xs hover:underline">
                      סמן כנקראו
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">אין התראות חדשות</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className="flex justify-between items-start px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="text-gray-800 text-sm">{n.message}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(n.created_at).toLocaleString('he-IL')}
                          </p>
                        </div>
                        <button
                          onClick={() => markOneAsRead(n.id)}
                          className="bg-gray-100 text-blue-600 hover:bg-blue-100 p-1 rounded-full ml-2 transition-colors"
                          title="סמן נקרא"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col pb-4 overflow-y-auto px-3">
        <ul className="space-y-2 mt-1">
          <li>
            <Link 
              to="/dashboard" 
              className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                ${activeTab === 'dashboard' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                  : 'text-gray-600 hover:bg-gray-50'} 
                transition-all duration-200
                ${hover === 'dashboard' && 'translate-x-1'}`}
              onMouseEnter={() => setHover('dashboard')}
              onMouseLeave={() => setHover('')}
            >
              {getIcon('dashboard')}
              {isExpanded && <span className="mr-3 font-medium">דף הבית</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                ${activeTab === 'profile' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                  : 'text-gray-600 hover:bg-gray-50'} 
                transition-all duration-200
                ${hover === 'profile' && 'translate-x-1'}`}
              onMouseEnter={() => setHover('profile')}
              onMouseLeave={() => setHover('')}
            >
              {getIcon('profile')}
              {isExpanded && <span className="mr-3 font-medium">פרופיל</span>}
            </Link>
          </li>
          {role === 'admin' && departmentId != null && (
            <li>
              <Link
                to={`/user-management/users/${departmentId}`}
                className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                  ${activeTab === 'user-management' 
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                    : 'text-gray-600 hover:bg-gray-50'} 
                  transition-all duration-200
                  ${hover === 'user-management' && 'translate-x-1'}`}
                onMouseEnter={() => setHover('user-management')}
                onMouseLeave={() => setHover('')}
              >
                {getIcon('user-management')}
                {isExpanded && <span className="mr-3 font-medium">ניהול משתמשים</span>}
              </Link>
            </li>
          )}
          {role === 'student' && (
            <>
              <li>
                <Link 
                  to="/my-requests" 
                  className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                    ${activeTab === 'my-requests' 
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'} 
                    transition-all duration-200
                    ${hover === 'my-requests' && 'translate-x-1'}`}
                  onMouseEnter={() => setHover('my-requests')}
                  onMouseLeave={() => setHover('')}
                >
                  {getIcon('my-requests')}
                  {isExpanded && <span className="mr-3 font-medium">הבקשות שלי</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/request" 
                  className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                    ${activeTab === 'request' 
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'} 
                    transition-all duration-200
                    ${hover === 'request' && 'translate-x-1'}`}
                  onMouseEnter={() => setHover('request')}
                  onMouseLeave={() => setHover('')}
                >
                  {getIcon('request')}
                  {isExpanded && <span className="mr-3 font-medium">הגש בקשה</span>}
                </Link>
              </li>
            </>
          )}
          {['lecturer', 'admin'].includes(role) && (
            <li>
              <Link 
                to="/manage-requests" 
                className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                  ${activeTab === 'manage-requests' 
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                    : 'text-gray-600 hover:bg-gray-50'} 
                  transition-all duration-200
                  ${hover === 'manage-requests' && 'translate-x-1'}`}
                onMouseEnter={() => setHover('manage-requests')}
                onMouseLeave={() => setHover('')}
              >
                {getIcon('manage-requests')}
                {isExpanded && <span className="mr-3 font-medium">ניהול בקשות</span>}
              </Link>
            </li>
          )}
        </ul>

        {/* קישורי משוב */}
        <div className="mt-4">
          {/* קישור משוב - רק לסטודנטים ומרצים */}
          {['student', 'lecturer'].includes(role) && (
            <Link 
              to="/feedback" 
              className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
                ${activeTab === 'feedback' 
                  ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500' 
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'} 
                transition-all duration-200
                ${hover === 'feedback' && 'translate-x-1'}`}
              onMouseEnter={() => setHover('feedback')}
              onMouseLeave={() => setHover('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-4.5h-2V6h2v5z" />
              </svg>
              {isExpanded && <span className="mr-3 font-medium">משוב</span>}
            </Link>
          )}
          
          {/* ניהול משובים - רק למזכירה */}
          {role === 'admin' && (
            <Link 
              to="/feedback-management" 
              className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl ${['student', 'lecturer'].includes(role) ? 'mt-2' : ''}
                ${activeTab === 'feedback-management' 
                  ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-500' 
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'} 
                transition-all duration-200
                ${hover === 'feedback-management' && 'translate-x-1'}`}
              onMouseEnter={() => setHover('feedback-management')}
              onMouseLeave={() => setHover('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 12h2v5H7v-5zm4-6h2v11h-2V6zm4 3h2v8h-2V9z" />
              </svg>
              {isExpanded && <span className="mr-3 font-medium">ניהול משובים</span>}
            </Link>
          )}
        </div>



        {/* Divider before logout */}
        <div className={`my-6 border-t border-gray-100 ${!isExpanded && 'mx-2'}`}></div>
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 rounded-xl 
            text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:shadow-sm
            transition-all duration-200 border border-gray-100
            ${hover === 'logout' && 'translate-x-1'} mx-auto ${isExpanded ? 'w-full' : 'w-12 h-12'}`}
          onMouseEnter={() => setHover('logout')}
          onMouseLeave={() => setHover('')}
        >
          {getIcon('logout')}
          {isExpanded && <span className="mr-3 font-medium">התנתק</span>}
        </button>
      </div>
      
      {/* Subtle decorative bottom corner */}
      <div className="absolute bottom-0 left-0 h-24 w-24 bg-gray-50 rounded-tr-full opacity-70"></div>
      <div className="absolute bottom-0 left-0 h-16 w-16 bg-blue-50 rounded-tr-full opacity-70"></div>
    </aside>
  );
}

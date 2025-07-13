import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './LoginForm';
import Register from './RegisterForm';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

import Dashboard from './Dashboard';
import Profile from './Profile';
import Feedback from './Feedback';
import FeedbackManagement from './FeedbackManagement';

import RequestPage from './RequestForms/RequestPage';
import AppealForm from './RequestForms/AppealForm';
import ExemptionForm from './RequestForms/ExemptionForm';
import MilitaryForm from './RequestForms/MilitaryForm';
import OtherForm from './RequestForms/OtherForm';
import MyRequests from './RequestForms/MyRequests';

import ManageRequests from './ManageReq/ManageRequests';

import UserManagementPage from './UserManagement/UserManagementPage';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* עמודי התחברות והרשמה */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />

        {/* עמודים עם סרגל צד */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/feedback-management" element={<FeedbackManagement />} />

          {/* ניהול משתמשים - רק למזכירה */}
          <Route
            path="/user-management/users/:departmentId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          {/* דף בחירת סוג בקשה */}
          <Route
            path="/request"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <RequestPage />
              </ProtectedRoute>
            }
          />

          {/* טפסי בקשות לפי סוג */}
          <Route
            path="/request/appeal"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AppealForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request/exemption"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExemptionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request/military"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MilitaryForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request/other"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OtherForm />
              </ProtectedRoute>
            }
          />

          {/* דף הבקשות שלי */}
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyRequests />
              </ProtectedRoute>
            }
          />

        <Route
          path="/manage-requests"
          element={
            <ProtectedRoute allowedRoles={['admin', 'lecturer']}>
              <ManageRequests />
            </ProtectedRoute>
          }
        />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;

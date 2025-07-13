import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowValidation(true);
    setMessage('');

    if (!email) return;

    try {
      const res = await fetch('http://localhost:8000/User/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || '📧 קישור לאיפוס נשלח למייל');
        setShowModal(true);
      } else {
        setMessage(data.error || '❌ שגיאה בשליחת בקשה');
      }
    } catch (error) {
      setMessage('❌ שגיאה בשרת');
    }
  };

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
        }

        /* keyframes לניעור הלוגו */
        @keyframes shake {
          0%, 100% { transform: translateX(50%) rotate(0deg); }
          25%, 75% { transform: translateX(50%) rotate(-5deg); }
          50%      { transform: translateX(50%) rotate(2deg); }
        }

        /* קובע את סגנון הלוגו ואנימציית hover */
        .login-logo {
          position: absolute;
          top: 0;
          right: 50%;
          transform: translateX(50%) rotate(0deg);
          width: 16rem;
          height: 16rem;
          cursor: pointer;
          z-index: 10;
        }
        .login-logo:hover {
          animation: shake 0.5s ease-in-out;
        }

        /* אנימציית fadeIn לאלמנטים */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* אנימציית מעבר לכפתורים */
        .btn-transition {
          transition: all 0.3s ease;
        }

        .btn-transition:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 100, 0.2);
        }

        /* אפקט צללית למעבר מעל שדות */
        .input-focus-effect {
          transition: all 0.3s ease;
        }

        .input-focus-effect:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          border-color: #3B82F6;
        }

        /* אפקט גלישה לטופס */
        .form-container {
          animation: fadeIn 0.6s ease-out;
        }

        /* עיצוב משופר לשגיאות */
        .error-message {
          animation: fadeIn 0.3s ease-out;
          background-color: #FEE2E2;
          border-right: 4px solid #EF4444;
          padding: 10px 15px;
          border-radius: 8px;
        }

        /* עיצוב למודל הצלחה */
        .success-modal {
          animation: fadeIn 0.4s ease-out;
        }

        .success-modal-content {
          background: linear-gradient(135deg, #EFF6FF, #FFFFFF);
          border-top: 5px solid #3B82F6;
        }

        /* לחצן מעוצב עם גרדיאנט */
        .gradient-btn {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          transition: all 0.3s ease;
        }

        .gradient-btn:hover {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
        }
      `}</style>

      <section dir="rtl" className="relative min-h-screen flex">
        <img
          src="/logo.png"
          alt="Logo"
          className="login-logo"
        />

        <div
          className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6"
          style={{
            backgroundImage: `url('https://img.freepik.com/premium-photo/watercolor-paper-background-white-paper-texture-close-up_64749-4189.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="success-modal bg-white rounded-xl p-8 shadow-xl max-w-sm w-full success-modal-content">
                <div className="text-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-800 mb-2 text-center">
                  המייל נשלח בהצלחה! 🎉
                </h2>
                <p className="mb-6 text-gray-600 text-center">קישור לאיפוס סיסמה נשלח לכתובת האימייל שלך</p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 gradient-btn text-white rounded-lg font-bold btn-transition"
                >
                  חזרה להתחברות
                </button>
              </div>
            </div>
          )}

          <div className="form-container w-full max-w-md">
            <h2 className="text-3xl font-thaoma text-blue-800 mb-8 text-center">
              <span className="inline-block">שחזור</span> <span className="inline-block">סיסמה</span>
            </h2>

            <form
              onSubmit={handleSubmit}
              className="w-full bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-4 text-right"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 150, 0.1)',
                borderTop: '5px solid #3B82F6'
              }}
            >
              <div>
                <label className="block mb-1 text-sm font-bold text-blue-900">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="הזן את האימייל שלך"
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
                />
                {showValidation && !email && (
                  <p className="text-red-500 text-xs mt-1">אנא הזן כתובת אימייל</p>
                )}
              </div>

              <p className="text-gray-600 text-sm mt-2">
                נשלח לך קישור באימייל שיאפשר לך ליצור סיסמה חדשה
              </p>

              <button
                type="submit"
                className="
                  w-full py-3 mt-2 gradient-btn
                  text-white font-bold rounded-lg text-base btn-transition
                "
              >
                שלח קישור לאיפוס
              </button>

              {message && !showModal && (
                <div className="error-message py-1 px-2">
                  <p className="text-center text-red-600 font-medium text-sm">
                    {message}
                  </p>
                </div>
              )}

              <div className="relative my-2">
                <hr className="border-gray-300" />
                <span className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white px-4 text-gray-500 text-xs">
                  או
                </span>
              </div>

              <button
                type="button"
                className="
                  w-full py-2 bg-white border-2 border-blue-600
                  text-blue-600 font-bold rounded-lg text-sm
                  hover:bg-blue-50 transition btn-transition
                "
                onClick={() => navigate('/')}
              >
                חזרה להתחברות
              </button>
            </form>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2">
          <img
            src="/campus.png"
            alt="Campus illustration"
            className="object-cover w-full h-full"
          />
        </div>
      </section>
    </>
  );
}
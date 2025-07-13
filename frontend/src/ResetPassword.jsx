import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { userId, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [matchError, setMatchError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const hasUpper = str => /[A-Z]/.test(str);
  const hasLower = str => /[a-z]/.test(str);

  const isValidPassword = password.length >= 6 && hasUpper(password) && hasLower(password);

  useEffect(() => {
    if (confirm && password !== confirm) {
      setMatchError('הסיסמאות אינן תואמות');
    } else {
      setMatchError('');
    }
  }, [confirm, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!isValidPassword || matchError) return;

    try {
      const res = await fetch(`http://localhost:8000/User/reset-password/${userId}/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ הסיסמה אופסה בהצלחה! מעביר לדף התחברות...');
        setShowModal(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage(data.error || '❌ שגיאה באיפוס');
      }
    } catch {
      setMessage('❌ שגיאת שרת');
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

        /* עיצוב לדרישות סיסמה */
        .password-requirements li {
          transition: all 0.3s ease;
        }
      `}</style>

      <section dir="rtl" className="relative min-h-screen flex">
        {/* --- הלוגו המוגדל עם אנימציה --- */}
        <img
          src="/logo.png"
          alt="Logo"
          className="login-logo"
        />

        {/* --- צד הטופס (ימין) עם רקע משופר --- */}
        <div
          className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6"
          style={{
            backgroundImage: `url('https://img.freepik.com/premium-photo/watercolor-paper-background-white-paper-texture-close-up_64749-4189.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* --- מודל הצלחה משופר --- */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="success-modal bg-white rounded-xl p-8 shadow-xl max-w-sm w-full success-modal-content">
                <div className="text-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-800 mb-2 text-center">
                  הסיסמה אופסה בהצלחה! 🎉
                </h2>
                <p className="mb-6 text-gray-600 text-center">אתה מועבר כעת לדף ההתחברות...</p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 gradient-btn text-white rounded-lg font-bold btn-transition"
                >
                  עבור עכשיו
                </button>
              </div>
            </div>
          )}

          <div className="form-container w-full max-w-md">
            <h2 className="text-3xl font-thaoma text-blue-800 mb-8 text-center">
              <span className="inline-block">יצירת</span> <span className="inline-block">סיסמה חדשה</span>
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
                  סיסמה חדשה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה חדשה"
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
                />
                <div className="mt-2">
                  <h3 className="text-xs font-medium text-blue-800 mb-1">הסיסמה חייבת לכלול: </h3>
                  <ul className="text-xs space-y-0.5 password-requirements">
                    <li className="flex items-center">
                      <span className={`inline-block w-3 h-3 mr-1 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-600'}>לפחות 6 תווים </span>
                    </li>
                    <li className="flex items-center">
                      <span className={`inline-block w-3 h-3 mr-1 rounded-full ${hasUpper(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={hasUpper(password) ? 'text-green-600' : 'text-gray-600'}> אות גדולה באנגלית</span>
                    </li>
                    <li className="flex items-center">
                      <span className={`inline-block w-3 h-3 mr-1 rounded-full ${hasLower(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={hasLower(password) ? 'text-green-600' : 'text-gray-600'}> אות קטנה באנגלית</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-bold text-blue-900">
                  אימות סיסמה
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="הזן את הסיסמה שוב"
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
                />
                {matchError && <p className="text-red-500 text-xs mt-1">{matchError}</p>}
              </div>

              <button
                type="submit"
                className="
                  w-full py-3 mt-3 gradient-btn
                  text-white font-bold rounded-lg text-base btn-transition
                "
                disabled={!isValidPassword || matchError}
              >
                אפס סיסמה
              </button>

              {message && !showModal && (
                <div className="error-message py-1 px-2">
                  <p className="text-center text-red-600 font-medium text-sm">
                    {message}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* --- צד התמונה (שמאל) --- */}
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
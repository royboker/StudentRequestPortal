import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]); // לרשימת המחלקות

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    id_number: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    phone_number: ''
  });

  const [passwordError, setPasswordError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const hasUpper = str => /[A-Z]/.test(str);
  const hasLower = str => /[a-z]/.test(str);

  // טען את המחלקות מה־API
  useEffect(() => {
    fetch('http://localhost:8000/academics/departments/')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(() => setDepartments([]));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      let err = '';
      if (value.length < 6) err = 'הסיסמה חייבת להכיל לפחות 6 תווים';
      else if (!hasUpper(value)) err = 'יש לכלול לפחות אות גדולה';
      else if (!hasLower(value)) err = 'יש לכלול לפחות אות קטנה';
      setPasswordError(err);
    }

    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const pwd = name === 'password' ? value : formData.password;
      const conf = name === 'confirmPassword' ? value : formData.confirmPassword;
      setMatchError(pwd !== conf ? 'הסיסמאות אינן תואמות' : '');
    }
  };

  const validateForm = () => {
    const { first_name, last_name, email, id_number, password, confirmPassword, department, phone_number } = formData;
    if (!first_name || !last_name || !email || !id_number || !password || !confirmPassword || !department || !phone_number) {
      setErrorMessage('אנא מלא את כל השדות');
      return false;
    }
    if (password.length < 6 || !hasUpper(password) || !hasLower(password)) {
      setErrorMessage('הסיסמה חייבת לכלול לפחות 6 תווים, אות גדולה ואות קטנה');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('הסיסמאות אינן תואמות');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateForm()) return;

    const { confirmPassword, ...dataToSend } = formData;
    console.log('Sending registration data:', dataToSend);

    try {
      const res = await fetch('http://localhost:8000/User/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        console.error('Registration error:', data.error);
        setErrorMessage(data.error || 'שגיאה כללית בהרשמה');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage('שגיאת שרת');
    }
  };

  return (
    <>
      {/* --- כאן מאפסים מרג'ין גלובלי ומוסיפים אנימציות --- */}
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

        /* עיצוב לרשימת דרישות הסיסמה */
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
      {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="success-modal bg-white rounded-xl p-8 shadow-xl max-w-sm w-full success-modal-content">
                <div className="text-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-800 mb-2 text-center">
                  נרשמת בהצלחה! 🎉
                </h2>
                <p className="mb-6 text-gray-600 text-center">אתה מועבר כעת לדף ההתחברות...</p>
            <button
              onClick={() => navigate('/')}
                  className="w-full px-6 py-3 gradient-btn text-white rounded-lg font-bold btn-transition"
            >
              עבור להתחברות
            </button>
          </div>
        </div>
      )}

          <div className="form-container w-full max-w-md">
            <h2 className="text-3xl font-thaoma text-blue-800 mb-8 text-center">
              <span className="inline-block">הצטרף</span> <span className="inline-block">למשפחה שלנו</span> <span className="inline-block">!</span>
            </h2>

            <form
              onSubmit={handleSubmit}
              className="w-full bg-white bg-opacity-95 rounded-xl shadow-xl p-6 space-y-3 text-right"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 150, 0.1)',
                borderTop: '5px solid #3B82F6'
              }}
            >
              {/* שם פרטי */}
              <div>
                <label className="block mb-1 text-sm font-bold text-blue-900">
                  שם פרטי
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="הזן את שמך הפרטי"
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
                />
              </div>

              {/* שם משפחה */}
          <div>
                <label className="block mb-1 text-sm font-bold text-blue-900">
                  שם משפחה
                </label>
            <input
              type="text"
                  name="last_name"
                  value={formData.last_name}
              onChange={handleChange}
              required
                  placeholder="הזן את שם המשפחה שלך"
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
            />
          </div>

              <div className="grid grid-cols-2 gap-2">
          {/* אימייל */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    אימייל
                  </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
                    placeholder="האימייל שלך"
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            />
          </div>

          {/* ת.ז. */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    תעודת זהות
                  </label>
            <input
              type="text"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
                    placeholder="תעודת הזהות שלך"
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            />
                </div>
          </div>

              <div className="grid grid-cols-2 gap-2">
          {/* מחלקה */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    מחלקה
                  </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            >
              <option value="">– בחר מחלקה –</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* טלפון */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    טלפון
                  </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
                    placeholder="מספר הטלפון שלך"
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            />
                </div>
          </div>

              <div className="grid grid-cols-2 gap-2">
          {/* סיסמה */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    סיסמה
                  </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
                    placeholder="סיסמה חדשה"
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            />
                  <ul className="mt-1 text-xs space-y-0 password-requirements">
                    <li className={formData.password.length >= 6 ? 'text-green-600' : 'text-gray-600'}>✔ 6 תווים</li>
                    <li className={hasUpper(formData.password) ? 'text-green-600' : 'text-gray-600'}>✔ אות גדולה</li>
                    <li className={hasLower(formData.password) ? 'text-green-600' : 'text-gray-600'}>✔ אות קטנה</li>
            </ul>
                  {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
          </div>

          {/* אישור סיסמה */}
          <div>
                  <label className="block mb-1 text-sm font-bold text-blue-900">
                    אישור סיסמה
                  </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
                    placeholder="אימות סיסמה"
                    className="
                      w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                      focus:outline-none transition input-focus-effect
                      text-blue-900 font-medium
                    "
            />
                  {matchError && <p className="text-red-500 text-xs">{matchError}</p>}
                </div>
          </div>

          {/* תפקיד */}
          <div>
                <label className="block mb-1 text-sm font-bold text-blue-900">
                  סוג משתמש
                </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
                  className="
                    w-full px-3 py-2 border border-blue-300 rounded-lg bg-white
                    focus:outline-none transition input-focus-effect
                    text-blue-900 font-medium
                  "
            >
              <option value="student">סטודנט</option>
              <option value="lecturer">מרצה</option>
            </select>
          </div>

          <button
            type="submit"
                className="
                  w-full py-3 mt-2 gradient-btn
                  text-white font-bold rounded-lg text-base btn-transition
                "
          >
            הירשם
          </button>

              {errorMessage && (
                <div className="error-message py-1 px-2">
                  <p className="text-center text-red-600 font-medium text-sm">
                    {errorMessage}
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
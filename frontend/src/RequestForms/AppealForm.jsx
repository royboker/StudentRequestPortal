import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AppealForm() {
  const [formData, setFormData] = useState({
    course: '',
    term: '',
    grade: '',
    reason: '',
    lecturer: '',
    file: null,
  });

  const [courses, setCourses] = useState([]);
  const [selectedLecturers, setSelectedLecturers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`http://localhost:8000/academics/api/courses/?department=${currentUser.department}`);
        const data = await res.json();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        console.error('שגיאה בטעינת קורסים:', err);
        setError('שגיאה בטעינת קורסים');
        setLoading(false);
      }
    };

    if (currentUser.department) {
      fetchCourses();
    } else {
      setLoading(false);
      setError('לא נמצאו פרטי סטודנט');
    }
  }, [currentUser.department]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'file' && files && files[0]) {
      setFormData(prev => ({ ...prev, file: files[0] }));
      setFileName(files[0].name);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'course') {
      const selectedCourse = courses.find(c => c.name === value);
      setSelectedLecturers(selectedCourse?.lecturers || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { course, term, grade, reason, lecturer, file } = formData;

    if (!course || !term || !grade || !reason || !lecturer) {
      setError('נא למלא את כל השדות החובה');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = new FormData();
    payload.append('request_type', 'appeal');
    payload.append('subject', `ערעור על ציון - ${course}`);
    payload.append(
      'description',
      `קורס: ${course}\nמועד: ${term}\nציון: ${grade}\nנימוק: ${reason}`
    );
    payload.append('student', currentUser.id);
    payload.append('assigned_lecturer_id', lecturer);
    if (file) payload.append('attached_file', file);

    try {
      const res = await fetch('http://localhost:8000/api/requests/create/', {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/my-requests'), 2000);
      } else {
        console.error('❌ שגיאה מהשרת:', data);
        setError(data.error || 'שגיאה בשליחת הבקשה');
      }
    } catch (err) {
      setError('❌ שגיאת רשת - נסה שוב מאוחר יותר');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateBack = () => {
    navigate('/request');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">טוען טופס...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-l from-pink-500 to-red-500 rounded-2xl shadow-xl mb-8">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src="/campus.png" alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div className="relative p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">ערעור על ציון</h1>
          <p className="text-gray-900 text-lg font-semibold max-w-2xl">
            טופס זה מיועד להגשת ערעור על ציון. יש למלא את כל הפרטים הנדרשים כדי שהבקשה תיבחן בהקדם.
          </p>
          
          <button
            onClick={navigateBack}
            className="mt-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-lg inline-flex items-center transition-colors font-bold text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            חזרה לבחירת טופס
          </button>
        </div>
      </div>
      
      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>הבקשה נשלחה בהצלחה! מעביר לדף הבקשות...</span>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">בחר קורס</label>
              <select 
                name="course" 
                required 
                onChange={handleChange} 
                value={formData.course}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-right"
              >
          <option value="">בחר קורס</option>
          {courses.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">בחר מרצה</label>
              <select 
                name="lecturer" 
                required 
                onChange={handleChange}
                value={formData.lecturer}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-right"
                disabled={!formData.course || selectedLecturers.length === 0}
              >
            <option value="">בחר מרצה</option>
            {selectedLecturers.map(l => (
               <option key={l.id} value={l.id}>{`${l.first_name} ${l.last_name}`.trim() || 'שם לא זמין'}</option>
            ))}
          </select>
              {formData.course && selectedLecturers.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">אין מרצים מוגדרים לקורס זה</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מועד בחינה</label>
              <select 
                name="term" 
                required 
                onChange={handleChange}
                value={formData.term}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-right"
              >
                <option value="">בחר מועד</option>
                <option value="מועד א׳">מועד א׳</option>
                <option value="מועד ב׳">מועד ב׳</option>
                <option value="מועד ג׳">מועד ג׳</option>
                <option value="מועד מיוחד">מועד מיוחד</option>
        </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ציון שהתקבל</label>
        <input
          type="number"
          name="grade"
                min="0"
                max="100"
                placeholder="הכנס ציון (0-100)"
          required
                value={formData.grade}
          onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-right"
        />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">נימוק לערעור</label>
        <textarea
          name="reason"
              placeholder="נא לפרט את הסיבות לערעור"
          required
          rows={4}
              value={formData.reason}
          onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-right"
        ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">צירוף קובץ (לא חובה)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none">
                    <span>העלה קובץ</span>
        <input
                      id="file-upload" 
                      name="file" 
          type="file"
                      className="sr-only" 
          onChange={handleChange}
                    />
                  </label>
                  <p className="pr-1">או גרור ושחרר</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF עד 10MB
                </p>
                {fileName && (
                  <p className="text-sm text-gray-800 font-medium mt-2 border border-gray-200 rounded p-2">
                    {fileName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || success}
              className={`px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-lg shadow-md hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 ${
                (isSubmitting || success) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  שולח...
                </span>
              ) : (
                'שלח בקשה'
              )}
        </button>
          </div>
      </form>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { loading, error } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [academicId, setAcademicId] = useState(''); // الجديد
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = t('auth.nameRequired');
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = t('auth.emailInvalid');
    }
    if (!academicId.trim()) {
      errors.academicId = t('auth.academicIdRequired');
    }
    if (password.length < 8) {
      errors.password = t('auth.passwordRequirements');
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.passwordsMustMatch');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (validateForm()) {
      try {
        const res = await fetch('/api/register/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, academic_id: academicId, password, role }),
        });

        if (!res.ok) {
          const data = await res.json();
          setServerError(data.error || 'Registration failed');
        } else {
          // تسجيل ناجح: ممكن تعيد التوجيه للصفحة الأخرى أو عرض رسالة نجاح
          alert(t('auth.registrationSuccess'));
        }
      } catch (err) {
        setServerError(t('auth.networkError'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Layers className="mx-auto h-12 w-auto text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('auth.signup')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('general.slogan')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* الاسم */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('auth.fullName')}
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.name ? 'border-error-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-error-600">{formErrors.name}</p>
                )}
              </div>
            </div>

            {/* الايميل */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.email ? 'border-error-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-error-600">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* الأكاديمي ID */}
            <div>
              <label htmlFor="academicId" className="block text-sm font-medium text-gray-700">
                {t('auth.academicId')}
              </label>
              <div className="mt-1">
                <input
                  id="academicId"
                  name="academicId"
                  type="text"
                  required
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.academicId ? 'border-error-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {formErrors.academicId && (
                  <p className="mt-1 text-sm text-error-600">{formErrors.academicId}</p>
                )}
              </div>
            </div>

            {/* الباسورد */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.password ? 'border-error-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-error-600">{formErrors.password}</p>
                )}
              </div>
            </div>

            {/* تأكيد الباسورد */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPassword')}
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formErrors.confirmPassword ? 'border-error-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* اختيار الدور */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {t('auth.selectRole')}
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* خطأ من السيرفر */}
            {serverError && (
              <div className="rounded-md bg-error-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-error-800">{serverError}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('auth.signup')
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('auth.alreadyHaveAccount')}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

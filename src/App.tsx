import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

// Page components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import NotFound from './pages/NotFound';
import CourseView from './pages/courses/CourseView';
import CourseCreate from './pages/courses/CourseCreate';
import AssignmentView from './pages/assignments/AssignmentView';
import SubscriptionPlans from './pages/subscriptions/SubscriptionPlans';
import SubscriptionCheckout from './pages/subscriptions/SubscriptionCheckout';
import Settings from './pages/settings/Settings';
import LandingPage from './pages/LandingPage';
import CenterPage from './pages/CenterPage'; // ✅ إضافة صفحة السنتر الجديدة

// 🔐 Auth Guards
const PrivateRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
  }

  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
  }

  return children;
};

// 🔹 دالة جديدة بدل getSubdomain
function getCenterFromPath() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[1] || null; // أول جزء بعد "/"
}

function App() {
  const { i18n } = useTranslation();
  const { initialize } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 🔸 Initialize auth state
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 🔸 Update document title
  useEffect(() => {
    document.title = 'Trainify - AI-Powered Learning Platform';
  }, [location]);

  // 🔸 Handle language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // 🔸 Fetch center data based on URL path
  useEffect(() => {
    const centerSlug = getCenterFromPath();
    if (!centerSlug) {
      setCenter(null);
      return;
    }

    async function fetchCenter() {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('slug', centerSlug)
        .maybeSingle();

      if (error) {
        console.error('Supabase Error:', error.message);
        setErrorMsg('حدث خطأ أثناء تحميل بيانات السنتر.');
      } else if (!data) {
        setErrorMsg('السنتر غير موجود.');
        navigate('/404');
      } else {
        setCenter(data);
      }

      setLoading(false);
    }

    fetchCenter();
  }, [location.pathname, navigate]);

  // 🔸 Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-500 mb-4"></div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading center...</p>
        </div>
      </div>
    );
  }

  // 🔸 Error State
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {center && (
        <header className="text-center py-4 bg-blue-50 border-b border-blue-200 shadow-sm">
          <h1 className="text-2xl font-semibold text-blue-700">Welcome to {center.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{center.address || 'Your learning center'}</p>
        </header>
      )}

      <main className="min-h-screen bg-gray-50">
        <Routes>
          {/* ✅ المسارات الأساسية */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/center/:centerSlug" element={<CenterPage />} />

          {/* Auth Routes */}
          <Route
            path="/:centerSlug/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/:centerSlug/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Dashboards */}
          <Route
            path="/:centerSlug/dashboard/student"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/:centerSlug/dashboard/teacher"
            element={
              <PrivateRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/:centerSlug/dashboard/parent"
            element={
              <PrivateRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/:centerSlug/dashboard/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Courses */}
          <Route
            path="/:centerSlug/courses/:courseId"
            element={
              <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
                <CourseView />
              </PrivateRoute>
            }
          />
          <Route
            path="/:centerSlug/courses/create"
            element={
              <PrivateRoute allowedRoles={['teacher', 'admin']}>
                <CourseCreate />
              </PrivateRoute>
            }
          />

          {/* Assignments */}
          <Route
            path="/:centerSlug/assignments/:assignmentId"
            element={
              <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
                <AssignmentView />
              </PrivateRoute>
            }
          />

          {/* Subscriptions */}
          <Route
            path="/:centerSlug/subscriptions"
            element={
              <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
                <SubscriptionPlans />
              </PrivateRoute>
            }
          />
          <Route
            path="/:centerSlug/subscriptions/checkout"
            element={
              <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
                <SubscriptionCheckout />
              </PrivateRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/:centerSlug/settings"
            element={
              <PrivateRoute allowedRoles={[]}>
                <Settings />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { getSubdomain } from './lib/getSubdomain';

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

function App() {
  const { i18n } = useTranslation();
  const { initialize } = useAuthStore();
  const location = useLocation();
  const [center, setCenter] = useState<any>(null);

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

  // 🔸 Fetch center data based on subdomain
  useEffect(() => {
    const subdomain = getSubdomain();
    if (!subdomain) return;

    async function fetchCenter() {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('subdomain', subdomain)
        .maybeSingle(); // ✅ بدل single() لتجنب الخطأ PGRST116

      if (error) {
        console.error('Supabase Error:', error.message);
      } else {
        setCenter(data);
      }
    }

    fetchCenter();
  }, []);

  // 🔸 Loading State
  if (getSubdomain() && !center) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-500 mb-4"></div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {center && <h1 className="text-center text-2xl font-semibold mt-6">Welcome to {center.name}</h1>}
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Dashboards */}
        <Route
          path="/dashboard/student"
          element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <PrivateRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/parent"
          element={
            <PrivateRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Courses */}
        <Route
          path="/courses/:courseId"
          element={
            <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
              <CourseView />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses/create"
          element={
            <PrivateRoute allowedRoles={['teacher', 'admin']}>
              <CourseCreate />
            </PrivateRoute>
          }
        />

        {/* Assignments */}
        <Route
          path="/assignments/:assignmentId"
          element={
            <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
              <AssignmentView />
            </PrivateRoute>
          }
        />

        {/* Subscriptions */}
        <Route
          path="/subscriptions"
          element={
            <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
              <SubscriptionPlans />
            </PrivateRoute>
          }
        />
        <Route
          path="/subscriptions/checkout"
          element={
            <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
              <SubscriptionCheckout />
            </PrivateRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRoles={[]}>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

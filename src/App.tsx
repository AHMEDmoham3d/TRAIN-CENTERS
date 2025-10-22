// import { useEffect, useState } from 'react';
// import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { useAuthStore } from './store/authStore';
// import { supabase } from './lib/supabase';

// // ✅ صفحات المشروع
// import Login from './pages/auth/Login';
// import Register from './pages/auth/Register';
// import StudentDashboard from './pages/dashboards/StudentDashboard';
// import TeacherDashboard from './pages/dashboards/TeacherDashboard';
// import ParentDashboard from './pages/dashboards/ParentDashboard';
// import AdminDashboard from './pages/dashboards/AdminDashboard';
// import NotFound from './pages/NotFound';
// import CourseView from './pages/courses/CourseView';
// import CourseCreate from './pages/courses/CourseCreate';
// import AssignmentView from './pages/assignments/AssignmentView';
// import SubscriptionPlans from './pages/subscriptions/SubscriptionPlans';
// import SubscriptionCheckout from './pages/subscriptions/SubscriptionCheckout';
// import Settings from './pages/settings/Settings';
// import LandingPage from './pages/LandingPage';
// import CenterPage from './pages/CenterPage';

// // 🔐 Auth Guards
// const PrivateRoute = ({
//   children,
//   allowedRoles,
// }: {
//   children: JSX.Element;
//   allowedRoles: string[];
// }) => {
//   const { isAuthenticated, user } = useAuthStore();
//   const location = useLocation();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
//     return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
//   }

//   return children;
// };

// const PublicRoute = ({ children }: { children: JSX.Element }) => {
//   const { isAuthenticated, user } = useAuthStore();

//   if (isAuthenticated && user) {
//     return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
//   }

//   return children;
// };

// // 🔹 استخراج اسم السنتر من المسار (path)
// function getCenterFromPath(): string | null {
//   const parts = window.location.pathname.split('/').filter(Boolean);
//   if (parts.length === 0) return null;
//   return parts[0]?.trim().toLowerCase() || null;
// }

// function App() {
//   const { i18n } = useTranslation();
//   const { initialize } = useAuthStore();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [center, setCenter] = useState<any>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [errorMsg, setErrorMsg] = useState<string>('');

//   // 🔸 تهيئة حالة تسجيل الدخول
//   useEffect(() => {
//     initialize();
//   }, [initialize]);

//   // 🔸 تحديث عنوان الصفحة
//   useEffect(() => {
//     document.title = 'Trainify - AI-Powered Learning Platform';
//   }, [location]);

//   // 🔸 ضبط اتجاه اللغة
//   useEffect(() => {
//     document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
//   }, [i18n.language]);

//   // 🔸 تحميل بيانات السنتر حسب المسار (وليس الساب دومين)
//   useEffect(() => {
//     const pathSlug = getCenterFromPath();

//     // لو المستخدم على الصفحة الرئيسية أو مسارات عامة
//     if (!pathSlug || ['login', 'register', '404'].includes(pathSlug)) {
//       setCenter(null);
//       return;
//     }

//     async function fetchCenter(centerSlug: string) {
//       setLoading(true);
//       setErrorMsg('');

//       console.log('🔍 Fetching center using path:', centerSlug);

//       const { data, error } = await supabase
//         .from('centers')
//         .select('*')
//         .eq('subdomain', centerSlug)
//         .maybeSingle();

//       if (error) {
//         console.error('❌ Supabase Error:', error.message);
//         setErrorMsg('حدث خطأ أثناء تحميل بيانات السنتر.');
//       } else if (!data) {
//         console.warn('⚠️ Center not found for:', centerSlug);
//         setErrorMsg('السنتر غير موجود.');
//       } else {
//         console.log('✅ Center loaded successfully:', data);
//         setCenter(data);
//       }

//       setLoading(false);
//     }

//     if (pathSlug) {
//       fetchCenter(pathSlug);
//     }
//   }, [location.pathname]);

//   // 🔸 حالة التحميل
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="animate-pulse flex flex-col items-center">
//           <div className="w-12 h-12 rounded-full bg-blue-500 mb-4"></div>
//           <div className="h-4 w-24 bg-gray-300 rounded"></div>
//           <p className="mt-2 text-gray-600 text-sm">Loading center...</p>
//         </div>
//       </div>
//     );
//   }

//   // 🔸 حالة الخطأ
//   if (errorMsg) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
//           <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
//           <p className="text-gray-600">{errorMsg}</p>
//           <button
//             onClick={() => navigate('/')}
//             className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
//           >
//             العودة للصفحة الرئيسية
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // 🔸 عرض الواجهة
//   return (
//     <>
//       {center && (
//         <header className="text-center py-4 bg-blue-50 border-b border-blue-200 shadow-sm">
//           <h1 className="text-2xl font-semibold text-blue-700">
//             Welcome to {center.name}
//           </h1>
//           <p className="text-gray-500 text-sm mt-1">
//             {center.address || 'Your learning center'}
//           </p>
//         </header>
//       )}

//       <main className="min-h-screen bg-gray-50">
//         <Routes>
//           {/* ✅ المسارات العامة */}
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/center/:centerSlug" element={<CenterPage />} />

//           {/* Auth Routes */}
//           <Route
//             path="/:centerSlug/login"
//             element={
//               <PublicRoute>
//                 <Login />
//               </PublicRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/register"
//             element={
//               <PublicRoute>
//                 <Register />
//               </PublicRoute>
//             }
//           />

//           {/* Dashboards */}
//           <Route
//             path="/:centerSlug/dashboard/student"
//             element={
//               <PrivateRoute allowedRoles={['student']}>
//                 <StudentDashboard />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/dashboard/teacher"
//             element={
//               <PrivateRoute allowedRoles={['teacher']}>
//                 <TeacherDashboard />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/dashboard/parent"
//             element={
//               <PrivateRoute allowedRoles={['parent']}>
//                 <ParentDashboard />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/dashboard/admin"
//             element={
//               <PrivateRoute allowedRoles={['admin']}>
//                 <AdminDashboard />
//               </PrivateRoute>
//             }
//           />

//           {/* Courses */}
//           <Route
//             path="/:centerSlug/courses/:courseId"
//             element={
//               <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
//                 <CourseView />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/courses/create"
//             element={
//               <PrivateRoute allowedRoles={['teacher', 'admin']}>
//                 <CourseCreate />
//               </PrivateRoute>
//             }
//           />

//           {/* Assignments */}
//           <Route
//             path="/:centerSlug/assignments/:assignmentId"
//             element={
//               <PrivateRoute allowedRoles={['student', 'teacher', 'parent', 'admin']}>
//                 <AssignmentView />
//               </PrivateRoute>
//             }
//           />

//           {/* Subscriptions */}
//           <Route
//             path="/:centerSlug/subscriptions"
//             element={
//               <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
//                 <SubscriptionPlans />
//               </PrivateRoute>
//             }
//           />
//           <Route
//             path="/:centerSlug/subscriptions/checkout"
//             element={
//               <PrivateRoute allowedRoles={['student', 'parent', 'admin']}>
//                 <SubscriptionCheckout />
//               </PrivateRoute>
//             }
//           />

//           {/* Settings */}
//           <Route
//             path="/:centerSlug/settings"
//             element={
//               <PrivateRoute allowedRoles={[]}>
//                 <Settings />
//               </PrivateRoute>
//             }
//           />

//           {/* 404 */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </main>
//     </>
//   );
// }
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "./store/authStore";
import { supabase } from "./lib/supabase";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import ParentDashboard from "./pages/dashboards/ParentDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import NotFound from "./pages/NotFound";
import CourseView from "./pages/courses/CourseView";
import CourseCreate from "./pages/courses/CourseCreate";
import AssignmentView from "./pages/assignments/AssignmentView";
import SubscriptionPlans from "./pages/subscriptions/SubscriptionPlans";
import SubscriptionCheckout from "./pages/subscriptions/SubscriptionCheckout";
import Settings from "./pages/settings/Settings";
import LandingPage from "./pages/LandingPage";

// 🔐 Private Route (requires login)
const PrivateRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const parts = location.pathname.split("/");
    const centerSlug = parts[1] || "";
    return <Navigate to={`/${centerSlug}/login`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={`/${user.center_subdomain}/dashboard/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  return children;
};

// 🔓 Public Route (guests only)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={`/${user.center_subdomain}/dashboard/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  return children;
};

// ✅ This component just saves the slug in localStorage then shows landing
function CenterLanding() {
  const { centerSlug } = useParams<{ centerSlug?: string }>();

  useEffect(() => {
    if (centerSlug) {
      localStorage.setItem("center_subdomain", centerSlug.trim());
    }
  }, [centerSlug]);

  // 👇 Show the same landing page of the main site
  return <LandingPage />;
}

// ✅ Center Detector Component - checks if center exists and shows login button
function CenterDetector() {
  const { centerSlug } = useParams<{ centerSlug?: string }>();
  const navigate = useNavigate();
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkCenter = async () => {
      if (!centerSlug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('centers')
          .select('*')
          .ilike('subdomain', centerSlug)
          .maybeSingle();

        if (error || !data) {
          setError("Center not found");
        } else {
          setCenter(data);
          localStorage.setItem("center_subdomain", centerSlug.trim());
        }
      } catch (err) {
        setError("Error loading center");
      } finally {
        setLoading(false);
      }
    };

    checkCenter();
  }, [centerSlug]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!center) {
    return <LandingPage />;
  }

  // Show center-specific landing page with login button
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-center py-4 bg-blue-50 border-b border-blue-200 shadow-sm">
        <h1 className="text-2xl font-semibold text-blue-700">
          Welcome to {center.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {center.address || 'Your learning center'}
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your Learning Journey
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Access your personalized dashboard and continue learning with {center.name}
            </p>
            <button
              onClick={() => navigate(`/${centerSlug}/login`)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In to Your Account
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Courses</h3>
              <p className="text-gray-600">Access your enrolled courses and materials</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Assignments</h3>
              <p className="text-gray-600">Complete and submit your assignments</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress</h3>
              <p className="text-gray-600">Track your learning progress and achievements</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to continue your learning journey?
            </p>
            <button
              onClick={() => navigate(`/${centerSlug}/login`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();
  const { initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.title = "EduTech - AI Learning Platform";
  }, [location]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Routes>
        {/* Redirect default login/register to gammal */}
        <Route path="/login" element={<Navigate to="/gammal/login" replace />} />
        <Route path="/register" element={<Navigate to="/gammal/register" replace />} />

        {/* ✅ Landing Page for each center (like /gammal/) */}
        <Route path="/:centerSlug" element={<CenterDetector />} />

        {/* ✅ Auth routes */}
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

        {/* ✅ Dashboards */}
        <Route
          path="/:centerSlug/dashboard/student"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/:centerSlug/dashboard/teacher"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/:centerSlug/dashboard/parent"
          element={
            <PrivateRoute allowedRoles={["parent"]}>
              <ParentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/:centerSlug/dashboard/admin"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* ✅ Courses */}
        <Route
          path="/:centerSlug/courses/:courseId"
          element={
            <PrivateRoute allowedRoles={["student", "teacher", "parent", "admin"]}>
              <CourseView />
            </PrivateRoute>
          }
        />
        <Route
          path="/:centerSlug/courses/create"
          element={
            <PrivateRoute allowedRoles={["teacher", "admin"]}>
              <CourseCreate />
            </PrivateRoute>
          }
        />

        {/* ✅ Assignments */}
        <Route
          path="/:centerSlug/assignments/:assignmentId"
          element={
            <PrivateRoute allowedRoles={["student", "teacher", "parent", "admin"]}>
              <AssignmentView />
            </PrivateRoute>
          }
        />

        {/* ✅ Subscriptions */}
        <Route
          path="/:centerSlug/subscriptions"
          element={
            <PrivateRoute allowedRoles={["student", "parent", "admin"]}>
              <SubscriptionPlans />
            </PrivateRoute>
          }
        />
        <Route
          path="/:centerSlug/subscriptions/checkout"
          element={
            <PrivateRoute allowedRoles={["student", "parent", "admin"]}>
              <SubscriptionCheckout />
            </PrivateRoute>
          }
        />

        {/* ✅ Settings */}
        <Route
          path="/:centerSlug/settings"
          element={
            <PrivateRoute allowedRoles={[]}>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* ✅ Main site landing + 404 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default App;

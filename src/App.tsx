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
import { useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "./store/authStore";
import { supabase } from "./lib/supabase";

// ✅ Pages
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
import CenterPage from "./pages/CenterPage";

// 🔐 Protected Route
const PrivateRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const pathParts = location.pathname.split("/");
    const centerSlug = pathParts[1] || "";
    return (
      <Navigate
        to={`/${centerSlug ? `${centerSlug}/login` : "login"}`}
        replace
      />
    );
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={`/${user.center_subdomain || ""}/dashboard/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  return children;
};

// 🔓 Public Route
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={`/${user.center_subdomain || ""}/dashboard/${user.role.toLowerCase()}`}
        replace
      />
    );
  }

  return children;
};

// ✅ Detect Center Slug
function CenterDetector() {
  const { centerSlug } = useParams<{ centerSlug?: string }>();

  useEffect(() => {
    if (centerSlug) {
      localStorage.setItem("center_subdomain", centerSlug.trim());
    } else {
      localStorage.removeItem("center_subdomain");
    }
  }, [centerSlug]);

  return <CenterPage />;
}

function App() {
  const { i18n } = useTranslation();
  const { initialize } = useAuthStore();
  const location = useLocation();

  // ✅ Initialize auth store once
  useEffect(() => {
    initialize();
  }, [initialize]);

  // ✅ Update title
  useEffect(() => {
    document.title = "EduTech - AI Learning Platform";
  }, [location]);

  // ✅ Set language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Routes>
        {/* ✅ Redirect root login/register */}
        <Route path="/login" element={<Navigate to="/gammal/login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/gammal/register" replace />}
        />

        {/* ✅ Public routes */}
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

        {/* ✅ Center landing */}
        <Route path="/:centerSlug" element={<CenterDetector />} />

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

        {/* ✅ Default landing + 404 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default App;

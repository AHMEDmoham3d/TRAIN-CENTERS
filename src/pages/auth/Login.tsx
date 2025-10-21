// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { Layers, ArrowRight, Loader2 } from 'lucide-react';
// import { useAuthStore } from '../../store/authStore';
// import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

// const Login: React.FC = () => {
//   const { t } = useTranslation();
//   const { login, loading, error } = useAuthStore();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [rememberMe, setRememberMe] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await login(email, password);
//   };

//   // For demo purposes - login shortcuts
//   const demoUsers = [
//     { role: 'student', email: 'student@example.com', password: 'password' },
//     { role: 'teacher', email: 'teacher@example.com', password: 'password' },
//     { role: 'parent', email: 'parent@example.com', password: 'password' },
//     { role: 'admin', email: 'admin@example.com', password: 'password' },
//   ];

//   const loginAsDemo = async (demoEmail: string, demoPassword: string) => {
//     setEmail(demoEmail);
//     setPassword(demoPassword);
//     await login(demoEmail, demoPassword);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
//       <div className="sm:mx-auto sm:w-full sm:max-w-md">
//         <div className="flex justify-center">
//           <Layers className="mx-auto h-12 w-auto text-primary-500" />
//         </div>
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//           {t('general.appName')}
//         </h2>
//         <p className="mt-2 text-center text-sm text-gray-600">
//           {t('general.slogan')}
//         </p>
//       </div>

//       <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
//         <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
//           <div className="flex justify-end mb-4">
//             <LanguageSwitcher />
//           </div>
          
//           <form className="space-y-6" onSubmit={handleSubmit}>
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                 {t('auth.email')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   autoComplete="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
//                 />
//               </div>
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                 {t('auth.password')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="password"
//                   name="password"
//                   type="password"
//                   autoComplete="current-password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="flex items-center">
//                 <input
//                   id="remember-me"
//                   name="remember-me"
//                   type="checkbox"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                   className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
//                 />
//                 <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
//                   {t('auth.rememberMe')}
//                 </label>
//               </div>

//               <div className="text-sm">
//                 <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
//                   {t('auth.forgotPassword')}
//                 </a>
//               </div>
//             </div>

//             {error && (
//               <div className="rounded-md bg-error-50 p-4">
//                 <div className="flex">
//                   <div className="ml-3">
//                     <h3 className="text-sm font-medium text-error-800">{error}</h3>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? (
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                 ) : (
//                   t('auth.login')
//                 )}
//               </button>
//             </div>
//           </form>

//           <div className="mt-6">
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-300" />
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-white text-gray-500">
//                   {t('auth.dontHaveAccount')}
//                 </span>
//               </div>
//             </div>

//             <div className="mt-6">
//               <Link
//                 to="/register"
//                 className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
//               >
//                 {t('auth.signup')}
//                 <ArrowRight className="ml-2 h-4 w-4" />
//               </Link>
//             </div>
//           </div>

//           {/* Demo login section */}
//           <div className="mt-8 border-t border-gray-200 pt-6">
//             <h3 className="text-sm font-medium text-gray-500 text-center mb-4">
//               Demo Logins (For Testing)
//             </h3>
//             <div className="grid grid-cols-2 gap-3">
//               {demoUsers.map((demoUser) => (
//                 <button
//                   key={demoUser.role}
//                   type="button"
//                   onClick={() => loginAsDemo(demoUser.email, demoUser.password)}
//                   className="inline-flex justify-center items-center px-2 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 capitalize"
//                 >
//                   {demoUser.role}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { centerSlug } = useParams(); // اسم السنتر من اللينك
  const [centerId, setCenterId] = useState(null);
  const [loadingCenter, setLoadingCenter] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ جلب center_id بناءً على centerSlug
  useEffect(() => {
    const fetchCenter = async () => {
      if (!centerSlug) {
        setLoadingCenter(false);
        return; // المستخدم داخل من اللينك الأساسي
      }

      const { data, error } = await supabase
        .from("centers")
        .select("id, name")
        .eq("subdomain", centerSlug)
        .single();

      if (error || !data) {
        setError("❌ هذا المركز غير موجود.");
      } else {
        setCenterId(data.id);
      }

      setLoadingCenter(false);
    };

    fetchCenter();
  }, [centerSlug]);

  // ✅ تسجيل الدخول
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!centerSlug || !centerId) {
      setError("❌ لا يمكن تسجيل الدخول بدون تحديد المركز.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("center_id", centerId)
      .single();

    setLoading(false);

    if (error || !data) {
      setError("❌ Email not found.");
    } else {
      localStorage.setItem("user", JSON.stringify(data));

      // توجيه بناءً على الدور
      if (data.role === "student") {
        navigate(`/${centerSlug}/dashboard/student`);
      } else if (data.role === "teacher") {
        navigate(`/${centerSlug}/dashboard/teacher`);
      } else if (data.role === "admin") {
        navigate(`/${centerSlug}/dashboard/admin`);
      } else {
        navigate(`/${centerSlug}/dashboard`);
      }
    }
  };

  if (loadingCenter) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" /> جاري تحميل المركز...
      </div>
    );
  }

  if (!centerSlug) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <h2 className="text-xl font-bold mb-4">يرجى الدخول من خلال رابط مركز محدد</h2>
        <p className="text-gray-500">
          مثل: https://train-centers-bw5s.vercel.app/<b>gammal</b>
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">تسجيل الدخول إلى مركز {centerSlug}</h2>

        {error && <div className="text-red-500 text-center mb-3">{error}</div>}

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
};

export default Login;

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
import { Layers, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { centerSlug } = useParams<{ centerSlug?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🧩 Store center subdomain in localStorage
  useEffect(() => {
    if (centerSlug) {
      localStorage.setItem("center_subdomain", centerSlug.trim());
    }
  }, [centerSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 🧩 Step 1: Get center_id from subdomain
      const currentSlug = centerSlug || localStorage.getItem("center_subdomain");
      let centerId: string | null = null;

      if (currentSlug) {
        const { data: centerData, error: centerError } = await supabase
          .from("centers")
          .select("id")
          .eq("subdomain", currentSlug)
          .maybeSingle();

        if (centerError) console.error("Center fetch error:", centerError);
        if (centerData) centerId = centerData.id;
      }

      console.log("🔍 Email:", email);
      console.log("🔍 Password:", password);
      console.log("🔍 Center ID:", centerId);
      console.log("🔍 Center Slug:", centerSlug);

      if (!centerId) {
        setErrorMsg("❌ Center not found.");
        setLoading(false);
        return;
      }

      // 🧩 Step 2: Fetch user inside that center
      const response = await fetch(
        `https://biqzcfbcsflriybyvtur.supabase.co/rest/v1/users?select=*&email=eq.${encodeURIComponent(
          email.trim()
        )}&password=eq.${encodeURIComponent(password.trim())}&center_id=eq.${centerId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("User query failed:", response.status);
        throw new Error(`Supabase returned ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setErrorMsg("❌ Incorrect email or password.");
        setLoading(false);
        return;
      }

      const user = data[0];

      // 🧩 Step 3: Save user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          center_subdomain: currentSlug || "gammal",
        })
      );

      // 🧩 Step 4: Redirect user by role
      let redirectPath = `/${currentSlug || "gammal"}/dashboard`;

      switch (user.role) {
        case "student":
          redirectPath += "/student";
          break;
        case "teacher":
          redirectPath += "/teacher";
          break;
        case "admin":
          redirectPath += "/admin";
          break;
        default:
          redirectPath += "/student";
          break;
      }

      console.log("✅ Redirecting to:", redirectPath);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("⚠️ An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Layers className="mx-auto h-12 w-auto text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          EduTech Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access your learning center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            {errorMsg && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

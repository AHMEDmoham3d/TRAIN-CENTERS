import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Calendar,
  Award,
  TrendingUp,
  ExternalLink,
  Clock,
  Download,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface UpcomingLesson {
  id: string;
  title: string;
  time: string;
  teacher: string;
}

interface PendingAssignment {
  id: string;
  title: string;
  dueDate: string;
  course: string;
  status: string;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalModules: number;
  completedModules: number;
}

interface AISuggestion {
  id: string;
  title: string;
  reason: string;
  icon: string;
}

interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

/** Subscription + teacher content types */
interface SubscriptionItem {
  id: string;
  student_id: string;
  teacher_id: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  center_wide?: boolean;
  teacher?: {
    id: string;
    full_name: string;
    email?: string | null;
    center_id?: string | null;
  } | null;
  videos: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    video_url?: string | null;
    uploaded_at?: string | null;
  }>;
  materials: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    uploaded_at?: string | null;
  }>;
  exams: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    total_marks?: number | null;
    created_at?: string | null;
    duration_minutes?: number | null;
    questions_count?: number | null;
  }>;
}

// Function to convert YouTube URLs to embed format
function getEmbedUrl(url: string | null): string {
  if (!url) return "";
  // لو اللينك قصير من youtu.be
  if (url.includes("youtu.be")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // لو اللينك فيه watch?v=
  if (url.includes("watch?v=")) {
    const videoId = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { centerSlug } = useParams<{ centerSlug: string }>();
  const { t } = useTranslation();

  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  // subscriptions grouped by teacher + their content
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (!centerSlug) return;

      try {
        // جلب معلومات السنتر بناءً على الـ slug
        const { data: centerData, error } = await supabase
          .from("centers")
          .select("id, name, subdomain")
          .eq("slug", centerSlug)
          .single();

        if (!error && centerData) {
          setCenterId(centerData.id);
          setCenterSubdomain(centerData.subdomain || centerData.name);
        }
      } catch (error) {
        console.error("Error fetching center info:", error);
      }
    };

    fetchCenterInfo();
  }, [centerSlug]);

  useEffect(() => {
    const fetchSubscriptionsAndContent = async () => {
      try {
        if (!user) {
          // Set mock data to display sections even without user
          setUpcomingLessons([
            {
              id: "1",
              title: "Advanced Mathematics",
              time: "10:00 AM - 11:30 AM",
              teacher: "Dr. Sarah Johnson",
            },
            {
              id: "2",
              title: "Physics Fundamentals",
              time: "1:00 PM - 2:30 PM",
              teacher: "Prof. Michael Chen",
            },
          ]);
          setAiSuggestions([
            {
              id: "1",
              title: "Review Calculus Fundamentals",
              reason: "Based on your recent quiz performance",
              icon: "BookOpen",
            },
          ]);
          setCourseProgress([
            {
              id: "1",
              title: "Course 1",
              progress: 75,
              totalModules: 12,
              completedModules: 9,
            },
          ]);
          setLoading(false);
          return;
        }

        console.log("🔍 Loaded student:", user);

        // 1️⃣ جلب الاشتراكات النشطة للطالب
        const { data: subs, error: subError } = await supabase
          .from("subscriptions")
          .select("id, teacher_id, is_active, start_date, end_date, center_wide")
          .eq("student_id", user.id)
          .eq("is_active", true);

        if (subError) {
          console.error("❌ Subscription fetch error:", subError);
          toast.error("Failed to load subscriptions");
          return;
        }

        console.log("✅ Subscriptions found:", subs);

        // 2️⃣ إذا كان هناك اشتراكات، جلب المحتوى المرتبط
        if (subs && subs.length > 0) {
          const teacherIds = subs.map((s: any) => s.teacher_id);
          
          // التحقق إذا كان هناك اشتراك شامل للسنتر
          const isCenterWide = subs.some((s: any) => s.center_wide === true);

          // جلب بيانات المدرسين أولاً
          const { data: teachersData, error: teachersError } = await supabase
            .from("teachers")
            .select("id, full_name, email, center_id")
            .in("id", teacherIds);

          if (teachersError) {
            console.error("❌ Teachers fetch error:", teachersError);
          }

          // إنشاء كائن لربط بيانات المدرسين بسرعة
          const teachersMap = new Map();
          teachersData?.forEach(teacher => {
            teachersMap.set(teacher.id, teacher);
          });

          // بناء بيانات الاشتراكات مع المحتوى
          const subsWithContent: SubscriptionItem[] = subs.map((s: any) => ({
            id: s.id,
            student_id: user.id,
            teacher_id: s.teacher_id,
            start_date: s.start_date,
            end_date: s.end_date,
            is_active: s.is_active,
            center_wide: s.center_wide,
            teacher: teachersMap.get(s.teacher_id) || null,
            videos: [],
            materials: [],
            exams: [],
          }));

          // 3️⃣ جلب المحتوى بناءً على نوع الاشتراك
          if (isCenterWide && centerId) {
            // إذا كان اشتراك شامل، جلب كل محتوى المدرسين في هذا السنتر
            console.log("🎯 Center-wide subscription detected, fetching all center content");

            // جلب كل المدرسين في السنتر
            const { data: centerTeachers, error: centerTeachersError } = await supabase
              .from("teachers")
              .select("id")
              .eq("center_id", centerId);

            if (!centerTeachersError && centerTeachers) {
              const centerTeacherIds = centerTeachers.map(t => t.id);

              // جلب الفيديوهات
              const { data: videosData, error: videosError } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (!videosError && videosData) {
                console.log("🎥 All center videos found:", videosData.length);
                // إضافة الفيديوهات لجميع الاشتراكات
                subsWithContent.forEach(sub => {
                  sub.videos = videosData;
                });
              }

              // جلب المواد الدراسية
              const { data: materialsData, error: materialsError } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (!materialsError && materialsData) {
                console.log("📚 All center materials found:", materialsData.length);
                subsWithContent.forEach(sub => {
                  sub.materials = materialsData;
                });
              }

              // جلب الامتحانات
              const { data: examsData, error: examsError } = await supabase
                .from("exams")
                .select("id, teacher_id, title, description, total_marks, created_at, duration_minutes, questions_count")
                .in("teacher_id", centerTeacherIds);

              if (!examsError && examsData) {
                console.log("📝 All center exams found:", examsData.length);
                subsWithContent.forEach(sub => {
                  sub.exams = examsData;
                });
              }
            }
          } else {
            // إذا كان اشتراك عادي، جلب محتوى المدرسين المحددين فقط
            console.log("🎯 Regular subscription, fetching specific teachers content");

            // جلب الفيديوهات
            const { data: videosData, error: videosError } = await supabase
              .from("videos")
              .select("id, teacher_id, title, description, video_url, uploaded_at")
              .in("teacher_id", teacherIds);

            if (!videosError && videosData) {
              console.log("🎥 Teacher-specific videos found:", videosData.length);
              // توزيع الفيديوهات على الاشتراكات المناسبة
              subsWithContent.forEach(sub => {
                sub.videos = videosData.filter(video => video.teacher_id === sub.teacher_id);
              });
            }

            // جلب المواد الدراسية
            const { data: materialsData, error: materialsError } = await supabase
              .from("materials")
              .select("id, teacher_id, title, description, file_url, uploaded_at")
              .in("teacher_id", teacherIds);

            if (!materialsError && materialsData) {
              console.log("📚 Teacher-specific materials found:", materialsData.length);
              subsWithContent.forEach(sub => {
                sub.materials = materialsData.filter(material => material.teacher_id === sub.teacher_id);
              });
            }

            // جلب الامتحانات
            const { data: examsData, error: examsError } = await supabase
              .from("exams")
              .select("id, teacher_id, title, description, total_marks, created_at, duration_minutes, questions_count")
              .in("teacher_id", teacherIds);

            if (!examsError && examsData) {
              console.log("📝 Teacher-specific exams found:", examsData.length);
              subsWithContent.forEach(sub => {
                sub.exams = examsData.filter(exam => exam.teacher_id === sub.teacher_id);
              });
            }
          }

          setSubscriptionsData(subsWithContent);
          console.log("✅ Final subscriptions data:", subsWithContent);
        } else {
          setSubscriptionsData([]);
        }

        // --- الحفاظ على محتوى الداشبورد الآخر (بيانات تجريبية أو خفيفة) ---
        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
          },
          {
            id: "2",
            title: "Physics Fundamentals",
            time: "1:00 PM - 2:30 PM",
            teacher: "Prof. Michael Chen",
          },
        ]);

        // المهام المعلقة
        const { data: examResults } = await supabase
          .from("exam_results")
          .select("id, exam_id, submitted_at, score, exams(title, description)")
          .eq("student_id", user.id)
          .is("score", null);

        if (examResults) {
          setPendingAssignments(
            examResults.map((er: any) => ({
              id: er.id,
              title: er.exams?.title || "Exam",
              dueDate: "Soon",
              course: er.exams?.title || "Course",
              status: "urgent",
            }))
          );
        } else {
          setPendingAssignments([]);
        }

        // تقدم الدورة
        if (subs && subs.length > 0) {
          setCourseProgress(
            subs.map((s: any, idx: number) => ({
              id: s.id,
              title: `Course ${idx + 1}`,
              progress: Math.floor(Math.random() * 100),
              totalModules: 12,
              completedModules: Math.floor(Math.random() * 12),
            }))
          );
        } else {
          setCourseProgress([]);
        }

        // اقتراحات الذكاء الاصطناعي والإنجازات (بيانات تجريبية)
        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
          },
        ]);

        const { data: payments } = await supabase
          .from("payments")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "confirmed");

        if (payments && payments.length > 0) {
          setRecentAchievements(
            payments.slice(0, 2).map((p: any) => ({
              id: p.id,
              title: "Subscription Payment",
              description: `Paid ${p.amount}`,
              date: new Date(p.payment_date).toLocaleDateString(),
            }))
          );
        } else {
          setRecentAchievements([]);
        }

      } catch (error) {
        console.error("⚠️ Unexpected error:", error);
        toast.error("Failed to load dashboard data");

        // تعيين بيانات تجريبية إذا فشل جلب البيانات
        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
          },
          {
            id: "2",
            title: "Physics Fundamentals",
            time: "1:00 PM - 2:30 PM",
            teacher: "Prof. Michael Chen",
          },
        ]);
        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
          },
        ]);
        setCourseProgress([
          {
            id: "1",
            title: "Course 1",
            progress: 75,
            totalModules: 12,
            completedModules: 9,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionsAndContent();
  }, [user, centerId]);

  useEffect(() => {
    console.log("🎥 Debug: Student subscriptions state:", subscriptionsData);
    if (subscriptionsData.length > 0) {
      console.log("🎥 Videos inside first subscription:", subscriptionsData[0].videos);
      console.log("📝 Exams inside first subscription:", subscriptionsData[0].exams);
      
      // حساب إجمالي المحتوى المتاح
      const totalVideos = subscriptionsData.reduce((sum, sub) => sum + sub.videos.length, 0);
      const totalMaterials = subscriptionsData.reduce((sum, sub) => sum + sub.materials.length, 0);
      const totalExams = subscriptionsData.reduce((sum, sub) => sum + sub.exams.length, 0);
      
      console.log(`📊 Total content - Videos: ${totalVideos}, Materials: ${totalMaterials}, Exams: ${totalExams}`);
    }
  }, [subscriptionsData]);

  // حساب حالة الاشتراك (نشط / منتهي / غير نشط)
  const computeSubscriptionStatus = (s: SubscriptionItem) => {
    const now = new Date();
    const end = s.end_date ? new Date(s.end_date) : null;
    if (!s.is_active) return "inactive";
    if (end && end < now) return "expired";
    return "active";
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatDateTime = (d?: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const handleStartExam = (examId: string) => {
    toast.success(`Starting exam ${examId}`);
    // navigate(`/exam/${examId}`);
  };

  const handleDownloadMaterial = (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      toast.error("No file available for download");
      return;
    }
    // إنشاء لينك تحميل للملف
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${title}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-center p-8">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      onNavAction={(action: string) => {
        if (action === "showVideos") setShowVideosPanel(true);
      }}
    >
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`Welcome, ${user?.name || "Student"}`}
          </h1>
          <p className="mt-1 text-gray-500">{new Date().toLocaleDateString()}</p>
          <p className="mt-2 text-sm text-primary-600">Center: {centerSubdomain || centerSlug || "Unknown"}</p>
        </div>

        {/* Overview cards (kept old layout structure) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's lessons */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Today's Lessons</h2>
            </div>

            {upcomingLessons.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500">{lesson.time}</p>
                    <p className="text-sm text-gray-500">{lesson.teacher}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No lessons scheduled for today</p>
            )}

            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all classes
              <ExternalLink className="ml-1 w-4 h-4" />
            </button>
          </div>

          {/* Pending assignments */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-secondary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Pending Assignments</h2>
            </div>

            {pendingAssignments.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.course} • Due {assignment.dueDate}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-error-100 text-error-800">{assignment.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No pending assignments</p>
            )}

            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all assignments
              <ExternalLink className="ml-1 w-4 h-4" />
            </button>
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI Study Suggestions</h2>
            </div>

            {aiSuggestions.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex">
                    <div className="mr-3 mt-1">{sug.icon === "BookOpen" ? <BookOpen className="w-5 h-5 text-primary-500" /> : <TrendingUp className="w-5 h-5 text-primary-500" />}</div>
                    <div>
                      <p className="font-medium text-gray-900">{sug.title}</p>
                      <p className="text-sm text-gray-500">{sug.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No suggestions available</p>
            )}

            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              See more recommendations
              <ExternalLink className="ml-1 w-4 h-4" />
            </button>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-warning-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
            </div>

            {recentAchievements.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {recentAchievements.map((ach) => (
                  <div key={ach.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Award className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{ach.title}</p>
                        <p className="text-sm text-gray-500">{ach.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{ach.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No achievements yet</p>
            )}

            <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all achievements
              <ExternalLink className="ml-1 w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subscriptions section (Teachers + their content) */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
            <button
              onClick={() => setShowVideosPanel(!showVideosPanel)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showVideosPanel ? "Hide Content" : "Show Content"}
            </button>
          </div>

          {subscriptionsData.length === 0 ? (
            <div className="text-gray-600">
              You have no subscriptions yet. Please subscribe to a teacher to access their courses, videos and exams.
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptionsData.map((sub) => {
                const status = computeSubscriptionStatus(sub);
                const isExpired = status === "expired";

                return (
                  <div key={sub.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {sub.teacher?.full_name || "Unknown Teacher"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Subscription: {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          {sub.center_wide && " (Center Wide)"}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            status === "expired"
                              ? "text-red-600"
                              : status === "inactive"
                              ? "text-gray-500"
                              : "text-green-600"
                          }`}
                        >
                          Status: {status}
                        </p>
                      </div>
                    </div>

                    {showVideosPanel && (
                      <div className="mt-4 space-y-6">
                        {/* Videos Section */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Videos ({sub.videos.length})
                          </h4>

                          {isExpired ? (
                            <p className="text-red-600 font-medium">
                              ⚠️ Your subscription has expired. Please renew to access videos.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {sub.videos.length > 0 ? (
                                sub.videos.map((v) => (
                                  <div key={v.id} className="border rounded p-3 bg-gray-50">
                                    <p className="font-medium">{v.title}</p>
                                    {v.description && (
                                      <p className="text-sm text-gray-600 mt-1">{v.description}</p>
                                    )}
                                    {v.video_url && (
                                      <iframe
                                        src={getEmbedUrl(v.video_url)}
                                        title={v.title}
                                        className="w-full h-60 rounded mt-2"
                                        allowFullScreen
                                      ></iframe>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      Uploaded: {formatDateTime(v.uploaded_at)}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No videos available</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Materials Section */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Study Materials ({sub.materials.length})
                          </h4>

                          {isExpired ? (
                            <p className="text-red-600 font-medium">
                              ⚠️ Your subscription has expired. Please renew to access materials.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {sub.materials.length > 0 ? (
                                sub.materials.map((material) => (
                                  <div key={material.id} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">{material.title}</p>
                                      {material.description && (
                                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">
                                        Uploaded: {formatDateTime(material.uploaded_at)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadMaterial(material.file_url, material.title)}
                                      className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No study materials available</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Exams Section */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Exams ({sub.exams.length})
                          </h4>

                          {isExpired ? (
                            <p className="text-red-600 font-medium">
                              ⚠️ Your subscription has expired. Please renew to access exams.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {sub.exams.length > 0 ? (
                                sub.exams.map((exam) => (
                                  <div key={exam.id} className="border rounded p-3 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-lg">{exam.title}</p>
                                        {exam.description && (
                                          <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                          {exam.total_marks && (
                                            <span>Total Marks: {exam.total_marks}</span>
                                          )}
                                          {exam.duration_minutes && (
                                            <span className="flex items-center">
                                              <Clock className="w-4 h-4 mr-1" />
                                              {exam.duration_minutes} minutes
                                            </span>
                                          )}
                                          {exam.questions_count && (
                                            <span>Questions: {exam.questions_count}</span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                          Created: {formatDateTime(exam.created_at)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleStartExam(exam.id)}
                                        className="ml-4 px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 whitespace-nowrap"
                                      >
                                        Start Exam
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No exams available</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress / AI / other sections preserved as earlier */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">Progress</h2>
          {courseProgress.length > 0 ? (
            <div className="mt-4 space-y-4">
              {courseProgress.map((progress) => (
                <div key={progress.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{progress.title}</h3>
                    <span className="text-sm text-gray-500">{progress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {progress.completedModules} of {progress.totalModules} modules completed
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-2">
              Your course progress and metrics will appear here.
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">AI Suggestions</h2>
          {aiSuggestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-900">{suggestion.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{suggestion.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-2">
              Personalized suggestions will appear here.
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">Schedules</h2>
          {upcomingLessons.length > 0 ? (
            <div className="mt-4 space-y-3">
              {upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-900">{lesson.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{lesson.time}</p>
                  <p className="text-sm text-gray-500">Teacher: {lesson.teacher}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-2">
              Your upcoming schedules and appointments will appear here.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
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

  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>(
    []
  );
  const [pendingAssignments, setPendingAssignments] = useState<
    PendingAssignment[]
  >([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<
    RecentAchievement[]
  >([]);
  const [loading, setLoading] = useState(true);

  // subscriptions grouped by teacher + their content
  const [subscriptionsData, setSubscriptionsData] = useState<
    SubscriptionItem[]
  >([]);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionsAndVideos = async () => {
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

        // 2️⃣ جيب الاشتراكات الخاصة بالطالب من جدول subscriptions مباشرة
        const { data: subs, error: subError } = await supabase
          .from("subscriptions")
          .select("teacher_id, is_active, end_date, center_wide")
          .eq("student_id", user.id)
          .eq("is_active", true);

        if (subError) {
          console.error("❌ Subscription fetch error:", subError);
          toast.error("Failed to load subscriptions");
          return;
        }

        console.log("✅ Subscriptions found:", subs);

        // 3️⃣ بناءً على الاشتراكات، جيب الفيديوهات والمواد والامتحانات المناسبة
        if (subs && subs.length > 0) {
          const teacherIds = subs.map((s: any) => s.teacher_id);

          // لو الطالب مشترك فى كل المدرسين داخل السنتر
          const isCenterWide = subs.some((s: any) => s.center_wide === true);

          // جلب بيانات المدرسين أولاً
          const subsWithContent: SubscriptionItem[] = await Promise.all(
            subs.map(async (s: any) => {
              const subItem: SubscriptionItem = {
                id: s.id,
                student_id: user.id,
                teacher_id: s.teacher_id,
                start_date: s.start_date,
                end_date: s.end_date,
                is_active: s.is_active,
                center_wide: s.center_wide,
                teacher: null,
                videos: [],
                materials: [],
                exams: [],
              };

              // fetch teacher info
              const { data: teacherData, error: teacherError } = await supabase
                .from("teachers")
                .select("id, full_name, email, center_id")
                .eq("id", s.teacher_id)
                .maybeSingle();

              if (!teacherError && teacherData) {
                subItem.teacher = {
                  id: teacherData.id,
                  full_name: teacherData.full_name,
                  email: teacherData.email,
                };
              }

              return subItem;
            })
          );

          // جلب الفيديوهات بناءً على نوع الاشتراك
          let videosQuery = supabase
            .from("videos")
            .select("id, teacher_id, title, description, video_url, uploaded_at");

          if (!isCenterWide) {
            videosQuery = videosQuery.in("teacher_id", teacherIds);
          } else {
            // لو اشتراك شامل السنتر كله → جيب كل فيديوهات المدرسين فى نفس السنتر
            videosQuery = videosQuery.eq("teacher_id", teacherIds[0]);
          }

          const { data: videosData, error: videosError } = await videosQuery;

          if (videosError) {
            console.error("❌ Videos fetch error:", videosError);
          } else {
            console.log("🎥 Videos found:", videosData);
            // توزيع الفيديوهات على الاشتراكات المناسبة
            if (videosData) {
              subsWithContent.forEach(sub => {
                if (isCenterWide) {
                  sub.videos = videosData;
                } else {
                  sub.videos = videosData.filter(video => video.teacher_id === sub.teacher_id);
                }
              });
            }
          }

          // جلب المواد الدراسية
          let materialsQuery = supabase
            .from("materials")
            .select("id, teacher_id, title, description, file_url, uploaded_at");

          if (!isCenterWide) {
            materialsQuery = materialsQuery.in("teacher_id", teacherIds);
          } else {
            materialsQuery = materialsQuery.eq("teacher_id", teacherIds[0]);
          }

          const { data: materialsData, error: materialsError } = await materialsQuery;

          if (materialsError) {
            console.error("❌ Materials fetch error:", materialsError);
          } else {
            console.log("📚 Materials found:", materialsData);
            // توزيع المواد على الاشتراكات المناسبة
            if (materialsData) {
              subsWithContent.forEach(sub => {
                if (isCenterWide) {
                  sub.materials = materialsData;
                } else {
                  sub.materials = materialsData.filter(material => material.teacher_id === sub.teacher_id);
                }
              });
            }
          }

          // جلب الامتحانات
          let examsQuery = supabase
            .from("exams")
            .select("id, teacher_id, title, description, total_marks, created_at");

          if (!isCenterWide) {
            examsQuery = examsQuery.in("teacher_id", teacherIds);
          } else {
            examsQuery = examsQuery.eq("teacher_id", teacherIds[0]);
          }

          const { data: examsData, error: examsError } = await examsQuery;

          if (examsError) {
            console.error("❌ Exams fetch error:", examsError);
          } else {
            console.log("📝 Exams found:", examsData);
            // توزيع الامتحانات على الاشتراكات المناسبة
            if (examsData) {
              subsWithContent.forEach(sub => {
                if (isCenterWide) {
                  sub.exams = examsData;
                } else {
                  sub.exams = examsData.filter(exam => exam.teacher_id === sub.teacher_id);
                }
              });
            }
          }

          setSubscriptionsData(subsWithContent);
        } else {
          setSubscriptionsData([]);
        }

        // --- Keep other dashboard content (mocked or lightweight) ---
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

        // pending assignments
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

        // course progress
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

        // ai suggestions & achievements (mocked)
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

        // Set mock data if fetching fails
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

    fetchSubscriptionsAndVideos();
  }, [user]);

  useEffect(() => {
    console.log("🎥 Debug: Student subscriptions state:", subscriptionsData);
    if (subscriptionsData.length > 0) {
      console.log("🎥 Videos inside first subscription:", subscriptionsData[0].videos);
    }
  }, [subscriptionsData]);

  // compute subscription status (active / expired / inactive)
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
          <p className="mt-2 text-sm text-primary-600">Center: {centerSubdomain || "Unknown"}</p>
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
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Videos</h4>

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
                                  <iframe
                                    src={getEmbedUrl(v.video_url)}
                                    title={v.title}
                                    className="w-full h-60 rounded mt-2"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">No videos available</p>
                            )}
                          </div>
                        )}
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
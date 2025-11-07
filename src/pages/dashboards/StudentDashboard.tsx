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

const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
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
    const fetchDashboardData = async () => {
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

      // get center subdomain from URL params or user or localStorage
      const currentCenterSubdomain =
        centerSlug || (user as any).center_subdomain || localStorage.getItem("center_subdomain");

      setCenterSubdomain(currentCenterSubdomain);

      console.log("🔍 Center subdomain:", currentCenterSubdomain);
      console.log("🔍 User data:", user);

      setLoading(true);
      try {
        // 1) optionally resolve center id (if you want to scope teachers to the center)
        let centerId: string | null = null;
        if (currentCenterSubdomain) {
          const centerRes = await supabase
            .from("centers")
            .select("id")
            .ilike("subdomain", currentCenterSubdomain)
            .single();
          if (!centerRes.error && centerRes.data) {
            centerId = centerRes.data.id;
          }
        }

        // 2) fetch subscriptions for this student (we fetch all subscriptions and later compute active/expired)
        const { data: subs, error: subsError } = await supabase
          .from("subscriptions")
          .select("id, student_id, teacher_id, start_date, end_date, is_active")
          .eq("student_id", user.id);

        if (subsError) {
          console.error("Error fetching subscriptions:", subsError);
          toast.error("Failed to load subscriptions");
          setSubscriptionsData([]);
        } else if (!subs || subs.length === 0) {
          setSubscriptionsData([]);
        } else {
          // ✅ فلترة الاشتراكات لتشمل فقط النشطة (اللي مازالت سارية)
          const activeSubs = subs.filter(
            (s: any) => s.is_active && new Date(s.end_date) > new Date()
          );

          // ✅ لو مفيش اشتراكات نشطة، يظهر نفس الرسالة
          if (activeSubs.length === 0) {
            setSubscriptionsData([]);
            setLoading(false);
            return;
          }

          // ✅ جلب بيانات المحتوى فقط للاشتراكات النشطة
          const subsWithContent: SubscriptionItem[] = await Promise.all(
            activeSubs.map(async (s: any) => {
              const subItem: SubscriptionItem = {
                id: s.id,
                student_id: s.student_id,
                teacher_id: s.teacher_id,
                start_date: s.start_date,
                end_date: s.end_date,
                is_active: s.is_active,
                teacher: null,
                videos: [],
                materials: [],
                exams: [],
              };

              // fetch teacher info (limit by center if centerId is available)
              const { data: teacherData, error: teacherError } = await supabase
                .from("teachers")
                .select("id, full_name, email, center_id")
                .eq("id", s.teacher_id)
                .maybeSingle();

              if (!teacherError && teacherData) {
                // optional: ensure teacher belongs to the same center if you require scoping
                if (!centerId || teacherData.center_id === centerId) {
                  subItem.teacher = {
                    id: teacherData.id,
                    full_name: teacherData.full_name,
                    email: teacherData.email,
                  };
                } else {
                  // teacher belongs to different center — still attach (you can hide if needed)
                  subItem.teacher = {
                    id: teacherData.id,
                    full_name: teacherData.full_name,
                    email: teacherData.email,
                  };
                }
              }

              console.log("🔍 Teacher data for subscription:", s.teacher_id, teacherData);
              console.log("🔍 Center ID:", centerId, "Teacher center_id:", teacherData?.center_id);

              // fetch videos for this teacher
              const { data: videosData, error: videosError } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .eq("teacher_id", s.teacher_id)
                .order("uploaded_at", { ascending: false });

              console.log("🔍 Videos for teacher", s.teacher_id, ":", videosData, videosError);

              if (!videosError && videosData) {
                subItem.videos = videosData;
              } else {
                subItem.videos = [];
              }

              // fetch materials for this teacher
              const { data: materialsData, error: materialsError } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at")
                .eq("teacher_id", s.teacher_id)
                .order("uploaded_at", { ascending: false });

              if (!materialsError && materialsData) {
                subItem.materials = materialsData;
              } else {
                subItem.materials = [];
              }

              // fetch exams created by this teacher
              const { data: examsData, error: examsError } = await supabase
                .from("exams")
                .select("id, teacher_id, title, description, total_marks, created_at")
                .eq("teacher_id", s.teacher_id)
                .order("created_at", { ascending: false });

              if (!examsError && examsData) {
                subItem.exams = examsData;
              } else {
                subItem.exams = [];
              }

              return subItem;
            })
          );

          console.log("🔍 Final subscriptions data:", subsWithContent);
          setSubscriptionsData(subsWithContent);
        }

        // --- Keep other dashboard content (mocked or lightweight) to preserve original layout ---

        // upcoming lessons: kept as sample/mock until you add a schedule table
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

        // pending assignments: derive from exam_results (mock fallback)
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

        // course progress: build from subscriptions (simple mock percentages)
        if (Array.isArray(subs) && subs.length > 0) {
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
        console.error("Error fetching student dashboard data:", error);
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

    fetchDashboardData();
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
                return (
                  <div key={sub.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {sub.teacher?.full_name || "Unknown Teacher"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Subscription: {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                        </p>
                      </div>

                      <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    status === "active"
                      ? "bg-green-100 text-green-800"
                      : status === "expired"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {status.toUpperCase()}
                </span>
                      </div>
                    </div>

            {/* ✅ هنا الإضافة الجديدة لعرض الفيديوهات */}
            {showVideosPanel && (
              <div className="mt-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-2">Videos</h4>
                {sub.videos && sub.videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sub.videos.map((v) => (
                      <div
                        key={v.id}
                        className="border rounded-lg p-3 shadow-sm bg-gray-50 hover:shadow-md transition"
                      >
                        <p className="font-medium text-gray-900 mb-1">{v.title}</p>
                        {v.video_url ? (
                          <iframe
                            src={v.video_url.replace("watch?v=", "embed/")}
                            className="w-full h-52 rounded-md"
                            allowFullScreen
                            title={v.title}
                          ></iframe>
                        ) : (
                          <p className="text-sm text-gray-500">No video URL</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No videos available for this teacher.</p>
                )}
              </div>
            )}
            {/* ✅ نهاية الجزء الجديد */}
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

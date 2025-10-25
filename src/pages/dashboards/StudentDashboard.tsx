import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

/** New types for subscription + teacher content */
interface SubscriptionItem {
  id: string;
  student_id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  teacher?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;
  videos: any[]; // video rows
  materials: any[]; // material rows
  exams: any[]; // exam rows
}

const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // get center subdomain from user or localStorage
      const centerSubdomain =
        (user as any).center_subdomain || localStorage.getItem("center_subdomain");

      setLoading(true);
      try {
        // 1) find center id (optional - helps ensure we are scoping content to the center)
        let centerId: string | null = null;
        if (centerSubdomain) {
          const centerRes = await supabase
            .from("centers")
            .select("id")
            .ilike("subdomain", centerSubdomain)
            .single();
          if (!centerRes.error && centerRes.data) {
            centerId = centerRes.data.id;
          }
        }

        // 2) fetch subscriptions for this student (include active and expired so we can show status)
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
          // For each subscription, fetch teacher info and the teacher's videos/materials/exams
          const subsWithContent: SubscriptionItem[] = await Promise.all(
            subs.map(async (s: any) => {
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

              // fetch teacher info (limit by center if you have centerId and want to verify)
              const { data: teacherData, error: teacherError } = await supabase
                .from("teachers")
                .select("id, full_name, email, center_id")
                .eq("id", s.teacher_id)
                .maybeSingle();

              if (!teacherError && teacherData) {
                // optional: ensure teacher belongs to the same center (if center scoping required)
                if (!centerId || teacherData.center_id === centerId) {
                  subItem.teacher = {
                    id: teacherData.id,
                    full_name: teacherData.full_name,
                    email: teacherData.email,
                  };
                } else {
                  // teacher not in center — leave teacher null (won't show content)
                  subItem.teacher = {
                    id: teacherData.id,
                    full_name: teacherData.full_name,
                    email: teacherData.email,
                  }; // still present but could be flagged
                }
              }

              // fetch videos for this teacher
              const { data: videosData, error: videosError } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .eq("teacher_id", s.teacher_id)
                .order("uploaded_at", { ascending: false });

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

          setSubscriptionsData(subsWithContent);
        }

        // --- The rest of the dashboard mocked content (kept simple) ---
        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
          },
        ]);

        setPendingAssignments([]);
        setCourseProgress([]);
        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
          },
        ]);
        setRecentAchievements([]);
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // helper to compute subscription status
  const computeSubscriptionStatus = (s: SubscriptionItem) => {
    const now = new Date();
    const end = s.end_date ? new Date(s.end_date) : null;
    if (!s.is_active) return "inactive";
    if (end && end < now) return "expired";
    return "active";
  };

  // small presentational helpers
  const formatDate = (d?: string) => {
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
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`Welcome, ${user?.name || ""}`}
          </h1>
          <p className="mt-1 text-gray-500">
            {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Subscriptions / Teachers area */}
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
                          {status === "active" ? "Active" : status === "expired" ? "Expired" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* show content only when toggled on */}
                    {showVideosPanel && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Videos */}
                        <div>
                          <h4 className="font-semibold mb-2">Videos</h4>
                          {sub.videos && sub.videos.length > 0 ? (
                            <div className="space-y-2">
                              {sub.videos.map((v) => (
                                <div key={v.id} className="p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{v.title}</div>
                                  <div className="text-xs text-gray-500 mb-1">{new Date(v.uploaded_at).toLocaleDateString()}</div>
                                  {v.video_url ? (
                                    <a
                                      href={v.video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 text-sm inline-flex items-center"
                                    >
                                      Watch video <ExternalLink className="ml-1 w-4 h-4" />
                                    </a>
                                  ) : (
                                    <div className="text-sm text-gray-500">No video URL provided</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No videos added yet for this teacher.</div>
                          )}
                        </div>

                        {/* Materials */}
                        <div>
                          <h4 className="font-semibold mb-2">Materials & Files</h4>
                          {sub.materials && sub.materials.length > 0 ? (
                            <div className="space-y-2">
                              {sub.materials.map((m) => (
                                <div key={m.id} className="p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{m.title}</div>
                                  <div className="text-xs text-gray-500 mb-1">{new Date(m.uploaded_at).toLocaleDateString()}</div>
                                  {m.file_url ? (
                                    <a
                                      href={m.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 text-sm inline-flex items-center"
                                    >
                                      Open file <ExternalLink className="ml-1 w-4 h-4" />
                                    </a>
                                  ) : (
                                    <div className="text-sm text-gray-500">No file provided</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No materials added yet for this teacher.</div>
                          )}
                        </div>

                        {/* Exams */}
                        <div>
                          <h4 className="font-semibold mb-2">Exams</h4>
                          {sub.exams && sub.exams.length > 0 ? (
                            <div className="space-y-2">
                              {sub.exams.map((ex) => (
                                <div key={ex.id} className="p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{ex.title}</div>
                                  <div className="text-xs text-gray-500 mb-1">{ex.description || "No description"}</div>
                                  <div className="text-xs text-gray-500">Total marks: {ex.total_marks ?? "-"}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No exams added yet for this teacher.</div>
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

        {/* Keep other dashboard sections (progress, AI suggestions...) */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">Progress</h2>
          <div className="text-sm text-gray-500 mt-2">
            Your course progress and metrics will appear here.
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">AI Suggestions</h2>
          <div className="text-sm text-gray-500 mt-2">
            Personalized suggestions will appear here.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

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
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ✅ جلب الفيديوهات من الـ View مباشرة
        const { data, error } = await supabase
          .from("student_accessible_videos")
          .select("*")
          .eq("student_id", user.id)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          toast("No available videos found for your account");
          setVideos([]);
          setLoading(false);
          return;
        }

        // ✅ تنسيق البيانات لتناسب العرض
        const formatted = data.map((item) => ({
          id: item.video_id,
          title: item.video_title,
          video_url: item.video_url,
          uploaded_at: item.uploaded_at,
          teacher: {
            id: item.teacher_id,
            full_name: item.teacher_name,
          },
        }));

        setVideos(formatted);
      } catch (error: any) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user]);

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
            {`Welcome, ${user?.name || ""}`}
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
                          {status === "active" ? "Active" : status === "expired" ? "Expired" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* show content only when toggled */}
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
                                  <div className="text-xs text-gray-500 mb-1">{v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString() : "-"}</div>
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
                                  <div className="text-xs text-gray-500 mb-1">{m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString() : "-"}</div>
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

        {/* Progress / AI / other sections preserved as earlier */}
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
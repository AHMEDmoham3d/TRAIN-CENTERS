import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);

  const [showVideosPanel, setShowVideosPanel] = useState(false);
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
        </div>

        {/* Videos Section */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Videos</h2>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                  <h3 className="font-medium text-gray-900">{video.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Teacher: {video.teacher.full_name}</p>
                  <p className="text-sm text-gray-500">Uploaded: {new Date(video.uploaded_at).toLocaleDateString()}</p>
                  {video.video_url ? (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700"
                    >
                      Watch Video <ExternalLink className="ml-1 w-4 h-4" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">No video URL available</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No videos available.</p>
          )}
        </div>




      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

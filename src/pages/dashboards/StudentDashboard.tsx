import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";



const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);


  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // جلب اسم السنتر من السابيز
        if ((user as any).center_id) {
          const { data: centerData, error: centerError } = await supabase
            .from("centers")
            .select("subdomain")
            .eq("id", (user as any).center_id)
            .single();

          if (!centerError && centerData) {
            setCenterSubdomain(centerData.subdomain);
          }
        }

        // جلب الفيديوهات من المدرس المشترك معه الطالب
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("*, teachers(*)")
          .eq("teacher_id", (user as any).teacher_id)
          .order("uploaded_at", { ascending: false });

        if (videoError) throw videoError;

        if (!videoData || videoData.length === 0) {
          toast("No available videos found for your account");
          setVideos([]);
        } else {
          // تنسيق البيانات لتناسب العرض
          const formatted = videoData.map((item) => ({
            id: item.id,
            title: item.title,
            video_url: item.video_url,
            uploaded_at: item.uploaded_at,
            teacher: {
              id: item.teacher_id,
              full_name: item.teachers?.full_name || "Unknown Teacher",
            },
          }));

          setVideos(formatted);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`Welcome, ${(user as any)?.full_name || ""}`}
          </h1>
          <p className="mt-1 text-gray-500">{new Date().toLocaleDateString()}</p>
          <p className="mt-2 text-sm text-primary-600">Center: {centerSubdomain || "Unknown"}</p>
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

import React, { useEffect, useState, useRef } from "react";
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
  Play,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  History,
  Eye,
  EyeOff,
  BarChart3,
  AlertCircle,
  Video,
  Loader,
  Users,
  Star,
  Book,
  User,
  File,
  HelpCircle,
  Repeat,
  TrendingDown,
  Target,
  Zap,
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
  subject?: string;
  isLive?: boolean;
}

interface PendingAssignment {
  id: string;
  title: string;
  dueDate: string;
  course: string;
  status: "pending" | "overdue" | "submitted";
  priority: "high" | "medium" | "low";
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  teacherName?: string;
  subject?: string;
  lastAccessed?: string;
}

interface AISuggestion {
  id: string;
  title: string;
  reason: string;
  icon: string;
  priority: "high" | "medium" | "low";
  action?: string;
}

interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  points: number;
}

interface VideoWithExams {
  id: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  uploaded_at?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  view_count?: number;
  category?: string | null;
  exams: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    total_marks?: number | null;
    created_at?: string | null;
    duration_minutes?: number | null;
    questions_count?: number | null;
    passing_score?: number | null;
    exam_questions?: Array<{
      id: string;
      question_text: string;
      points?: number;
      explanation?: string | null;
      exam_options: Array<{
        id: string;
        option_text: string;
        is_correct: boolean;
        explanation?: string | null;
      }>;
    }>;
  }>;
}

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
    subject?: string | null;
    image_url?: string | null;
    center_id?: string | null;
    bio?: string | null;
    rating?: number;
    total_students?: number;
  } | null;
  videosWithExams: VideoWithExams[];
  materials: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    uploaded_at?: string | null;
    file_type?: string | null;
    file_size?: number | null;
  }>;
}

interface ActiveExamState {
  examId: string;
  examTitle: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  questions: Array<{
    id: string;
    question_text: string;
    points?: number;
    explanation?: string | null;
    exam_options: Array<{
      id: string;
      option_text: string;
      is_correct: boolean;
      explanation?: string | null;
    }>;
  }>;
  currentQuestionIndex: number;
  userAnswers: { [questionId: string]: string };
  timeRemaining: number;
  totalTime: number;
  isSubmitted: boolean;
  score?: number;
  detailedResults?: {
    correct: number;
    incorrect: number;
    unanswered: number;
    totalPoints: number;
    earnedPoints: number;
  };
}

interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
  time_taken?: number;
  answers?: Record<string, string>;
  exam?: {
    title: string;
    teacher_id: string;
    teacher?: {
      full_name: string;
      subject?: string;
    };
    total_marks?: number;
    passing_score?: number;
  };
}

interface StudentStats {
  totalExamsTaken: number;
  averageScore: number;
  completedCourses: number;
  totalStudyTime: number;
  streakDays: number;
  points: number;
}

const getPublicVideoUrl = (videoUrl: string | null): string => {
  if (!videoUrl) return "";
  
  console.log("🔗 Original video URL:", videoUrl);
  
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return "";
    }
    return videoUrl;
  }
  
  const supabaseUrl = "https://biqzcfbcsflriybyvtur.supabase.co";
  
  if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov')) {
    let filename = videoUrl;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      filename = parts[parts.length - 1];
    }
    
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
    console.log("📹 Generated public URL:", publicUrl);
    return publicUrl;
  }
  
  if (videoUrl.startsWith('videos/')) {
    const filename = videoUrl.replace('videos/', '');
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
    console.log("📹 Generated public URL from videos path:", publicUrl);
    return publicUrl;
  }
  
  if (videoUrl.includes('storage/v1/object')) {
    if (videoUrl.includes('/storage/v1/object/')) {
      const urlParts = videoUrl.split('/storage/v1/object/');
      if (urlParts.length === 2) {
        const [domain, path] = urlParts;
        const publicUrl = `${domain}/storage/v1/object/public/${path}`;
        console.log("🔄 Converted to public URL:", publicUrl);
        return publicUrl;
      }
    }
  }
  
  console.log("⚠️ Assuming video is a filename in videos bucket");
  return `${supabaseUrl}/storage/v1/object/public/videos/${videoUrl}`;
};

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
  const [stats, setStats] = useState<StudentStats>({
    totalExamsTaken: 0,
    averageScore: 0,
    completedCourses: 0,
    totalStudyTime: 0,
    streakDays: 0,
    points: 0,
  });

  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [showVideosPanel, setShowVideosPanel] = useState(true);
  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<{[key: string]: ExamResult[]}>({});
  const [activeTab, setActiveTab] = useState<'videos' | 'materials' | 'exams'>('videos');
  
  // Active exam state
  const [activeExam, setActiveExam] = useState<ActiveExamState | null>(null);
  const [examTimer, setExamTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Exam results modal state
  const [showExamResultsModal, setShowExamResultsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState<ExamResult[]>([]);
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [selectedTeacherName, setSelectedTeacherName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Video states
  const [videoLoading, setVideoLoading] = useState<{[key: string]: boolean}>({});
  const [videoErrors, setVideoErrors] = useState<{[key: string]: string}>({});
  const [videoSources, setVideoSources] = useState<{[key: string]: string}>({});

  // Refs for video elements
  const videoRefs = useRef<{[key: string]: HTMLVideoElement | null}>({});

  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (!centerSlug) return;

      try {
        console.log("🔍 Fetching center info for subdomain:", centerSlug);
        const { data: centerData, error } = await supabase
          .from("centers")
          .select("id, name, subdomain")
          .eq("subdomain", centerSlug)
          .single();

        if (error) {
          console.error("❌ Error fetching center info:", error);
          return;
        }

        if (centerData) {
          setCenterId(centerData.id);
          setCenterSubdomain(centerData.subdomain || centerData.name);
          console.log("🏫 Center info loaded:", centerData);
        } else {
          console.log("❌ No center found with subdomain:", centerSlug);
        }
      } catch (error) {
        console.error("🚨 Unexpected error fetching center info:", error);
      }
    };

    fetchCenterInfo();
  }, [centerSlug]);

  useEffect(() => {
    const fetchExamResults = async () => {
      if (!user) return;

      try {
        console.log("📊 Fetching exam results for student:", user.id);
        const { data, error } = await supabase
          .from("exam_results")
          .select(`
            id,
            exam_id,
            student_id,
            score,
            submitted_at,
            time_taken,
            answers,
            exam:exams(
              title,
              teacher_id,
              total_marks,
              passing_score,
              teacher:teachers(
                full_name,
                subject
              )
            )
          `)
          .eq("student_id", user.id)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching exam results:", error);
          return;
        }

        console.log("✅ Exam results loaded:", data?.length || 0);

        // Group results by exam_id
        const groupedResults: {[key: string]: ExamResult[]} = {};
        data?.forEach(result => {
          if (!groupedResults[result.exam_id]) {
            groupedResults[result.exam_id] = [];
          }
          groupedResults[result.exam_id].push(result);
        });

        setExamResults(groupedResults);

        // Calculate stats
        if (data && data.length > 0) {
          const totalExams = data.length;
          const totalScore = data.reduce((sum, result) => sum + result.score, 0);
          const averageScore = Math.round(totalScore / totalExams);
          
          setStats(prev => ({
            ...prev,
            totalExamsTaken: totalExams,
            averageScore: averageScore,
          }));
        }
      } catch (error) {
        console.error("🚨 Error fetching exam results:", error);
      }
    };

    fetchExamResults();
  }, [user, activeExam]);

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!user) return;

      try {
        // Fetch additional student statistics
        const { data: progressData } = await supabase
          .from("student_progress")
          .select("*")
          .eq("student_id", user.id);

        // Fetch achievements
        const { data: achievementsData } = await supabase
          .from("student_achievements")
          .select(`
            id,
            title,
            description,
            earned_at,
            points,
            achievement:achievements(
              icon
            )
          `)
          .eq("student_id", user.id)
          .order("earned_at", { ascending: false })
          .limit(5);

        if (achievementsData) {
          const achievements: RecentAchievement[] = achievementsData.map(ach => ({
            id: ach.id,
            title: ach.title,
            description: ach.description,
            date: new Date(ach.earned_at).toLocaleDateString(),
            icon: ach.achievement?.icon || "Award",
            points: ach.points || 0,
          }));
          setRecentAchievements(achievements);
        }
      } catch (error) {
        console.error("Error fetching student stats:", error);
      }
    };

    fetchStudentStats();
  }, [user]);

  useEffect(() => {
    const fetchVideoSource = async (videoId: string, videoUrl: string | null) => {
      if (!videoUrl) return;
      
      setVideoLoading(prev => ({ ...prev, [videoId]: true }));
      setVideoErrors(prev => ({ ...prev, [videoId]: "" }));
      
      try {
        console.log(`🎬 Fetching video source for ${videoId}:`, videoUrl);
        
        const publicUrl = getPublicVideoUrl(videoUrl);
        
        if (!publicUrl) {
          throw new Error("Invalid video URL");
        }
        
        console.log(`🔗 Public URL for ${videoId}:`, publicUrl);
        
        // Test if the URL is accessible
        const response = await fetch(publicUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          throw new Error(`Video not accessible (HTTP ${response.status})`);
        }
        
        setVideoSources(prev => ({ ...prev, [videoId]: publicUrl }));
        console.log(`✅ Video source loaded for ${videoId}`);
        
      } catch (error: any) {
        console.error(`❌ Error fetching video ${videoId}:`, error);
        setVideoErrors(prev => ({ 
          ...prev, 
          [videoId]: error.message || "Failed to load video. Please check if the video exists in Supabase Storage."
        }));
      } finally {
        setVideoLoading(prev => ({ ...prev, [videoId]: false }));
      }
    };

    if (activeVideo) {
      subscriptionsData.forEach(sub => {
        sub.videosWithExams.forEach(video => {
          if (video.id === activeVideo) {
            if (!videoSources[activeVideo] && video.video_url) {
              fetchVideoSource(activeVideo, video.video_url);
            }
          }
        });
      });
    }
  }, [activeVideo, subscriptionsData]);

  useEffect(() => {
    const fetchSubscriptionsAndContent = async () => {
      try {
        if (!user) {
          console.log("👤 No user found, setting mock data");
          setUpcomingLessons([
            {
              id: "1",
              title: "Advanced Mathematics",
              time: "10:00 AM - 11:30 AM",
              teacher: "Dr. Sarah Johnson",
              subject: "Mathematics",
            },
            {
              id: "2",
              title: "Physics Fundamentals",
              time: "1:00 PM - 2:30 PM",
              teacher: "Prof. Michael Chen",
              subject: "Physics",
            },
          ]);
          
          setAiSuggestions([
            {
              id: "1",
              title: "Review Calculus Fundamentals",
              reason: "Based on your recent quiz performance",
              icon: "BookOpen",
              priority: "high",
              action: "Start Practice",
            },
            {
              id: "2",
              title: "Watch Physics Videos",
              reason: "To improve understanding of Newton's Laws",
              icon: "Video",
              priority: "medium",
            },
          ]);
          
          setPendingAssignments([
            {
              id: "1",
              title: "Algebra Homework",
              dueDate: "Tomorrow",
              course: "Mathematics",
              status: "pending",
              priority: "high",
            },
            {
              id: "2",
              title: "Physics Lab Report",
              dueDate: "In 3 days",
              course: "Physics",
              status: "pending",
              priority: "medium",
            },
          ]);
          
          setCourseProgress([
            {
              id: "1",
              title: "Calculus I",
              progress: 75,
              totalModules: 12,
              completedModules: 9,
              teacherName: "Dr. Sarah Johnson",
              subject: "Mathematics",
              lastAccessed: "2 hours ago",
            },
          ]);
          setLoading(false);
          return;
        }

        console.log("🔍 Loaded student:", user);

        // Fetch student's subscriptions
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

        if (subs && subs.length > 0) {
          const teacherIds = subs.map((s: any) => s.teacher_id);
          const uniqueTeacherIds = [...new Set(teacherIds)];
          
          console.log("👨‍🏫 Teacher IDs from subscriptions:", uniqueTeacherIds);

          const isCenterWide = subs.some((s: any) => s.center_wide === true);
          console.log("🎯 Is center-wide subscription:", isCenterWide);

          // Fetch teacher data with additional info
          const { data: teachersData, error: teachersError } = await supabase
            .from("teachers")
            .select("id, full_name, email, subject, image_url, center_id, bio, rating, total_students")
            .in("id", uniqueTeacherIds);

          if (teachersError) {
            console.error("❌ Teachers fetch error:", teachersError);
          } else {
            console.log("✅ Teachers data loaded:", teachersData);
          }

          const teachersMap = new Map();
          teachersData?.forEach(teacher => {
            teachersMap.set(teacher.id, teacher);
          });

          const subsWithContent: SubscriptionItem[] = subs.map((s: any) => ({
            id: s.id,
            student_id: user.id,
            teacher_id: s.teacher_id,
            start_date: s.start_date,
            end_date: s.end_date,
            is_active: s.is_active,
            center_wide: s.center_wide,
            teacher: teachersMap.get(s.teacher_id) || null,
            videosWithExams: [],
            materials: [],
          }));

          console.log("📦 Initial subscriptions with content structure:", subsWithContent);

          if (isCenterWide && centerId) {
            console.log("🎯 Step 3A: Center-wide subscription detected, fetching all center content for center:", centerId);

            const { data: centerTeachers, error: centerTeachersError } = await supabase
              .from("teachers")
              .select("id")
              .eq("center_id", centerId);

            if (centerTeachersError) {
              console.error("❌ Center teachers fetch error:", centerTeachersError);
            } else if (centerTeachers && centerTeachers.length > 0) {
              const centerTeacherIds = centerTeachers.map(t => t.id);
              console.log("🎯 Center teacher IDs for content:", centerTeacherIds);

              // Fetch videos with exams
              console.log("🎥 Fetching videos with exams for center teachers");
              const { data: videosData, error: videosError } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at, thumbnail_url, duration, view_count, category")
                .in("teacher_id", centerTeacherIds);

              if (videosError) {
                console.error("❌ Videos fetch error:", videosError);
              } else {
                console.log("✅ Center videos found:", videosData?.length || 0);
                
                if (videosData && videosData.length > 0) {
                  const videoIds = videosData.map(v => v.id);
                  
                  console.log("📝 Fetching exams for videos");
                  const { data: exams, error: examsError } = await supabase
                    .from('exams')
                    .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes, passing_score')
                    .in('video_id', videoIds);

                  if (examsError) {
                    console.error("❌ Exams fetch error:", examsError);
                  } else {
                    console.log("✅ Exams found:", exams?.length || 0);
                    
                    const examsWithQuestions = await Promise.all(
                      exams?.map(async (exam) => {
                        const { data: questions } = await supabase
                          .from('exam_questions')
                          .select('id, question_text, exam_id, points, explanation')
                          .eq('exam_id', exam.id);

                        const questionsWithOptions = await Promise.all(
                          questions?.map(async (question) => {
                            const { data: options } = await supabase
                              .from('exam_options')
                              .select('id, option_text, is_correct, question_id, explanation')
                              .eq('question_id', question.id);

                            return {
                              ...question,
                              exam_options: options || []
                            };
                          }) || []
                        );

                        return {
                          ...exam,
                          questions_count: questionsWithOptions.length,
                          exam_questions: questionsWithOptions
                        };
                      }) || []
                    );

                    const videosWithExams = videosData.map(video => ({
                      ...video,
                      exams: examsWithQuestions.filter(exam => exam.video_id === video.id) || []
                    }));

                    subsWithContent.forEach(sub => {
                      sub.videosWithExams = videosWithExams;
                    });
                  }
                }
              }

              // Fetch materials
              console.log("📚 Fetching materials for center teachers");
              const { data: materialsData, error: materialsError } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at, file_type, file_size")
                .in("teacher_id", centerTeacherIds);

              if (materialsError) {
                console.error("❌ Materials fetch error:", materialsError);
              } else {
                console.log("✅ Center materials found:", materialsData?.length || 0);
                subsWithContent.forEach(sub => {
                  sub.materials = materialsData || [];
                });
              }
            }
          } else {
            console.log("🎯 Step 3B: Regular subscription, fetching specific teachers content for teachers:", uniqueTeacherIds);

            // Fetch videos with exams for specific teachers
            console.log("🎥 Fetching videos with exams for specific teachers");
            const { data: videosData, error: videosError } = await supabase
              .from("videos")
              .select("id, teacher_id, title, description, video_url, uploaded_at, thumbnail_url, duration, view_count, category")
              .in("teacher_id", uniqueTeacherIds);

            if (videosError) {
              console.error("❌ Videos fetch error:", videosError);
            } else {
              console.log("✅ Teacher-specific videos found:", videosData?.length || 0);
              
              if (videosData && videosData.length > 0) {
                const videoIds = videosData.map(v => v.id);
                
                console.log("📝 Fetching exams for videos");
                const { data: exams, error: examsError } = await supabase
                  .from('exams')
                  .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes, passing_score')
                  .in('video_id', videoIds)
                  .in('teacher_id', uniqueTeacherIds);

                if (examsError) {
                  console.error("❌ Exams fetch error:", examsError);
                } else {
                  console.log("✅ Exams found:", exams?.length || 0);
                  
                  const examsWithQuestions = await Promise.all(
                    exams?.map(async (exam) => {
                      const { data: questions } = await supabase
                        .from('exam_questions')
                        .select('id, question_text, exam_id, points, explanation')
                        .eq('exam_id', exam.id);

                      const questionsWithOptions = await Promise.all(
                        questions?.map(async (question) => {
                          const { data: options } = await supabase
                            .from('exam_options')
                            .select('id, option_text, is_correct, question_id, explanation')
                            .eq('question_id', question.id);

                          return {
                            ...question,
                            exam_options: options || []
                          };
                        }) || []
                      );

                      return {
                        ...exam,
                        questions_count: questionsWithOptions.length,
                        exam_questions: questionsWithOptions
                      };
                    }) || []
                  );

                  subsWithContent.forEach(sub => {
                    const teacherVideos = videosData.filter(video => video.teacher_id === sub.teacher_id);
                    sub.videosWithExams = teacherVideos.map(video => ({
                      ...video,
                      exams: examsWithQuestions.filter(exam => exam.video_id === video.id && exam.teacher_id === sub.teacher_id) || []
                    }));
                  });
                }
              }
            }

            // Fetch materials
            console.log("📚 Fetching materials for specific teachers");
            const { data: materialsData, error: materialsError } = await supabase
              .from("materials")
              .select("id, teacher_id, title, description, file_url, uploaded_at, file_type, file_size")
              .in("teacher_id", uniqueTeacherIds);

            if (materialsError) {
              console.error("❌ Materials fetch error:", materialsError);
            } else {
              console.log("✅ Teacher-specific materials found:", materialsData?.length || 0);
              subsWithContent.forEach(sub => {
                sub.materials = materialsData ? materialsData.filter(material => material.teacher_id === sub.teacher_id) : [];
              });
            }
          }

          console.log("✅ Final subscriptions data with content:", subsWithContent);
          setSubscriptionsData(subsWithContent);
        } else {
          console.log("📭 No active subscriptions found");
          setSubscriptionsData([]);
        }

        // Set mock data for other sections
        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
            subject: "Mathematics",
          },
          {
            id: "2",
            title: "Physics Fundamentals",
            time: "1:00 PM - 2:30 PM",
            teacher: "Prof. Michael Chen",
            subject: "Physics",
          },
        ]);

        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
            priority: "high",
            action: "Start Practice",
          },
          {
            id: "2",
            title: "Complete Pending Assignments",
            reason: "2 assignments are due soon",
            icon: "FileText",
            priority: "high",
          },
          {
            id: "3",
            title: "Watch Recommended Videos",
            reason: "To improve your understanding",
            icon: "Video",
            priority: "medium",
          },
        ]);

        setPendingAssignments([
          {
            id: "1",
            title: "Algebra Homework",
            dueDate: "Tomorrow",
            course: "Mathematics",
            status: "pending",
            priority: "high",
          },
          {
            id: "2",
            title: "Physics Lab Report",
            dueDate: "In 3 days",
            course: "Physics",
            status: "pending",
            priority: "medium",
          },
        ]);

        if (subs && subs.length > 0) {
          setCourseProgress(
            subs.map((s: any, idx: number) => ({
              id: s.id,
              title: `Course ${idx + 1}`,
              progress: Math.floor(Math.random() * 100),
              totalModules: 12,
              completedModules: Math.floor(Math.random() * 12),
              teacherName: "Teacher Name",
              subject: ["Mathematics", "Physics", "Chemistry"][idx % 3],
              lastAccessed: `${Math.floor(Math.random() * 24)} hours ago`,
            }))
          );
        } else {
          setCourseProgress([]);
        }

      } catch (error) {
        console.error("🚨 Unexpected error in dashboard:", error);
        toast.error("Failed to load dashboard data");

        // Set fallback data
        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
            subject: "Mathematics",
          },
        ]);
        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
            priority: "high",
          },
        ]);
        setCourseProgress([
          {
            id: "1",
            title: "Course 1",
            progress: 75,
            totalModules: 12,
            completedModules: 9,
            teacherName: "Dr. Sarah Johnson",
            subject: "Mathematics",
            lastAccessed: "2 hours ago",
          },
        ]);
      } finally {
        setLoading(false);
        console.log("🏁 Dashboard loading completed");
      }
    };

    fetchSubscriptionsAndContent();
  }, [user, centerId]);

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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleStartExam = (examId: string, examTitle: string, teacherId: string, teacherName: string, subject?: string, questions: any[] = []) => {
    if (examTimer) {
      clearInterval(examTimer);
    }

    let examDuration = 30;
    
    subscriptionsData.forEach(sub => {
      sub.videosWithExams.forEach(video => {
        video.exams.forEach(exam => {
          if (exam.id === examId && exam.duration_minutes) {
            examDuration = exam.duration_minutes;
          }
        });
      });
    });

    const timeInSeconds = examDuration * 60;

    setActiveExam({
      examId,
      examTitle,
      teacherId,
      teacherName,
      subject,
      questions: questions || [],
      currentQuestionIndex: 0,
      userAnswers: {},
      timeRemaining: timeInSeconds,
      totalTime: timeInSeconds,
      isSubmitted: false,
      score: undefined,
      detailedResults: undefined,
    });

    const timer = setInterval(() => {
      setActiveExam(prev => {
        if (!prev) return null;
        if (prev.timeRemaining <= 0) {
          clearInterval(timer);
          handleSubmitExam();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    setExamTimer(timer);
    toast.success(`Exam "${examTitle}" started! You have ${examDuration} minutes.`);
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (!activeExam) return;

    setActiveExam(prev => {
      if (!prev) return null;
      
      const updatedAnswers = {
        ...prev.userAnswers,
        [questionId]: optionId
      };

      const currentIndex = prev.currentQuestionIndex;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < prev.questions.length) {
        return {
          ...prev,
          userAnswers: updatedAnswers,
          currentQuestionIndex: nextIndex
        };
      } else {
        return {
          ...prev,
          userAnswers: updatedAnswers
        };
      }
    });
  };

  const handleNextQuestion = () => {
    if (!activeExam) return;
    
    setActiveExam(prev => {
      if (!prev) return null;
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex < prev.questions.length) {
        return { ...prev, currentQuestionIndex: nextIndex };
      }
      return prev;
    });
  };

  const handlePrevQuestion = () => {
    if (!activeExam) return;
    
    setActiveExam(prev => {
      if (!prev) return null;
      const prevIndex = prev.currentQuestionIndex - 1;
      if (prevIndex >= 0) {
        return { ...prev, currentQuestionIndex: prevIndex };
      }
      return prev;
    });
  };

  const handleSubmitExam = async () => {
    if (!activeExam || !user) return;

    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }

    // Calculate score with points
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const totalQuestions = activeExam.questions.length;

    activeExam.questions.forEach(question => {
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;
      
      const userAnswer = activeExam.userAnswers[question.id];
      if (userAnswer) {
        const selectedOption = question.exam_options.find(opt => opt.id === userAnswer);
        if (selectedOption && selectedOption.is_correct) {
          correctAnswers++;
          earnedPoints += questionPoints;
        }
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const submittedAt = new Date().toISOString();
    const timeTaken = activeExam.totalTime - activeExam.timeRemaining;

    const detailedResults = {
      correct: correctAnswers,
      incorrect: Object.keys(activeExam.userAnswers).length - correctAnswers,
      unanswered: totalQuestions - Object.keys(activeExam.userAnswers).length,
      totalPoints,
      earnedPoints,
    };

    try {
      console.log("💾 Saving exam result to database...");
      const { data, error } = await supabase
        .from("exam_results")
        .insert({
          exam_id: activeExam.examId,
          student_id: user.id,
          score: score,
          submitted_at: submittedAt,
          time_taken: timeTaken,
          answers: activeExam.userAnswers,
        })
        .select();

      if (error) {
        console.error("❌ Error saving exam result:", error);
        toast.error("Failed to save exam result");
        throw error;
      }

      console.log("✅ Exam result saved successfully:", data);

      // Update local exam results
      const newResult: ExamResult = {
        id: data[0].id,
        exam_id: activeExam.examId,
        student_id: user.id,
        score: score,
        submitted_at: submittedAt,
        time_taken: timeTaken,
        answers: activeExam.userAnswers,
        exam: {
          title: activeExam.examTitle,
          teacher_id: activeExam.teacherId,
          teacher: {
            full_name: activeExam.teacherName,
            subject: activeExam.subject
          }
        }
      };

      setExamResults(prev => {
        const existingResults = prev[activeExam.examId] || [];
        return {
          ...prev,
          [activeExam.examId]: [newResult, ...existingResults]
        };
      });

      // Update stats
      setStats(prev => ({
        ...prev,
        totalExamsTaken: prev.totalExamsTaken + 1,
        averageScore: Math.round((prev.averageScore * prev.totalExamsTaken + score) / (prev.totalExamsTaken + 1)),
      }));

      toast.success(`Exam submitted! Your score: ${score}%`);

    } catch (error) {
      console.error("🚨 Error submitting exam:", error);
      toast.error("Failed to submit exam");
    }

    setActiveExam(prev => prev ? { 
      ...prev, 
      isSubmitted: true, 
      score,
      detailedResults
    } : null);
  };

  const handleCancelExam = () => {
    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }
    
    if (activeExam && !activeExam.isSubmitted) {
      if (window.confirm("Are you sure you want to cancel the exam? Your progress will be lost.")) {
        setActiveExam(null);
        toast.error("Exam cancelled");
      }
    } else {
      setActiveExam(null);
    }
  };

  const handleShowExamResults = (examId: string, examTitle: string, teacherName: string, subject: string = "") => {
    const results = examResults[examId] || [];
    setSelectedExamResults(results);
    setSelectedExamTitle(examTitle);
    setSelectedTeacherName(teacherName);
    setSelectedSubject(subject);
    setShowExamResultsModal(true);
  };

  const handleDownloadMaterial = async (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      toast.error("No file available for download");
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${title}`);
      
      // Log download activity
      if (user) {
        await supabase
          .from("student_activities")
          .insert({
            student_id: user.id,
            activity_type: "material_download",
            activity_data: { material_title: title },
          });
      }
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(activeVideo === videoId ? null : videoId);
    
    // Log video play activity
    if (user && activeVideo !== videoId) {
      supabase
        .from("student_activities")
        .insert({
          student_id: user.id,
          activity_type: "video_play",
          activity_data: { video_id: videoId },
        })
        .then(({ error }) => {
          if (error) console.error("Error logging video play:", error);
        });
    }
  };

  const getHighestScore = (examId: string): number => {
    const results = examResults[examId];
    if (!results || results.length === 0) return 0;
    
    return Math.max(...results.map(r => r.score));
  };

  const getLatestResult = (examId: string): ExamResult | null => {
    const results = examResults[examId];
    if (!results || results.length === 0) return null;
    
    return results[0];
  };

  const getAverageScore = (examId: string): number => {
    const results = examResults[examId];
    if (!results || results.length === 0) return 0;
    
    const total = results.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / results.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleVideoError = (videoId: string, error: any) => {
    console.error(`❌ Video playback error for ${videoId}:`, error);
    setVideoErrors(prev => ({ 
      ...prev, 
      [videoId]: "Failed to play video. The file may be corrupted or in an unsupported format." 
    }));
  };

  const handleVideoLoad = (videoId: string) => {
    console.log(`✅ Video loaded successfully: ${videoId}`);
    setVideoErrors(prev => ({ ...prev, [videoId]: "" }));
  };

  const getIconForPriority = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <AlertCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIconForSuggestion = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      BookOpen: <BookOpen className="w-5 h-5 text-blue-500" />,
      Video: <Video className="w-5 h-5 text-purple-500" />,
      FileText: <FileText className="w-5 h-5 text-green-500" />,
      TrendingUp: <TrendingUp className="w-5 h-5 text-orange-500" />,
      Target: <Target className="w-5 h-5 text-red-500" />,
      Zap: <Zap className="w-5 h-5 text-yellow-500" />,
    };
    return iconMap[iconName] || <BookOpen className="w-5 h-5 text-blue-500" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-lg text-gray-700">Loading dashboard...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your learning environment</p>
          </div>
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
      {/* Modal for active exam */}
      {activeExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Exam Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-4 flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{activeExam.examTitle}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  <div className="flex items-center bg-primary-700 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium">{formatTime(activeExam.timeRemaining)}</span>
                  </div>
                  <div className="bg-primary-700 px-3 py-1 rounded-full">
                    Question {activeExam.currentQuestionIndex + 1} of {activeExam.questions.length}
                  </div>
                  <div className="bg-primary-700 px-3 py-1 rounded-full">
                    Answered: {Object.keys(activeExam.userAnswers).length} / {activeExam.questions.length}
                  </div>
                  {activeExam.teacherName && (
                    <div className="text-sm opacity-90">
                      Teacher: {activeExam.teacherName} {activeExam.subject && ` | Subject: ${activeExam.subject}`}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancelExam}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Exam
              </button>
            </div>

            {/* Exam Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!activeExam.isSubmitted ? (
                <>
                  {/* Current Question */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 mb-6 border border-primary-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                          {activeExam.currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
                              {activeExam.questions[activeExam.currentQuestionIndex]?.question_text}
                            </h3>
                            {activeExam.questions[activeExam.currentQuestionIndex]?.points && (
                              <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                                {activeExam.questions[activeExam.currentQuestionIndex]?.points} points
                              </span>
                            )}
                          </div>
                          {activeExam.questions[activeExam.currentQuestionIndex]?.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <span className="font-semibold">Hint:</span> {activeExam.questions[activeExam.currentQuestionIndex]?.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {activeExam.questions[activeExam.currentQuestionIndex]?.exam_options.map((option, index) => {
                        const questionId = activeExam.questions[activeExam.currentQuestionIndex].id;
                        const isSelected = activeExam.userAnswers[questionId] === option.id;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleSelectAnswer(questionId, option.id)}
                            className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                              isSelected
                                ? 'border-primary-600 bg-gradient-to-r from-primary-50 to-blue-50 shadow-primary-100 ring-2 ring-primary-200 transform scale-[1.02]'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25 hover:shadow-primary-50'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white shadow-lg'
                                  : 'border-gray-300 bg-white group-hover:border-primary-400 group-hover:bg-primary-50'
                              }`}>
                                <span className={`font-bold text-sm ${
                                  isSelected ? 'text-white' : 'text-gray-600 group-hover:text-primary-600'
                                }`}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-base font-medium leading-relaxed block ${
                                  isSelected ? 'text-primary-900' : 'text-gray-800 group-hover:text-primary-800'
                                }`}>
                                  {option.option_text}
                                </span>
                                {option.explanation && (
                                  <p className="text-sm text-gray-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {option.explanation}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <CheckCircle className="w-6 h-6 text-primary-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={activeExam.currentQuestionIndex === 0}
                      className={`flex items-center px-5 py-2.5 rounded-lg transition-all ${
                        activeExam.currentQuestionIndex === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Previous
                    </button>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to submit the exam? You cannot change answers after submission.")) {
                            handleSubmitExam();
                          }
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Exam
                      </button>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      disabled={activeExam.currentQuestionIndex === activeExam.questions.length - 1}
                      className={`flex items-center px-5 py-2.5 rounded-lg transition-all ${
                        activeExam.currentQuestionIndex === activeExam.questions.length - 1
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      Next
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>

                  {/* Progress Indicators */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-gray-700">Question Progress</p>
                      <span className="text-sm font-semibold text-primary-600">
                        {Object.keys(activeExam.userAnswers).length} / {activeExam.questions.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeExam.questions.map((_, index) => {
                        const questionId = activeExam.questions[index].id;
                        const isAnswered = activeExam.userAnswers[questionId];
                        const isCurrent = index === activeExam.currentQuestionIndex;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setActiveExam(prev => 
                              prev ? { ...prev, currentQuestionIndex: index } : null
                            )}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all transform hover:scale-105 ${
                              isCurrent
                                ? 'border-primary-600 bg-gradient-to-br from-primary-100 to-blue-100 text-primary-700 font-bold shadow-md'
                                : isAnswered
                                ? 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 shadow-sm'
                                : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {index + 1}
                            {isAnswered && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Results Screen */
                <div className="text-center py-8">
                  <div className="mb-8">
                    <div className="relative inline-block">
                      <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
                      <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">{activeExam.score}%</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">Exam Submitted Successfully!</h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                      Your exam has been submitted and your score has been recorded in your learning history.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 max-w-3xl mx-auto shadow-lg border border-gray-100">
                    <h4 className="font-bold text-2xl text-gray-900 mb-6">Exam Summary</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200">
                        <div className="text-3xl font-bold text-blue-700 mb-2">{activeExam.detailedResults?.correct || 0}</div>
                        <div className="text-sm font-medium text-blue-800">Correct Answers</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 text-center border border-red-200">
                        <div className="text-3xl font-bold text-red-700 mb-2">{activeExam.detailedResults?.incorrect || 0}</div>
                        <div className="text-sm font-medium text-red-800">Incorrect Answers</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 text-center border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-700 mb-2">{activeExam.detailedResults?.unanswered || 0}</div>
                        <div className="text-sm font-medium text-yellow-800">Unanswered</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center border border-purple-200">
                        <div className="text-3xl font-bold text-purple-700 mb-2">
                          {activeExam.detailedResults?.earnedPoints || 0}/{activeExam.detailedResults?.totalPoints || 0}
                        </div>
                        <div className="text-sm font-medium text-purple-800">Points Earned</div>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium text-gray-700">Time Taken:</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatTime(activeExam.totalTime - activeExam.timeRemaining)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium text-gray-700">Total Questions:</span>
                        <span className="text-xl font-bold text-gray-800">{activeExam.questions.length}</span>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-2xl font-bold">
                          <span>Final Score:</span>
                          <span className={`${
                            activeExam.score! >= 80 ? 'text-green-600' :
                            activeExam.score! >= 60 ? 'text-blue-600' :
                            activeExam.score! >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {activeExam.score}%
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full ${
                                activeExam.score! >= 80 ? 'bg-green-500' :
                                activeExam.score! >= 60 ? 'bg-blue-500' :
                                activeExam.score! >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${activeExam.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-center space-x-6">
                    <button
                      onClick={handleCancelExam}
                      className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => handleShowExamResults(activeExam.examId, activeExam.examTitle, activeExam.teacherName, activeExam.subject)}
                      className="bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      View Results History
                    </button>
                    <button
                      onClick={() => handleStartExam(
                        activeExam.examId, 
                        activeExam.examTitle, 
                        activeExam.teacherId, 
                        activeExam.teacherName, 
                        activeExam.subject,
                        activeExam.questions
                      )}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center"
                    >
                      <Repeat className="w-5 h-5 mr-2" />
                      Retake Exam
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for exam results */}
      {showExamResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedExamTitle}</h2>
                <div className="mt-2 text-lg opacity-90">
                  {selectedTeacherName && `Teacher: ${selectedTeacherName}`}
                  {selectedSubject && ` | Subject: ${selectedSubject}`}
                </div>
              </div>
              <button
                onClick={() => setShowExamResultsModal(false)}
                className="text-white hover:text-gray-200 bg-primary-700 hover:bg-primary-800 p-2 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Exam Results History</h3>
                  <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-2 rounded-full">
                    {selectedExamResults.length} attempt(s)
                  </span>
                </div>

                {selectedExamResults.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="text-sm text-blue-600 font-semibold mb-2">Highest Score</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {Math.max(...selectedExamResults.map(r => r.score))}%
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <div className="text-sm text-green-600 font-semibold mb-2">Average Score</div>
                        <div className="text-3xl font-bold text-green-700">
                          {Math.round(selectedExamResults.reduce((sum, r) => sum + r.score, 0) / selectedExamResults.length)}%
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="text-sm text-purple-600 font-semibold mb-2">Latest Score</div>
                        <div className="text-3xl font-bold text-purple-700">
                          {selectedExamResults[0].score}%
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <div className="text-sm text-orange-600 font-semibold mb-2">Improvement</div>
                        <div className="text-3xl font-bold text-orange-700">
                          {selectedExamResults.length > 1 
                            ? `${selectedExamResults[0].score - selectedExamResults[selectedExamResults.length - 1].score}%` 
                            : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Attempt #
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Time Taken
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedExamResults.map((result, index) => (
                            <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-lg font-bold text-primary-700">
                                      {selectedExamResults.length - index}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    Attempt {selectedExamResults.length - index}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`text-2xl font-bold ${
                                    result.score >= 80 ? 'text-green-600' :
                                    result.score >= 60 ? 'text-blue-600' :
                                    result.score >= 50 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {result.score}%
                                  </div>
                                  {index === 0 && (
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                      Latest
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-medium">
                                  {formatHistoryDate(result.submitted_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {result.time_taken ? formatTime(result.time_taken) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
                                  result.score >= 60
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {result.score >= 60 ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Results Yet</h3>
                    <p className="text-gray-500 text-lg mb-6">Take this exam to see your results here!</p>
                    <button
                      onClick={() => setShowExamResultsModal(false)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold"
                    >
                      Start Learning
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => setShowExamResultsModal(false)}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Welcome and Stats Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Welcome back, {user?.name || "Student"}! 👋
              </h1>
              <p className="text-primary-100 text-lg mb-4">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <div className="flex items-center space-x-4">
                <p className="text-primary-100 bg-primary-700 px-4 py-2 rounded-full">
                  Center: {centerSubdomain || centerSlug || "Unknown"}
                </p>
                <button
                  onClick={() => {
                    const allResults = Object.values(examResults).flat();
                    if (allResults.length > 0) {
                      setSelectedExamResults(allResults);
                      setSelectedExamTitle("All Exams");
                      setSelectedTeacherName("");
                      setSelectedSubject("");
                      setShowExamResultsModal(true);
                    } else {
                      toast.info("You haven't taken any exams yet");
                    }
                  }}
                  className="flex items-center text-sm bg-white text-primary-600 px-5 py-2 rounded-full hover:bg-gray-100 font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg"
                >
                  <History className="w-4 h-4 mr-2" />
                  View All Results
                </button>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.totalExamsTaken}</div>
                <div className="text-sm text-primary-100">Exams Taken</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
                <div className="text-sm text-primary-100">Average Score</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.streakDays} 🔥</div>
                <div className="text-sm text-primary-100">Day Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's lessons */}
          <div className="bg-white rounded-xl shadow-card p-6 flex flex-col h-full border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Today's Lessons</h2>
            </div>
            {upcomingLessons.length > 0 ? (
              <div className="space-y-4 flex-grow">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900">{lesson.title}</p>
                      {lesson.isLive && (
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-600 mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {lesson.time}
                    </p>
                    <p className="text-sm text-gray-600">{lesson.teacher}</p>
                    {lesson.subject && (
                      <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {lesson.subject}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">No lessons scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Enjoy your free time!</p>
              </div>
            )}
          </div>

          {/* Pending assignments */}
          <div className="bg-white rounded-xl shadow-card p-6 flex flex-col h-full border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pending Assignments</h2>
            </div>
            {pendingAssignments.length > 0 ? (
              <div className="space-y-4 flex-grow">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900">{assignment.title}</p>
                      <div className="flex items-center">
                        {getIconForPriority(assignment.priority)}
                      </div>
                    </div>
                    <p className="text-sm text-red-600 mb-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Due {assignment.dueDate}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{assignment.course}</span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        assignment.status === 'overdue' 
                          ? 'bg-red-100 text-red-800'
                          : assignment.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No pending assignments</p>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          <div className="bg-white rounded-xl shadow-card p-6 flex flex-col h-full border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Study Suggestions</h2>
            </div>
            {aiSuggestions.length > 0 ? (
              <div className="space-y-4 flex-grow">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIconForSuggestion(sug.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-gray-900">{sug.title}</p>
                          {getIconForPriority(sug.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{sug.reason}</p>
                        {sug.action && (
                          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                            {sug.action} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">No suggestions available</p>
                <p className="text-sm text-gray-400 mt-1">Complete more activities to get suggestions</p>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-card p-6 flex flex-col h-full border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Achievements</h2>
            </div>
            {recentAchievements.length > 0 ? (
              <div className="space-y-4 flex-grow">
                {recentAchievements.map((ach) => (
                  <div key={ach.id} className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-gray-900">{ach.title}</p>
                          <span className="text-sm font-semibold text-yellow-700">+{ach.points} pts</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{ach.description}</p>
                        <p className="text-xs text-gray-500">{ach.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-8">
                <Star className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">No achievements yet</p>
                <p className="text-sm text-gray-400 mt-1">Start learning to earn achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscriptions section */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Learning Content</h2>
              <p className="text-gray-600 mt-2">Access videos, exams, and materials from your subscriptions</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-5 py-2 rounded-full font-medium transition-all ${
                    activeTab === 'videos'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Video className="w-4 h-4 inline mr-2" />
                  Videos
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`px-5 py-2 rounded-full font-medium transition-all ${
                    activeTab === 'materials'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <File className="w-4 h-4 inline mr-2" />
                  Materials
                </button>
                <button
                  onClick={() => setActiveTab('exams')}
                  className={`px-5 py-2 rounded-full font-medium transition-all ${
                    activeTab === 'exams'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Exams
                </button>
              </div>
              <button
                onClick={() => setShowVideosPanel(!showVideosPanel)}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                {showVideosPanel ? "Hide Content" : "Show Content"}
              </button>
            </div>
          </div>

          {subscriptionsData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Subscriptions Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You have no subscriptions yet. Please subscribe to a teacher to access their courses, videos and exams.
              </p>
              <button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg">
                Browse Teachers
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {subscriptionsData.map((sub) => {
                const status = computeSubscriptionStatus(sub);
                const isExpired = status === "expired";

                return (
                  <div key={sub.id} className="border-2 border-gray-100 rounded-2xl p-8 hover:border-primary-100 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
                      <div className="flex items-start space-x-6">
                        {sub.teacher?.image_url ? (
                          <img
                            src={sub.teacher.image_url}
                            alt={sub.teacher.full_name}
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                            {sub.teacher?.full_name?.charAt(0) || "T"}
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {sub.teacher?.full_name || "Unknown Teacher"}
                          </h3>
                          <p className="text-gray-600 mt-2">
                            {sub.teacher?.subject && (
                              <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mr-3">
                                {sub.teacher.subject}
                              </span>
                            )}
                            {sub.center_wide && (
                              <span className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                                Center Wide Access
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-4">
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Subscription:</span> {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                            </p>
                            <p
                              className={`text-sm font-semibold px-4 py-1 rounded-full ${
                                status === "expired"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : status === "inactive"
                                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }`}
                            >
                              {status.toUpperCase()}
                            </p>
                            {sub.teacher?.rating && (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-medium">{sub.teacher.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-0">
                        {sub.teacher?.bio && (
                          <p className="text-gray-600 italic">"{sub.teacher.bio}"</p>
                        )}
                      </div>
                    </div>

                    {showVideosPanel && (
                      <div className="space-y-12">
                        {/* Videos Section */}
                        {activeTab === 'videos' && (
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-xl font-bold text-gray-900">
                                Video Courses ({sub.videosWithExams.length})
                              </h4>
                              <span className="text-sm text-gray-500">
                                Total Duration: {sub.videosWithExams.reduce((sum, video) => sum + (video.duration || 0), 0)} min
                              </span>
                            </div>

                            {isExpired ? (
                              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center">
                                  <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                                  <div>
                                    <p className="text-red-700 font-semibold">
                                      ⚠️ Your subscription has expired. Please renew to access all content.
                                    </p>
                                    <p className="text-red-600 text-sm mt-1">
                                      You can view your exam history but cannot take new exams or watch videos.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : sub.videosWithExams.length > 0 ? (
                              <div className="space-y-6">
                                {sub.videosWithExams.map((video) => (
                                  <div key={video.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-primary-100 transition-all">
                                    <div 
                                      className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all"
                                      onClick={() => handleVideoPlay(video.id)}
                                    >
                                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start space-x-6">
                                          <div className="relative">
                                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                                              <Play className="w-8 h-8 text-white" />
                                            </div>
                                            {video.duration && (
                                              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                              <h5 className="text-xl font-bold text-gray-900">{video.title}</h5>
                                              <div className="flex items-center space-x-2">
                                                {video.view_count !== undefined && (
                                                  <span className="text-sm text-gray-500 flex items-center">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    {video.view_count}
                                                  </span>
                                                )}
                                                {video.exams.length > 0 && (
                                                  <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                                                    {video.exams.length} exam(s)
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            {video.description && (
                                              <p className="text-gray-600 mt-3 line-clamp-2">{video.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-4 mt-4">
                                              <p className="text-sm text-gray-500">
                                                Uploaded: {formatDateTime(video.uploaded_at)}
                                              </p>
                                              {video.category && (
                                                <span className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                                                  {video.category}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mt-4 lg:mt-0 lg:ml-4">
                                          <button className="text-primary-600 hover:text-primary-700 font-semibold flex items-center">
                                            {activeVideo === video.id ? 'Hide Video' : 'Watch Video'}
                                            {activeVideo === video.id ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Video Player */}
                                    {activeVideo === video.id && (
                                      <div className="p-6 bg-gradient-to-br from-gray-900 to-black">
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                                          {videoLoading[video.id] ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-6"></div>
                                              <p className="text-white text-lg">Loading video from Supabase...</p>
                                              <p className="text-gray-400 text-sm mt-2">This may take a moment</p>
                                            </div>
                                          ) : videoErrors[video.id] ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                              <Video className="w-20 h-20 text-red-500 mb-6" />
                                              <p className="text-white text-xl font-semibold mb-3">Video Not Available</p>
                                              <p className="text-gray-300 mb-6 max-w-md">{videoErrors[video.id]}</p>
                                              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                                                <p className="text-gray-300 text-sm mb-4">URL in database: {video.video_url?.substring(0, 100)}...</p>
                                                <div className="text-left">
                                                  <p className="text-gray-400 text-sm font-medium mb-2">Please make sure:</p>
                                                  <ul className="text-gray-400 text-sm space-y-1">
                                                    <li className="flex items-center">
                                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                      Video exists in Supabase Storage bucket "videos"
                                                    </li>
                                                    <li className="flex items-center">
                                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                      Video has correct public URL format
                                                    </li>
                                                    <li className="flex items-center">
                                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                      Video file is MP4 or WebM format
                                                    </li>
                                                  </ul>
                                                </div>
                                              </div>
                                            </div>
                                          ) : videoSources[video.id] ? (
                                            <video
                                              key={`video-${video.id}`}
                                              ref={el => videoRefs.current[video.id] = el}
                                              src={videoSources[video.id]}
                                              title={video.title}
                                              className="absolute inset-0 w-full h-full"
                                              controls
                                              controlsList="nodownload"
                                              playsInline
                                              preload="metadata"
                                              onError={(e) => handleVideoError(video.id, e)}
                                              onLoadedData={() => handleVideoLoad(video.id)}
                                              onCanPlay={() => console.log(`✅ Video ready to play: ${video.title}`)}
                                            >
                                              Your browser does not support the video tag.
                                            </video>
                                          ) : !video.video_url ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                              <Video className="w-20 h-20 text-yellow-500 mb-6" />
                                              <p className="text-white text-xl font-semibold mb-3">No Video URL</p>
                                              <p className="text-gray-300 text-lg">This video doesn't have a URL in the database.</p>
                                            </div>
                                          ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                              <Loader className="w-12 h-12 animate-spin text-white mb-6" />
                                              <p className="text-white text-lg">Preparing video...</p>
                                            </div>
                                          )}
                                          
                                          {/* Video Controls Overlay */}
                                          {videoSources[video.id] && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                              <div className="flex justify-between items-center">
                                                <div>
                                                  <p className="text-white text-xl font-semibold">{video.title}</p>
                                                  <p className="text-gray-300 text-sm">Playing from Supabase Storage • Direct stream</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                  {video.duration && (
                                                    <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                                                      Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Exams for this Video */}
                                    {video.exams.length > 0 && (
                                      <div className="border-t border-gray-100">
                                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                          <h6 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <FileText className="w-5 h-5 mr-3 text-blue-600" />
                                            Exams for this video ({video.exams.length})
                                          </h6>
                                          <div className="space-y-6">
                                            {video.exams.map((exam) => {
                                              const highestScore = getHighestScore(exam.id);
                                              const latestResult = getLatestResult(exam.id);
                                              const averageScore = getAverageScore(exam.id);
                                              const resultsCount = examResults[exam.id]?.length || 0;
                                              const teacherInfo = sub.teacher;
                                              
                                              return (
                                                <div key={exam.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="flex-1">
                                                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                                        <div className="flex items-center space-x-3 mb-3 lg:mb-0">
                                                          <p className="text-xl font-bold text-gray-900">{exam.title}</p>
                                                          {highestScore > 0 && highestScore >= (exam.passing_score || 60) && (
                                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                                          )}
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                          <button
                                                            onClick={() => handleShowExamResults(
                                                              exam.id, 
                                                              exam.title, 
                                                              teacherInfo?.full_name || "Unknown Teacher",
                                                              teacherInfo?.subject || ""
                                                            )}
                                                            className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-semibold"
                                                          >
                                                            <History className="w-4 h-4 mr-2" />
                                                            Results ({resultsCount})
                                                          </button>
                                                        </div>
                                                      </div>
                                                      
                                                      {exam.description && (
                                                        <p className="text-gray-600 mb-4">{exam.description}</p>
                                                      )}
                                                      
                                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        {exam.total_marks && (
                                                          <div className="bg-gray-50 p-3 rounded-lg">
                                                            <div className="text-sm text-gray-500">Total Marks</div>
                                                            <div className="text-lg font-bold text-gray-900">{exam.total_marks}</div>
                                                          </div>
                                                        )}
                                                        {exam.duration_minutes && (
                                                          <div className="bg-gray-50 p-3 rounded-lg">
                                                            <div className="text-sm text-gray-500">Duration</div>
                                                            <div className="text-lg font-bold text-gray-900 flex items-center">
                                                              <Clock className="w-4 h-4 mr-2" />
                                                              {exam.duration_minutes} min
                                                            </div>
                                                          </div>
                                                        )}
                                                        {exam.questions_count && (
                                                          <div className="bg-gray-50 p-3 rounded-lg">
                                                            <div className="text-sm text-gray-500">Questions</div>
                                                            <div className="text-lg font-bold text-gray-900">{exam.questions_count}</div>
                                                          </div>
                                                        )}
                                                        {exam.passing_score && (
                                                          <div className="bg-gray-50 p-3 rounded-lg">
                                                            <div className="text-sm text-gray-500">Passing Score</div>
                                                            <div className="text-lg font-bold text-gray-900">{exam.passing_score}%</div>
                                                          </div>
                                                        )}
                                                      </div>
                                                      
                                                      {/* Results Summary */}
                                                      {resultsCount > 0 && (
                                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Performance</h4>
                                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                                              <div className="text-sm text-green-600 font-medium">Latest</div>
                                                              <div className={`text-2xl font-bold ${
                                                                latestResult?.score! >= (exam.passing_score || 60) ? 'text-green-700' : 'text-red-700'
                                                              }`}>
                                                                {latestResult?.score}%
                                                              </div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                                              <div className="text-sm text-blue-600 font-medium">Highest</div>
                                                              <div className="text-2xl font-bold text-blue-700">{highestScore}%</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                                              <div className="text-sm text-purple-600 font-medium">Average</div>
                                                              <div className="text-2xl font-bold text-purple-700">{averageScore}%</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                                              <div className="text-sm text-gray-600 font-medium">Attempts</div>
                                                              <div className="text-2xl font-bold text-gray-700">{resultsCount}</div>
                                                            </div>
                                                          </div>
                                                          {latestResult && (
                                                            <div className="mt-4 text-sm text-gray-500">
                                                              Last attempt: {formatHistoryDate(latestResult.submitted_at)}
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col space-y-3">
                                                      <button
                                                        onClick={() => handleStartExam(
                                                          exam.id, 
                                                          exam.title, 
                                                          sub.teacher_id, 
                                                          teacherInfo?.full_name || "Unknown Teacher",
                                                          teacherInfo?.subject,
                                                          exam.exam_questions || []
                                                        )}
                                                        className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all ${
                                                          resultsCount > 0
                                                            ? 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white'
                                                            : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
                                                        }`}
                                                      >
                                                        {resultsCount > 0 ? 'Retake Exam' : 'Start Exam'}
                                                      </button>
                                                      {resultsCount > 0 && (
                                                        <button
                                                          onClick={() => {
                                                            // This would open a detailed view of the exam with explanations
                                                            toast.success("Detailed view coming soon!");
                                                          }}
                                                          className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                                        >
                                                          Review Answers
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <Video className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                                <p className="text-gray-500 text-lg">No videos available for this subscription</p>
                                <p className="text-gray-400 mt-2">Check back later for new content</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Materials Section */}
                        {activeTab === 'materials' && (
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-6">
                              Study Materials ({sub.materials.length})
                            </h4>

                            {isExpired ? (
                              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center">
                                  <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                                  <p className="text-red-700 font-semibold">
                                    ⚠️ Your subscription has expired. Please renew to access materials.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {sub.materials.length > 0 ? (
                                  sub.materials.map((material) => (
                                    <div key={material.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-primary-200 transition-all hover:shadow-lg">
                                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start space-x-6">
                                          <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                              <File className="w-8 h-8 text-white" />
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="text-xl font-bold text-gray-900 mb-2">{material.title}</h5>
                                            {material.description && (
                                              <p className="text-gray-600 mb-4 line-clamp-2">{material.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-4">
                                              <p className="text-sm text-gray-500">
                                                Uploaded: {formatDateTime(material.uploaded_at)}
                                              </p>
                                              {material.file_type && (
                                                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                  {material.file_type}
                                                </span>
                                              )}
                                              {material.file_size && (
                                                <span className="text-sm text-gray-600">
                                                  Size: {formatFileSize(material.file_size)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mt-4 lg:mt-0">
                                          <button
                                            onClick={() => handleDownloadMaterial(material.file_url, material.title)}
                                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                          >
                                            <Download className="w-5 h-5 mr-2" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-12">
                                    <File className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                                    <p className="text-gray-500 text-lg">No study materials available</p>
                                    <p className="text-gray-400 mt-2">Your teacher will upload materials soon</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Exams Only Section */}
                        {activeTab === 'exams' && (
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-6">
                              All Exams
                            </h4>
                            
                            {isExpired ? (
                              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center">
                                  <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                                  <p className="text-red-700 font-semibold">
                                    ⚠️ Your subscription has expired. Exam access requires active subscription.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const allExams = sub.videosWithExams.flatMap(video => 
                                    video.exams.map(exam => ({
                                      ...exam,
                                      videoTitle: video.title,
                                      videoId: video.id
                                    }))
                                  );
                                  
                                  if (allExams.length === 0) {
                                    return (
                                      <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                                        <p className="text-gray-500 text-lg">No exams available</p>
                                        <p className="text-gray-400 mt-2">Exams will be available with video courses</p>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {allExams.map((exam) => {
                                        const resultsCount = examResults[exam.id]?.length || 0;
                                        const latestResult = getLatestResult(exam.id);
                                        const highestScore = getHighestScore(exam.id);
                                        const teacherInfo = sub.teacher;
                                        
                                        return (
                                          <div key={exam.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:border-primary-200 hover:shadow-xl transition-all">
                                            <div className="mb-4">
                                              <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-lg font-bold text-gray-900">{exam.title}</h5>
                                                {resultsCount > 0 && (
                                                  <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                                                    {resultsCount} attempt(s)
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-sm text-gray-600 mb-1">From video: {exam.videoTitle}</p>
                                              {exam.description && (
                                                <p className="text-gray-600 text-sm line-clamp-2">{exam.description}</p>
                                              )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-xs text-gray-500">Questions</div>
                                                <div className="text-lg font-bold text-gray-900">{exam.questions_count || 0}</div>
                                              </div>
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-xs text-gray-500">Duration</div>
                                                <div className="text-lg font-bold text-gray-900 flex items-center">
                                                  <Clock className="w-4 h-4 mr-1" />
                                                  {exam.duration_minutes || 30}m
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {resultsCount > 0 && (
                                              <div className="mb-6">
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-sm font-medium text-gray-700">Latest Score:</span>
                                                  <span className={`text-lg font-bold ${
                                                    latestResult?.score! >= (exam.passing_score || 60) ? 'text-green-600' : 'text-red-600'
                                                  }`}>
                                                    {latestResult?.score}%
                                                  </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                  <div 
                                                    className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                                                    style={{ width: `${latestResult?.score || 0}%` }}
                                                  ></div>
                                                </div>
                                              </div>
                                            )}
                                            
                                            <div className="flex space-x-3">
                                              <button
                                                onClick={() => handleStartExam(
                                                  exam.id, 
                                                  exam.title, 
                                                  sub.teacher_id, 
                                                  teacherInfo?.full_name || "Unknown Teacher",
                                                  teacherInfo?.subject,
                                                  exam.exam_questions || []
                                                )}
                                                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-semibold text-center"
                                              >
                                                {resultsCount > 0 ? 'Retake Exam' : 'Start Exam'}
                                              </button>
                                              <button
                                                onClick={() => handleShowExamResults(
                                                  exam.id, 
                                                  exam.title, 
                                                  teacherInfo?.full_name || "Unknown Teacher",
                                                  teacherInfo?.subject || ""
                                                )}
                                                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-semibold text-center"
                                              >
                                                View Results
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
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

        {/* Course Progress Section */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Progress</h2>
          {courseProgress.length > 0 ? (
            <div className="space-y-6">
              {courseProgress.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-xl p-6 hover:border-primary-200 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                      <p className="text-gray-600 mt-1">
                        {course.teacherName && (
                          <span className="mr-4">Teacher: {course.teacherName}</span>
                        )}
                        {course.subject && (
                          <span className="text-primary-600 bg-primary-50 px-3 py-1 rounded-full text-sm">
                            {course.subject}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mt-4 lg:mt-0">
                      <span className="text-2xl font-bold text-primary-600">{course.progress}%</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{course.completedModules} of {course.totalModules} modules completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {course.lastAccessed && `Last accessed: ${course.lastAccessed}`}
                    </p>
                    <button className="text-primary-600 hover:text-primary-700 font-semibold">
                      Continue Learning →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-lg">No courses in progress</p>
              <p className="text-gray-400 mt-2">Start a course to track your progress</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
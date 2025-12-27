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

interface VideoWithExams {
  id: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  uploaded_at?: string | null;
  exams: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    total_marks?: number | null;
    created_at?: string | null;
    duration_minutes?: number | null;
    questions_count?: number | null;
    exam_questions?: Array<{
      id: string;
      question_text: string;
      exam_options: Array<{
        id: string;
        option_text: string;
        is_correct: boolean;
      }>;
    }>;
  }>;
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
    subject?: string | null;
    image_url?: string | null;
    center_id?: string | null;
  } | null;
  videosWithExams: VideoWithExams[];
  materials: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    uploaded_at?: string | null;
  }>;
}

// Interface for active exam
interface ActiveExamState {
  examId: string;
  examTitle: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  questions: Array<{
    id: string;
    question_text: string;
    exam_options: Array<{
      id: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }>;
  currentQuestionIndex: number;
  userAnswers: { [questionId: string]: string };
  timeRemaining: number;
  totalTime: number;
  isSubmitted: boolean;
  score?: number;
}

// Interface for exam result
interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
  exam?: {
    title: string;
    teacher_id: string;
    teacher?: {
      full_name: string;
      subject?: string;
    };
  };
}

// Function to extract YouTube Video ID
const extractYouTubeVideoId = (url: string | null): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Function to get public URL from Supabase Storage
const getPublicVideoUrl = (videoUrl: string | null): string | null => {
  if (!videoUrl) return null;
  
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  
  const supabaseUrl = "https://biqzcfbcsflriybyvtur.supabase.co";
  
  if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov')) {
    let filename = videoUrl;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      filename = parts[parts.length - 1];
    }
    
    return `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
  }
  
  if (videoUrl.startsWith('videos/')) {
    const filename = videoUrl.replace('videos/', '');
    return `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
  }
  
  if (videoUrl.includes('storage/v1/object')) {
    if (videoUrl.includes('/storage/v1/object/')) {
      const parts = videoUrl.split('/storage/v1/object/');
      if (parts.length > 1) {
        const [domain, path] = parts;
        return `${domain}/storage/v1/object/public/${path}`;
      }
    }
  }
  
  return `${supabaseUrl}/storage/v1/object/public/videos/${videoUrl}`;
};

// Function to get proper video URL based on source
const getVideoUrl = (videoUrl: string | null): { url: string | null; type: 'youtube' | 'supabase' | 'direct' | 'unknown' } => {
  if (!videoUrl) return { url: null, type: 'unknown' };
  
  const youtubeId = extractYouTubeVideoId(videoUrl);
  if (youtubeId) {
    return { 
      url: youtubeId, 
      type: 'youtube' 
    };
  }
  
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return { url: videoUrl, type: 'direct' };
  }
  
  const supabaseUrl = getPublicVideoUrl(videoUrl);
  return { url: supabaseUrl, type: 'supabase' };
};

// Function to create secure YouTube embed URL - إعدادات لإخفاء كل شيء
const getYouTubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    'autoplay': '1',
    'playsinline': '1',
    'controls': '1',
    'disablekb': '1', // تعطيل مفاتيح لوحة المفاتيح
    'fs': '0', // إخفاء زر ملء الشاشة
    'modestbranding': '1', // تقليل الشعار
    'rel': '0', // إخفاء الفيديوهات المقترحة
    'showinfo': '0', // إخفاء معلومات الفيديو
    'iv_load_policy': '3', // إخفاء التعليقات التوضيحية
    'cc_load_policy': '0', // إخفاء الترجمة
    'enablejsapi': '0', // تعطيل JavaScript API
    'origin': window.location.origin,
    'widget_referrer': window.location.origin,
    'playsinline': '1',
    'color': 'white',
    'theme': 'dark',
    'autohide': '1', // إخفاء عناصر التحكم تلقائياً
    'hl': 'en', // لغة الواجهة
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
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

  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<{[key: string]: ExamResult[]}>({});
  
  // Active exam state
  const [activeExam, setActiveExam] = useState<ActiveExamState | null>(null);
  const [examTimer, setExamTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Exam results modal state
  const [showExamResultsModal, setShowExamResultsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState<ExamResult[]>([]);
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [selectedTeacherName, setSelectedTeacherName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Video loading states
  const [videoLoading, setVideoLoading] = useState<{[key: string]: boolean}>({});
  const [videoErrors, setVideoErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (!centerSlug) return;

      try {
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
        const { data, error } = await supabase
          .from("exam_results")
          .select(`
            id,
            exam_id,
            student_id,
            score,
            submitted_at,
            exam:exams(
              title,
              teacher_id,
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

        const groupedResults: {[key: string]: ExamResult[]} = {};
        data?.forEach(result => {
          if (!groupedResults[result.exam_id]) {
            groupedResults[result.exam_id] = [];
          }
          groupedResults[result.exam_id].push(result);
        });

        setExamResults(groupedResults);
      } catch (error) {
        console.error("🚨 Error fetching exam results:", error);
      }
    };

    fetchExamResults();
  }, [user, activeExam]);

  useEffect(() => {
    const fetchSubscriptionsAndContent = async () => {
      try {
        if (!user) {
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

        // 2️⃣ إذا كان هناك اشتراكات، جلب المحتوى المرتبط
        if (subs && subs.length > 0) {
          const teacherIds = subs.map((s: any) => s.teacher_id);
          const uniqueTeacherIds = [...new Set(teacherIds)];

          const isCenterWide = subs.some((s: any) => s.center_wide === true);

          // جلب بيانات المدرسين
          const { data: teachersData } = await supabase
            .from("teachers")
            .select("id, full_name, email, subject, image_url, center_id")
            .in("id", uniqueTeacherIds);

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

          // 3️⃣ جلب المحتوى بناءً على نوع الاشتراك
          if (isCenterWide && centerId) {
            // اشتراك شامل - جلب كل محتوى السنتر
            const { data: centerTeachers } = await supabase
              .from("teachers")
              .select("id")
              .eq("center_id", centerId);

            if (centerTeachers && centerTeachers.length > 0) {
              const centerTeacherIds = centerTeachers.map(t => t.id);

              // جلب الفيديوهات مع الامتحانات المرتبطة
              const { data: videosData } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (videosData && videosData.length > 0) {
                const videoIds = videosData.map(v => v.id);
                
                // جلب الامتحانات
                const { data: exams } = await supabase
                  .from('exams')
                  .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                  .in('video_id', videoIds);

                if (exams) {
                  const examsWithQuestions = await Promise.all(
                    exams.map(async (exam) => {
                      const { data: questions } = await supabase
                        .from('exam_questions')
                        .select('id, question_text, exam_id')
                        .eq('exam_id', exam.id);

                      const questionsWithOptions = await Promise.all(
                        questions?.map(async (question) => {
                          const { data: options } = await supabase
                            .from('exam_options')
                            .select('id, option_text, is_correct, question_id')
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
                    })
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

              // جلب المواد الدراسية
              const { data: materialsData } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (materialsData) {
                subsWithContent.forEach(sub => {
                  sub.materials = materialsData || [];
                });
              }
            }
          } else {
            // اشتراك عادي - جلب محتوى المدرسين المحددين فقط
            const { data: videosData } = await supabase
              .from("videos")
              .select("id, teacher_id, title, description, video_url, uploaded_at")
              .in("teacher_id", uniqueTeacherIds);

            if (videosData && videosData.length > 0) {
              const videoIds = videosData.map(v => v.id);
              
              const { data: exams } = await supabase
                .from('exams')
                .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                .in('video_id', videoIds)
                .in('teacher_id', uniqueTeacherIds);

              if (exams) {
                const examsWithQuestions = await Promise.all(
                  exams.map(async (exam) => {
                    const { data: questions } = await supabase
                      .from('exam_questions')
                      .select('id, question_text, exam_id')
                      .eq('exam_id', exam.id);

                    const questionsWithOptions = await Promise.all(
                      questions?.map(async (question) => {
                        const { data: options } = await supabase
                          .from('exam_options')
                          .select('id, option_text, is_correct, question_id')
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
                  })
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

            // جلب المواد الدراسية
            const { data: materialsData } = await supabase
              .from("materials")
              .select("id, teacher_id, title, description, file_url, uploaded_at")
              .in("teacher_id", uniqueTeacherIds);

            if (materialsData) {
              subsWithContent.forEach(sub => {
                sub.materials = materialsData ? materialsData.filter(material => material.teacher_id === sub.teacher_id) : [];
              });
            }
          }

          setSubscriptionsData(subsWithContent);
        } else {
          setSubscriptionsData([]);
        }

        // بيانات تجريبية للداشبورد
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

      } catch (error) {
        console.error("🚨 Unexpected error in dashboard:", error);
        toast.error("Failed to load dashboard data");

        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
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
      score: undefined
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
    toast.success(`Exam "${examTitle}" started!`);
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

    let correctAnswers = 0;
    const totalQuestions = activeExam.questions.length;

    activeExam.questions.forEach(question => {
      const userAnswer = activeExam.userAnswers[question.id];
      if (userAnswer) {
        const selectedOption = question.exam_options.find(opt => opt.id === userAnswer);
        if (selectedOption && selectedOption.is_correct) {
          correctAnswers++;
        }
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const submittedAt = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("exam_results")
        .insert({
          exam_id: activeExam.examId,
          student_id: user.id,
          score: score,
          submitted_at: submittedAt
        })
        .select();

      if (error) {
        console.error("❌ Error saving exam result:", error);
        toast.error("Failed to save exam result");
        throw error;
      }

      const newResult: ExamResult = {
        id: data[0].id,
        exam_id: activeExam.examId,
        student_id: user.id,
        score: score,
        submitted_at: submittedAt,
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

      toast.success(`Exam submitted! Your score: ${score}%`);

    } catch (error) {
      console.error("🚨 Error submitting exam:", error);
      toast.error("Failed to submit exam");
    }

    setActiveExam(prev => prev ? { ...prev, isSubmitted: true, score } : null);
  };

  const handleCancelExam = () => {
    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }
    setActiveExam(null);
    toast.success("Exam cancelled");
  };

  const handleShowExamResults = (examId: string, examTitle: string, teacherName: string, subject: string = "") => {
    const results = examResults[examId] || [];
    setSelectedExamResults(results);
    setSelectedExamTitle(examTitle);
    setSelectedTeacherName(teacherName);
    setSelectedSubject(subject);
    setShowExamResultsModal(true);
  };

  const handleDownloadMaterial = (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      toast.error("No file available for download");
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${title}`);
  };

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(activeVideo === videoId ? null : videoId);
    
    if (activeVideo !== videoId) {
      setVideoLoading(prev => ({ ...prev, [videoId]: true }));
      setVideoErrors(prev => ({ ...prev, [videoId]: "" }));
      
      setTimeout(() => {
        setVideoLoading(prev => ({ ...prev, [videoId]: false }));
      }, 500);
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
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      {/* Modal for active exam */}
      {activeExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Exam Header */}
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeExam.examTitle}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Time: {formatTime(activeExam.timeRemaining)}</span>
                  </div>
                  <div>
                    Question {activeExam.currentQuestionIndex + 1} of {activeExam.questions.length}
                  </div>
                  <div>
                    Answered: {Object.keys(activeExam.userAnswers).length} / {activeExam.questions.length}
                  </div>
                </div>
                {activeExam.teacherName && (
                  <div className="text-sm mt-1 opacity-90">
                    Teacher: {activeExam.teacherName} {activeExam.subject && ` | Subject: ${activeExam.subject}`}
                  </div>
                )}
              </div>
              <button
                onClick={handleCancelExam}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Cancel Exam
              </button>
            </div>

            {/* Exam Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!activeExam.isSubmitted ? (
                <>
                  {/* Current Question */}
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6 border border-primary-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {activeExam.currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
                            {activeExam.questions[activeExam.currentQuestionIndex]?.question_text}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      {activeExam.questions[activeExam.currentQuestionIndex]?.exam_options.map((option, index) => {
                        const questionId = activeExam.questions[activeExam.currentQuestionIndex].id;
                        const isSelected = activeExam.userAnswers[questionId] === option.id;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleSelectAnswer(questionId, option.id)}
                            className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50 shadow-primary-100 ring-2 ring-primary-200'
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
                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={activeExam.currentQuestionIndex === 0}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        activeExam.currentQuestionIndex === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleSubmitExam}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                      >
                        Submit Exam
                      </button>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      disabled={activeExam.currentQuestionIndex === activeExam.questions.length - 1}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        activeExam.currentQuestionIndex === activeExam.questions.length - 1
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>

                  {/* Progress Indicators */}
                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2">Questions:</p>
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isCurrent
                                ? 'border-primary-600 bg-primary-100 text-primary-700 font-bold'
                                : isAnswered
                                ? 'border-green-500 bg-green-100 text-green-700'
                                : 'border-gray-300 bg-gray-100 text-gray-700'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Results Screen */
                <div className="text-center py-8">
                  <div className="mb-6">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Exam Submitted Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Your exam has been submitted and your score has been recorded.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-gray-800 mb-4">Exam Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Questions:</span>
                        <span className="font-medium">{activeExam.questions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions Answered:</span>
                        <span className="font-medium">
                          {Object.keys(activeExam.userAnswers).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Taken:</span>
                        <span className="font-medium">
                          {formatTime(activeExam.totalTime - activeExam.timeRemaining)}
                        </span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Your Score:</span>
                          <span className="text-primary-600">
                            {activeExam.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={handleCancelExam}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => handleShowExamResults(activeExam.examId, activeExam.examTitle, activeExam.teacherName, activeExam.subject)}
                      className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-md"
                    >
                      View Results History
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedExamTitle}</h2>
                <div className="text-sm mt-1 opacity-90">
                  Teacher: {selectedTeacherName}
                  {selectedSubject && ` | Subject: ${selectedSubject}`}
                </div>
              </div>
              <button
                onClick={() => setShowExamResultsModal(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exam Results History</h3>
                  <span className="text-sm text-gray-500">
                    {selectedExamResults.length} attempt(s)
                  </span>
                </div>

                {selectedExamResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Highest Score</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {Math.max(...selectedExamResults.map(r => r.score))}%
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Average Score</div>
                        <div className="text-2xl font-bold text-green-700">
                          {Math.round(selectedExamResults.reduce((sum, r) => sum + r.score, 0) / selectedExamResults.length)}%
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Latest Score</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {selectedExamResults[0].score}%
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attempt #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedExamResults.map((result, index) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  Attempt {selectedExamResults.length - index}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-lg font-bold ${
                                  result.score >= 80 ? 'text-green-600' :
                                  result.score >= 60 ? 'text-blue-600' :
                                  result.score >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {result.score}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatHistoryDate(result.submitted_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  result.score >= 60
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.score >= 60 ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                    <p className="text-gray-500">Take this exam to see your results here!</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowExamResultsModal(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`Welcome, ${user?.name || "Student"}`}
          </h1>
          <p className="mt-1 text-gray-500">{new Date().toLocaleDateString()}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-primary-600">Center: {centerSubdomain || centerSlug || "Unknown"}</p>
            <div className="flex items-center space-x-2">
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
                className="flex items-center text-sm bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                <History className="w-4 h-4 mr-2" />
                View All Results
              </button>
            </div>
          </div>
        </div>

        {/* Overview cards */}
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
          </div>
        </div>

        {/* Subscriptions section - المحتوى الرئيسي */}
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
            <div className="space-y-6">
              {subscriptionsData.map((sub) => {
                const status = computeSubscriptionStatus(sub);
                const isExpired = status === "expired";

                return (
                  <div key={sub.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {sub.teacher?.full_name || "Unknown Teacher"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {sub.teacher?.subject && `Subject: ${sub.teacher.subject} • `}
                          Subscription: {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          {sub.center_wide && " (Center Wide)"}
                        </p>
                        <p
                          className={`text-sm font-medium mt-1 ${
                            status === "expired"
                              ? "text-red-600"
                              : status === "inactive"
                              ? "text-gray-500"
                              : "text-green-600"
                          }`}
                        >
                          Status: {status.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {showVideosPanel && (
                      <div className="space-y-8">
                        {/* Videos with Exams Section */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                            Course Content ({sub.videosWithExams.length} Videos)
                          </h4>

                          {isExpired ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-600 font-medium">
                                ⚠️ Your subscription has expired. Please renew to access all content.
                              </p>
                            </div>
                          ) : sub.videosWithExams.length > 0 ? (
                            <div className="space-y-6">
                              {sub.videosWithExams.map((video) => {
                                const videoInfo = getVideoUrl(video.video_url);
                                
                                return (
                                  <div key={video.id} className="border rounded-lg overflow-hidden">
                                    {/* Video Section */}
                                    <div 
                                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() => handleVideoPlay(video.id)}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                          <Play className="w-5 h-5 text-primary-600" />
                                          <div>
                                            <h5 className="font-semibold text-gray-900">{video.title}</h5>
                                            {video.description && (
                                              <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                              Uploaded: {formatDateTime(video.uploaded_at)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {activeVideo === video.id ? 'Hide Video' : 'Show Video'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Video Player */}
                                    {activeVideo === video.id && video.video_url && (
                                      <div className="p-4 bg-black">
                                        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-900">
                                          {videoLoading[video.id] ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="text-white text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                                <p>Loading video...</p>
                                              </div>
                                            </div>
                                          ) : videoErrors[video.id] ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                              <Video className="w-16 h-16 text-red-500 mb-4" />
                                              <p className="text-white text-lg font-semibold mb-2">Video Not Available</p>
                                              <p className="text-gray-300 text-sm mb-4">{videoErrors[video.id]}</p>
                                            </div>
                                          ) : videoInfo.url ? (
                                            <>
                                              {videoInfo.type === 'youtube' ? (
                                                // YouTube iframe with maximum privacy
                                                <div className="absolute inset-0 w-full h-full">
                                                  <iframe
                                                    src={getYouTubeEmbedUrl(videoInfo.url)}
                                                    title={video.title}
                                                    className="absolute inset-0 w-full h-full"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen={false}
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    sandbox="allow-same-origin allow-scripts allow-forms"
                                                    loading="lazy"
                                                    style={{
                                                      pointerEvents: 'auto',
                                                    }}
                                                  ></iframe>
                                                </div>
                                              ) : (
                                                // Direct/MP4 Video Player
                                                <video
                                                  key={`${video.id}-${Date.now()}`}
                                                  src={videoInfo.url}
                                                  title={video.title}
                                                  className="absolute inset-0 w-full h-full"
                                                  controls
                                                  controlsList="nodownload noplaybackrate"
                                                  playsInline
                                                  preload="metadata"
                                                  onError={(e) => {
                                                    setVideoErrors(prev => ({ 
                                                      ...prev, 
                                                      [video.id]: "Failed to load video. Please try again later." 
                                                    }));
                                                  }}
                                                >
                                                  Your browser does not support the video tag.
                                                </video>
                                              )}
                                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                                <p className="text-white text-sm font-medium">{video.title}</p>
                                                <p className="text-gray-300 text-xs">
                                                  {videoInfo.type === 'youtube' ? 'Secure Video Player' : 'Direct Video'}
                                                </p>
                                              </div>
                                            </>
                                          ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                              <Video className="w-16 h-16 text-yellow-500 mb-4" />
                                              <p className="text-white text-lg font-semibold mb-2">No Video Available</p>
                                              <p className="text-gray-300 text-sm">This video is currently unavailable.</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Exams for this Video */}
                                    {video.exams.length > 0 && (
                                      <div className="border-t">
                                        <div className="p-4 bg-blue-50">
                                          <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                            Exams for this video ({video.exams.length})
                                          </h6>
                                          <div className="space-y-3">
                                            {video.exams.map((exam) => {
                                              const highestScore = getHighestScore(exam.id);
                                              const latestResult = getLatestResult(exam.id);
                                              const resultsCount = examResults[exam.id]?.length || 0;
                                              const teacherInfo = sub.teacher;
                                              
                                              return (
                                                <div key={exam.id} className="bg-white rounded-lg p-4 border">
                                                  <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                          <p className="font-medium text-gray-900">{exam.title}</p>
                                                          {highestScore > 0 && (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                          )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                          <button
                                                            onClick={() => handleShowExamResults(
                                                              exam.id, 
                                                              exam.title, 
                                                              teacherInfo?.full_name || "Unknown Teacher",
                                                              teacherInfo?.subject || ""
                                                            )}
                                                            className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                                                          >
                                                            <History className="w-4 h-4 mr-1" />
                                                            Results ({resultsCount})
                                                          </button>
                                                        </div>
                                                      </div>
                                                      
                                                      {exam.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                                                      )}
                                                      
                                                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
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
                                                        {teacherInfo?.subject && (
                                                          <span>Subject: {teacherInfo.subject}</span>
                                                        )}
                                                      </div>
                                                      
                                                      {/* Results Summary */}
                                                      {resultsCount > 0 && latestResult && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                          <div className="flex justify-between items-center">
                                                            <div>
                                                              <span className="text-sm text-gray-600">Latest: </span>
                                                              <span className={`text-sm font-medium ${
                                                                latestResult.score >= 60 ? 'text-green-600' : 'text-red-600'
                                                              }`}>
                                                                {latestResult.score}%
                                                              </span>
                                                              <span className="text-xs text-gray-500 ml-2">
                                                                ({formatDate(latestResult.submitted_at)})
                                                              </span>
                                                            </div>
                                                            <div>
                                                              <span className="text-sm text-gray-600">Highest: </span>
                                                              <span className={`text-sm font-bold ${
                                                                highestScore >= 60 ? 'text-green-600' : 'text-red-600'
                                                              }`}>
                                                                {highestScore}%
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="ml-4 flex flex-col space-y-2">
                                                      <button
                                                        onClick={() => handleStartExam(
                                                          exam.id, 
                                                          exam.title, 
                                                          sub.teacher_id, 
                                                          teacherInfo?.full_name || "Unknown Teacher",
                                                          teacherInfo?.subject,
                                                          exam.exam_questions || []
                                                        )}
                                                        className={`px-4 py-2 rounded-md whitespace-nowrap ${
                                                          resultsCount > 0
                                                            ? 'bg-secondary-600 text-white hover:bg-secondary-700'
                                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                                        }`}
                                                      >
                                                        {resultsCount > 0 ? 'Retake Exam' : 'Start Exam'}
                                                      </button>
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
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No videos available for this subscription</p>
                          )}
                        </div>

                        {/* Materials Section */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                            Study Materials ({sub.materials.length})
                          </h4>

                          {isExpired ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-600 font-medium">
                                ⚠️ Your subscription has expired. Please renew to access materials.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {sub.materials.length > 0 ? (
                                sub.materials.map((material) => (
                                  <div key={material.id} className="border rounded p-4 bg-gray-50 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-900">{material.title}</p>
                                      {material.description && (
                                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">
                                        Uploaded: {formatDateTime(material.uploaded_at)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadMaterial(material.file_url, material.title)}
                                      className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 text-center py-4">No study materials available</p>
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

        {/* Other dashboard sections */}
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
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
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
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
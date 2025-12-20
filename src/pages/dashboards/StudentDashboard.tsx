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

// Function to convert YouTube URLs to direct video stream URL
function getDirectVideoUrl(url: string | null): string {
  if (!url) return "";
  
  // If it's already a direct video file, return as is
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi')) {
    return url;
  }
  
  // If it's a YouTube URL, convert to embed that hides YouTube interface
  if (url.includes("youtu.be") || url.includes("youtube.com")) {
    let videoId = "";
    
    if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1].split("?")[0];
    }
    
    if (videoId) {
      // Use YouTube embed with parameters to hide controls and related videos
      return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&showinfo=0&fs=1&iv_load_policy=3&disablekb=1`;
    }
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
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<{[key: string]: any}>({});
  
  // Active exam state
  const [activeExam, setActiveExam] = useState<ActiveExamState | null>(null);
  const [examTimer, setExamTimer] = useState<NodeJS.Timeout | null>(null);

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
        console.log("📋 Step 1: Fetching subscriptions for student:", user.id);
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
          const uniqueTeacherIds = [...new Set(teacherIds)];
          
          console.log("👨‍🏫 Teacher IDs from subscriptions:", uniqueTeacherIds);

          const isCenterWide = subs.some((s: any) => s.center_wide === true);
          console.log("🎯 Is center-wide subscription:", isCenterWide);

          // جلب بيانات المدرسين
          console.log("👨‍🏫 Step 2: Fetching teachers data");
          const { data: teachersData, error: teachersError } = await supabase
            .from("teachers")
            .select("id, full_name, email, subject, image_url, center_id")
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
            videosWithExams: [],
            materials: [],
          }));

          console.log("📦 Initial subscriptions with content structure:", subsWithContent);

          // 3️⃣ جلب المحتوى بناءً على نوع الاشتراك
          if (isCenterWide && centerId) {
            // اشتراك شامل - جلب كل محتوى السنتر
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

              // جلب الفيديوهات مع الامتحانات المرتبطة
              console.log("🎥 Fetching videos with exams for center teachers");
              const { data: videosData, error: videosError } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (videosError) {
                console.error("❌ Videos fetch error:", videosError);
              } else {
                console.log("✅ Center videos found:", videosData?.length || 0);
                
                // جلب الامتحانات المرتبطة بالفيديوهات
                if (videosData && videosData.length > 0) {
                  const videoIds = videosData.map(v => v.id);
                  
                  // 1️⃣ جلب الامتحانات فقط
                  console.log("📝 Fetching exams for videos");
                  const { data: exams, error: examsError } = await supabase
                    .from('exams')
                    .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                    .in('video_id', videoIds);

                  if (examsError) {
                    console.error("❌ Exams fetch error:", examsError);
                  } else {
                    console.log("✅ Exams found:", exams?.length || 0);
                    
                    // 2️⃣ لكل امتحان، جلب الأسئلة والاختيارات
                    const examsWithQuestions = await Promise.all(
                      exams?.map(async (exam) => {
                        // جلب أسئلة الامتحان
                        const { data: questions } = await supabase
                          .from('exam_questions')
                          .select('id, question_text, exam_id')
                          .eq('exam_id', exam.id);

                        // لكل سؤال، جلب الاختيارات
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
                      }) || []
                    );

                    // ربط الفيديوهات بالامتحانات الخاصة بها
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

              // جلب المواد الدراسية
              console.log("📚 Fetching materials for center teachers");
              const { data: materialsData, error: materialsError } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at")
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
            // اشتراك عادي - جلب محتوى المدرسين المحددين فقط
            console.log("🎯 Step 3B: Regular subscription, fetching specific teachers content for teachers:", uniqueTeacherIds);

            // جلب الفيديوهات مع الامتحانات المرتبطة
            console.log("🎥 Fetching videos with exams for specific teachers");
            const { data: videosData, error: videosError } = await supabase
              .from("videos")
              .select("id, teacher_id, title, description, video_url, uploaded_at")
              .in("teacher_id", uniqueTeacherIds);

            if (videosError) {
              console.error("❌ Videos fetch error:", videosError);
            } else {
              console.log("✅ Teacher-specific videos found:", videosData?.length || 0);
              
              // جلب الامتحانات المرتبطة بالفيديوهات
              if (videosData && videosData.length > 0) {
                const videoIds = videosData.map(v => v.id);
                
                // 1️⃣ جلب الامتحانات فقط
                console.log("📝 Fetching exams for videos");
                const { data: exams, error: examsError } = await supabase
                  .from('exams')
                  .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                  .in('video_id', videoIds)
                  .in('teacher_id', uniqueTeacherIds);

                if (examsError) {
                  console.error("❌ Exams fetch error:", examsError);
                } else {
                  console.log("✅ Exams found:", exams?.length || 0);
                  
                  // 2️⃣ لكل امتحان، جلب الأسئلة والاختيارات
                  const examsWithQuestions = await Promise.all(
                    exams?.map(async (exam) => {
                      // جلب أسئلة الامتحان
                      const { data: questions } = await supabase
                        .from('exam_questions')
                        .select('id, question_text, exam_id')
                        .eq('exam_id', exam.id);

                      // لكل سؤال، جلب الاختيارات
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
                    }) || []
                  );

                  // ربط الفيديوهات بالامتحانات الخاصة بها وتوزيعها على الاشتراكات
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

            // جلب المواد الدراسية
            console.log("📚 Fetching materials for specific teachers");
            const { data: materialsData, error: materialsError } = await supabase
              .from("materials")
              .select("id, teacher_id, title, description, file_url, uploaded_at")
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

        // جلب نتائج الامتحانات للطالب (الدرجة الأعلى فقط لكل امتحان)
        if (user) {
          console.log("📊 Fetching exam results for student:", user.id);
          const { data: studentExamResults, error: resultsError } = await supabase
            .from("exam_results")
            .select("exam_id, score, submitted_at")
            .eq("student_id", user.id);

          if (!resultsError && studentExamResults) {
            console.log("📈 Exam results found:", studentExamResults.length);
            
            // تجميع الدرجات الأعلى لكل امتحان
            const highestScoresMap: {[key: string]: any} = {};
            studentExamResults.forEach(result => {
              const examId = result.exam_id;
              const currentScore = result.score;
              
              // إذا لم يكن هناك نتيجة لهذا الامتحان بعد، أو إذا كانت النتيجة الحالية أعلى
              if (!highestScoresMap[examId] || currentScore > highestScoresMap[examId].score) {
                highestScoresMap[examId] = {
                  score: currentScore,
                  submitted_at: result.submitted_at
                };
              }
            });
            
            setExamResults(highestScoresMap);
            console.log("🏆 Highest scores per exam:", highestScoresMap);
          } else if (resultsError) {
            console.error("❌ Error fetching exam results:", resultsError);
          }
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

        // بيانات تجريبية في حالة الخطأ
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
        console.log("🏁 Dashboard loading completed");
      }
    };

    fetchSubscriptionsAndContent();
  }, [user, centerId]);

  // حساب حالة الاشتراك
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

  const handleStartExam = (examId: string, examTitle: string, questions: any[]) => {
    // إيقاف أي امتحان نشط حالياً
    if (examTimer) {
      clearInterval(examTimer);
    }

    // البحث عن وقت الامتحان
    let examDuration = 30; // افتراضياً 30 دقيقة
    
    // البحث عن مدة الامتحان في البيانات
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
      questions: questions || [],
      currentQuestionIndex: 0,
      userAnswers: {},
      timeRemaining: timeInSeconds,
      totalTime: timeInSeconds,
      isSubmitted: false,
      score: undefined
    });

    // بدء المؤقت
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

      // الانتقال للسؤال التالي تلقائياً
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

    // إيقاف المؤقت
    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }

    // حساب النتيجة
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

    try {
      // التحقق إذا كان هناك نتيجة سابقة لهذا الامتحان
      console.log("🔍 Checking previous exam results for exam:", activeExam.examId);
      const { data: previousResults, error: checkError } = await supabase
        .from("exam_results")
        .select("id, score")
        .eq("exam_id", activeExam.examId)
        .eq("student_id", user.id);

      if (checkError) {
        console.error("❌ Error checking previous results:", checkError);
      }

      // إذا كان هناك نتائج سابقة، نتحقق من أعلى درجة
      let shouldSaveResult = true;
      if (previousResults && previousResults.length > 0) {
        const highestPreviousScore = Math.max(...previousResults.map(r => r.score));
        console.log("📊 Previous highest score:", highestPreviousScore, "Current score:", score);
        
        // نحفظ النتيجة فقط إذا كانت أعلى من السابقة
        if (score > highestPreviousScore) {
          console.log("🎯 Current score is higher, saving new result");
          
          // حذف النتائج السابقة الأقل
          const resultsToDelete = previousResults.filter(r => r.score < score);
          for (const result of resultsToDelete) {
            const { error: deleteError } = await supabase
              .from("exam_results")
              .delete()
              .eq("id", result.id);
              
            if (deleteError) {
              console.error("❌ Error deleting lower score result:", deleteError);
            }
          }
          
          // حفظ النتيجة الجديدة
          const { error } = await supabase
            .from("exam_results")
            .insert({
              exam_id: activeExam.examId,
              student_id: user.id,
              score: score,
              submitted_at: new Date().toISOString()
            });

          if (error) {
            console.error("❌ Error saving exam result:", error);
            toast.error("Failed to save exam result");
          } else {
            console.log("✅ New highest score saved successfully");
            toast.success(`Exam submitted! New high score: ${score}%`);
          }
        } else {
          shouldSaveResult = false;
          console.log("📉 Current score is not higher than previous best, not saving");
          toast.success(`Exam submitted! Score: ${score}% (Previous best: ${highestPreviousScore}%)`);
        }
      } else {
        // لا توجد نتائج سابقة، نحفظ النتيجة الجديدة
        console.log("📝 No previous results found, saving new result");
        const { error } = await supabase
          .from("exam_results")
          .insert({
            exam_id: activeExam.examId,
            student_id: user.id,
            score: score,
            submitted_at: new Date().toISOString()
          });

        if (error) {
          console.error("❌ Error saving exam result:", error);
          toast.error("Failed to save exam result");
        } else {
          console.log("✅ First exam result saved successfully");
          toast.success(`Exam submitted! Score: ${score}%`);
        }
      }

      // تحديث حالة النتائج المحلية (تحديث الدرجة الأعلى فقط)
      if (shouldSaveResult) {
        setExamResults(prev => ({
          ...prev,
          [activeExam.examId]: {
            score,
            submitted_at: new Date().toISOString()
          }
        }));
      } else {
        // إذا لم نحفظ نتيجة جديدة، نعرض الدرجة الحالية
        const currentHighest = examResults[activeExam.examId];
        if (currentHighest) {
          toast.success(`Your highest score: ${currentHighest.score}%`);
        }
      }

    } catch (error) {
      console.error("🚨 Error submitting exam:", error);
      toast.error("Failed to submit exam");
    }

    // تحديث حالة الامتحان
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
  };

  const getExamResultStatus = (examId: string) => {
    const result = examResults[examId];
    if (!result) return null;
    
    return {
      score: result.score,
      submittedAt: result.submitted_at,
      passed: result.score && result.score >= 60 // افترض أن النجاح من 60
    };
  };

  // دالة لتحويل الثواني إلى تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                  
                  <button
                    onClick={handleCancelExam}
                    className="mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
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
          <p className="mt-2 text-sm text-primary-600">Center: {centerSubdomain || centerSlug || "Unknown"}</p>
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
                              {sub.videosWithExams.map((video) => (
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
                                      {video.video_url.includes('.mp4') || video.video_url.includes('.webm') || video.video_url.includes('.mov') || video.video_url.includes('.avi') ? (
                                        <video
                                          src={video.video_url}
                                          title={video.title}
                                          className="w-full h-64 md:h-96 rounded"
                                          controls
                                          preload="metadata"
                                        />
                                      ) : (
                                        <iframe
                                          src={getDirectVideoUrl(video.video_url)}
                                          title={video.title}
                                          className="w-full h-64 md:h-96 rounded"
                                          allowFullScreen
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          frameBorder="0"
                                        ></iframe>
                                      )}
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
                                            const examResult = getExamResultStatus(exam.id);
                                            
                                            return (
                                              <div key={exam.id} className="bg-white rounded-lg p-4 border">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                      <p className="font-medium text-gray-900">{exam.title}</p>
                                                      {examResult && (
                                                        examResult.passed ? (
                                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                          <XCircle className="w-4 h-4 text-red-600" />
                                                        )
                                                      )}
                                                    </div>
                                                    {exam.description && (
                                                      <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                                                      {examResult && (
                                                        <span className={`font-medium ${
                                                          examResult.passed ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                          Highest Score: {examResult.score}%
                                                        </span>
                                                      )}
                                                    </div>
                                                    {examResult && (
                                                      <p className="text-xs text-gray-400 mt-2">
                                                        Last Attempt: {formatDateTime(examResult.submittedAt)}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <button
                                                    onClick={() => handleStartExam(exam.id, exam.title, exam.exam_questions || [])}
                                                    className={`ml-4 px-4 py-2 rounded-md whitespace-nowrap ${
                                                      examResult
                                                        ? 'bg-secondary-600 text-white hover:bg-secondary-700'
                                                        : 'bg-secondary-600 text-white hover:bg-secondary-700'
                                                    }`}
                                                  >
                                                    {examResult ? 'Retake Exam' : 'Start Exam'}
                                                  </button>
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
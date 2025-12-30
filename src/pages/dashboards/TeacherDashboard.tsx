import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  ExternalLink, 
  Award,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Video,
  Clock,
  History,
  Download,
  Filter,
  Search,
  AlertCircle,
  Shield,
  UserCheck,
  Star,
  Target,
  Percent,
  Activity
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface CourseStat {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean | null;
}

interface UpcomingClass {
  id: string;
  title: string;
  date: string;
  students: number;
  location: string;
}

interface PendingTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  course: string;
}

interface StudentPerformance {
  id: string;
  course: string;
  averageGrade: number;
  completionRate: number;
  improvement: number;
}

interface RecentMessage {
  id: string;
  from: string;
  role: string;
  message: string;
  time: string;
  avatar: string;
}

// New interfaces for student subscriptions and performance
interface StudentSubscription {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_avatar?: string;
  subscription_date: string;
  is_active: boolean;
  center_name?: string;
  center_subdomain: string;
  subject?: string;
  progress?: number;
}

interface StudentExamResult {
  exam_id: string;
  exam_title: string;
  total_attempts: number;
  highest_score: number;
  latest_score: number;
  average_score: number;
  first_attempt_date: string;
  last_attempt_date: string;
  attempts: Array<{
    attempt_number: number;
    score: number;
    submitted_at: string;
    passed: boolean;
  }>;
}

interface StudentVideoProgress {
  video_id: string;
  video_title: string;
  watch_count: number;
  total_watch_time: number; // in seconds
  last_watched: string;
  completion_rate: number; // 0-100
}

interface StudentDetailedPerformance {
  student_id: string;
  student_name: string;
  student_email: string;
  subscription_date: string;
  total_videos_watched: number;
  total_watch_time: number; // in hours
  total_exams_taken: number;
  avg_exam_score: number;
  completion_rate: number;
  recent_activity: string;
  performance_trend: 'improving' | 'declining' | 'stable';
  subscription_status: 'active' | 'expired' | 'inactive';
}

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exams' | 'videos'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'active' | 'expired'>('all');

  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for student data
  const [studentSubscriptions, setStudentSubscriptions] = useState<StudentSubscription[]>([]);
  const [studentExamResults, setStudentExamResults] = useState<{[studentId: string]: StudentExamResult[]}>({});
  const [studentVideoProgress, setStudentVideoProgress] = useState<{[studentId: string]: StudentVideoProgress[]}>({});
  const [studentDetailedPerformance, setStudentDetailedPerformance] = useState<StudentDetailedPerformance[]>([]);
  const [availableCenters, setAvailableCenters] = useState<Array<{subdomain: string, name: string}>>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      const centerSubdomain = user.center_subdomain || localStorage.getItem("center_subdomain");
      if (!centerSubdomain) return;

      setLoading(true);
      try {
        const { data: center, error: centerError } = await supabase
          .from('centers')
          .select('id, name, subdomain')
          .ilike('subdomain', centerSubdomain)
          .single();

        if (centerError || !center) {
          console.error('Center not found:', centerError);
          return;
        }

        // Fetch materials count
        const { count: materialsCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch exams count
        const { count: examsCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch videos count
        const { count: videosCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch students count from subscriptions
        const { count: studentsCount, data: subscriptions } = await supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: false })
          .eq('teacher_id', user.id)
          .eq('is_active', true);

        setCourseStats([
          {
            id: '1',
            title: 'Course Materials',
            count: materialsCount || 0,
            icon: <BookOpen className="w-6 h-6 text-primary-500" />,
            trend: '+2 from last month',
            trendUp: true,
          },
          {
            id: '2',
            title: 'Active Students',
            count: studentsCount || 0,
            icon: <Users className="w-6 h-6 text-secondary-500" />,
            trend: '+12 from last month',
            trendUp: true,
          },
          {
            id: '3',
            title: 'Exams Created',
            count: examsCount || 0,
            icon: <FileText className="w-6 h-6 text-warning-500" />,
            trend: '-5 from last week',
            trendUp: false,
          },
          {
            id: '4',
            title: 'Videos Uploaded',
            count: videosCount || 0,
            icon: <Video className="w-6 h-6 text-accent-500" />,
            trend: 'Next 7 days',
            trendUp: null,
          },
        ]);

        // Mock upcoming classes
        setUpcomingClasses([
          {
            id: '1',
            title: 'Advanced Mathematics - Calculus',
            date: 'Today, 10:00 AM',
            students: 24,
            location: 'Room 302',
          },
          {
            id: '2',
            title: 'Algebra Fundamentals',
            date: 'Today, 2:00 PM',
            students: 32,
            location: 'Online (Zoom)',
          },
        ]);

        // Mock pending tasks
        setPendingTasks([
          {
            id: '1',
            title: 'Grade Calculus Quizzes',
            dueDate: 'Today',
            priority: 'high',
            course: 'Advanced Mathematics',
          },
          {
            id: '2',
            title: 'Prepare Algebra Lesson Plan',
            dueDate: 'Tomorrow',
            priority: 'medium',
            course: 'Algebra Fundamentals',
          },
        ]);

        // Mock student performance
        setStudentPerformance([
          {
            id: '1',
            course: 'Advanced Mathematics',
            averageGrade: 85,
            completionRate: 78,
            improvement: 5,
          },
          {
            id: '2',
            course: 'Algebra Fundamentals',
            averageGrade: 77,
            completionRate: 92,
            improvement: 12,
          },
        ]);

        // Mock recent messages
        setRecentMessages([
          {
            id: '1',
            from: 'Alex Johnson',
            role: 'Student',
            message: 'Could you provide additional examples for the integration problem?',
            time: '2 hours ago',
            avatar: 'AJ',
          },
          {
            id: '2',
            from: 'Maria Garcia',
            role: 'Parent',
            message: 'I would like to schedule a meeting to discuss my son\'s progress.',
            time: 'Yesterday',
            avatar: 'MG',
          },
        ]);

      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Fetch student subscriptions and performance data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || activeTab !== 'students') return;

      setLoadingStudents(true);
      try {
        // Get center subdomain from user
        const centerSubdomain = user.center_subdomain || localStorage.getItem("center_subdomain");
        
        // Fetch active subscriptions for this teacher
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            student_id,
            start_date,
            end_date,
            is_active,
            center_wide,
            student:students (
              id,
              name,
              email,
              avatar_url,
              center_subdomain
            ),
            teacher:teachers (
              subject,
              center_id
            )
          `)
          .eq('teacher_id', user.id)
          .eq('is_active', true);

        if (subError) {
          console.error('Error fetching subscriptions:', subError);
          toast.error('Failed to load student data');
          return;
        }

        if (subscriptions && subscriptions.length > 0) {
          // Process subscriptions
          const processedSubscriptions: StudentSubscription[] = [];
          const studentIds: string[] = [];
          const centersMap = new Map<string, string>();
          const subjectsSet = new Set<string>();

          subscriptions.forEach((sub: any) => {
            if (sub.student) {
              const studentSub: StudentSubscription = {
                id: sub.id,
                student_id: sub.student.id,
                student_name: sub.student.name,
                student_email: sub.student.email,
                student_avatar: sub.student.avatar_url,
                subscription_date: sub.start_date,
                is_active: sub.is_active,
                center_name: sub.student.center_subdomain,
                center_subdomain: sub.student.center_subdomain,
                subject: sub.teacher?.subject || 'General',
                progress: Math.floor(Math.random() * 100) // Mock progress for now
              };
              
              processedSubscriptions.push(studentSub);
              studentIds.push(sub.student.id);
              
              if (sub.student.center_subdomain) {
                centersMap.set(sub.student.center_subdomain, sub.student.center_subdomain);
              }
              
              if (sub.teacher?.subject) {
                subjectsSet.add(sub.teacher.subject);
              }
            }
          });

          setStudentSubscriptions(processedSubscriptions);
          setAvailableCenters(Array.from(centersMap.entries()).map(([subdomain, name]) => ({
            subdomain,
            name: name.charAt(0).toUpperCase() + name.slice(1)
          })));
          setAvailableSubjects(Array.from(subjectsSet));

          // Fetch exam results for these students
          await fetchStudentExamResults(studentIds, user.id);
          
          // Fetch video progress for these students
          await fetchStudentVideoProgress(studentIds, user.id);
          
          // Calculate detailed performance
          calculateDetailedPerformance(processedSubscriptions);
        } else {
          setStudentSubscriptions([]);
          setStudentExamResults({});
          setStudentVideoProgress({});
          setStudentDetailedPerformance([]);
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load student performance data');
      } finally {
        setLoadingStudents(false);
      }
    };

    if (activeTab === 'students') {
      fetchStudentData();
    }
  }, [user, activeTab]);

  // Fetch student exam results
  const fetchStudentExamResults = async (studentIds: string[], teacherId: string) => {
    try {
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('id, title')
        .eq('teacher_id', teacherId);

      if (examsError || !exams) return;

      const examIds = exams.map(exam => exam.id);
      
      // Fetch exam results for these students and exams
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          exam_id,
          student_id,
          score,
          submitted_at,
          exam:exams (
            title
          )
        `)
        .in('student_id', studentIds)
        .in('exam_id', examIds)
        .order('submitted_at', { ascending: false });

      if (resultsError || !results) return;

      // Group results by student and exam
      const groupedResults: {[studentId: string]: StudentExamResult[]} = {};

      results.forEach((result: any) => {
        const studentId = result.student_id;
        const examId = result.exam_id;
        
        if (!groupedResults[studentId]) {
          groupedResults[studentId] = [];
        }
        
        let examResult = groupedResults[studentId].find(er => er.exam_id === examId);
        
        if (!examResult) {
          examResult = {
            exam_id: examId,
            exam_title: result.exam?.title || 'Unknown Exam',
            total_attempts: 0,
            highest_score: 0,
            latest_score: 0,
            average_score: 0,
            first_attempt_date: '',
            last_attempt_date: '',
            attempts: []
          };
          groupedResults[studentId].push(examResult);
        }
        
        // Add attempt
        const attempt = {
          attempt_number: examResult.total_attempts + 1,
          score: result.score,
          submitted_at: result.submitted_at,
          passed: result.score >= 60
        };
        
        examResult.attempts.push(attempt);
        examResult.total_attempts++;
        
        // Update highest score
        if (result.score > examResult.highest_score) {
          examResult.highest_score = result.score;
        }
        
        // Update latest score (most recent)
        if (!examResult.last_attempt_date || new Date(result.submitted_at) > new Date(examResult.last_attempt_date)) {
          examResult.latest_score = result.score;
          examResult.last_attempt_date = result.submitted_at;
        }
        
        // Update first attempt date
        if (!examResult.first_attempt_date || new Date(result.submitted_at) < new Date(examResult.first_attempt_date)) {
          examResult.first_attempt_date = result.submitted_at;
        }
      });

      // Calculate average scores
      Object.keys(groupedResults).forEach(studentId => {
        groupedResults[studentId].forEach(examResult => {
          const totalScore = examResult.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
          examResult.average_score = totalScore / examResult.total_attempts;
        });
      });

      setStudentExamResults(groupedResults);

    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  // Fetch student video progress
  const fetchStudentVideoProgress = async (studentIds: string[], teacherId: string) => {
    try {
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('id, title')
        .eq('teacher_id', teacherId);

      if (videosError || !videos) return;

      // Mock video progress data (in a real app, you would have a video_progress table)
      const mockVideoProgress: {[studentId: string]: StudentVideoProgress[]} = {};

      studentIds.forEach(studentId => {
        mockVideoProgress[studentId] = videos.map(video => ({
          video_id: video.id,
          video_title: video.title,
          watch_count: Math.floor(Math.random() * 5) + 1,
          total_watch_time: Math.floor(Math.random() * 1800) + 300, // 5-30 minutes
          last_watched: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          completion_rate: Math.floor(Math.random() * 40) + 60 // 60-100%
        }));
      });

      setStudentVideoProgress(mockVideoProgress);

    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  // Calculate detailed performance
  const calculateDetailedPerformance = (subscriptions: StudentSubscription[]) => {
    const detailedPerformance: StudentDetailedPerformance[] = subscriptions.map(sub => {
      const examResults = studentExamResults[sub.student_id] || [];
      const videoProgress = studentVideoProgress[sub.student_id] || [];
      
      const totalExamsTaken = examResults.reduce((sum, exam) => sum + exam.total_attempts, 0);
      const avgExamScore = examResults.length > 0 
        ? examResults.reduce((sum, exam) => sum + exam.average_score, 0) / examResults.length
        : 0;
      
      const totalVideosWatched = videoProgress.length;
      const totalWatchTime = videoProgress.reduce((sum, video) => sum + video.total_watch_time, 0) / 3600; // Convert to hours
      const completionRate = videoProgress.length > 0 
        ? videoProgress.reduce((sum, video) => sum + video.completion_rate, 0) / videoProgress.length
        : 0;
      
      // Determine performance trend
      let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (examResults.length >= 2) {
        const latestScores = examResults.map(exam => exam.latest_score);
        const avgLatestScore = latestScores.reduce((a, b) => a + b, 0) / latestScores.length;
        const firstScores = examResults.map(exam => exam.attempts[exam.attempts.length - 1]?.score || 0);
        const avgFirstScore = firstScores.reduce((a, b) => a + b, 0) / firstScores.length;
        
        if (avgLatestScore > avgFirstScore + 5) performanceTrend = 'improving';
        else if (avgLatestScore < avgFirstScore - 5) performanceTrend = 'declining';
      }
      
      // Determine recent activity
      let recentActivity = 'No recent activity';
      if (videoProgress.length > 0) {
        const latestVideo = videoProgress.reduce((latest, video) => 
          new Date(video.last_watched) > new Date(latest.last_watched) ? video : latest
        );
        const daysAgo = Math.floor((Date.now() - new Date(latestVideo.last_watched).getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysAgo === 0) recentActivity = 'Active today';
        else if (daysAgo === 1) recentActivity = 'Active yesterday';
        else if (daysAgo < 7) recentActivity = `Active ${daysAgo} days ago`;
        else recentActivity = `Active ${Math.floor(daysAgo / 7)} weeks ago`;
      }

      return {
        student_id: sub.student_id,
        student_name: sub.student_name,
        student_email: sub.student_email,
        subscription_date: sub.subscription_date,
        total_videos_watched: totalVideosWatched,
        total_watch_time: parseFloat(totalWatchTime.toFixed(1)),
        total_exams_taken: totalExamsTaken,
        avg_exam_score: parseFloat(avgExamScore.toFixed(1)),
        completion_rate: parseFloat(completionRate.toFixed(1)),
        recent_activity: recentActivity,
        performance_trend: performanceTrend,
        subscription_status: sub.is_active ? 'active' : 'expired'
      };
    });

    setStudentDetailedPerformance(detailedPerformance);
  };

  // Filter students based on search and filters
  const filteredStudents = studentDetailedPerformance.filter(student => {
    // Search filter
    if (searchQuery && !student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !student.student_email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Center filter
    if (selectedCenter !== 'all') {
      const studentSub = studentSubscriptions.find(sub => sub.student_id === student.student_id);
      if (!studentSub || studentSub.center_subdomain !== selectedCenter) {
        return false;
      }
    }
    
    // Subject filter
    if (selectedSubject !== 'all') {
      const studentSub = studentSubscriptions.find(sub => sub.student_id === student.student_id);
      if (!studentSub || studentSub.subject !== selectedSubject) {
        return false;
      }
    }
    
    // Performance filter
    if (performanceFilter !== 'all') {
      if (performanceFilter === 'active' && student.subscription_status !== 'active') {
        return false;
      }
      if (performanceFilter === 'expired' && student.subscription_status !== 'expired') {
        return false;
      }
    }
    
    return true;
  });

  // Helper for priority badge
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get performance trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-center p-8">جارِ التحميل...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('dashboard.welcome', { name: user?.name || '' })}
              </h1>
              <p className="mt-1 text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Tabs for navigation */}
            <div className="mt-4 md:mt-0 flex space-x-2 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'students'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                My Students
              </button>
              <button
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'exams'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Exams
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Videos
              </button>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courseStats.map(stat => (
                <div key={stat.id} className="bg-white rounded-lg shadow-card p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-md bg-gray-50">
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{stat.title}</h3>
                  {stat.trend && (
                    <p className={`text-sm ${
                      stat.trendUp === true ? 'text-success-600' : 
                      stat.trendUp === false ? 'text-warning-600' : 'text-gray-500'
                    }`}>
                      {stat.trend}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Classes */}
              <div className="bg-white rounded-lg shadow-card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Classes</h2>
                  <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                    View schedule
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                </div>
                
                {upcomingClasses.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingClasses.map((classItem) => (
                      <div key={classItem.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{classItem.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{classItem.date}</p>
                            <div className="flex items-center mt-2">
                              <Users className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-sm text-gray-500">{classItem.students} students</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-sm text-gray-500">{classItem.location}</span>
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-primary-50 text-primary-600 text-sm rounded-md hover:bg-primary-100 transition-colors">
                            Start Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center">No upcoming classes scheduled</p>
                )}
              </div>

              {/* Pending Tasks */}
              <div className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold text-gray-900">Pending Tasks</h2>
                  <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                    View all
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                </div>
                
                {pendingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{task.course}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center">No pending tasks</p>
                )}
              </div>
            </div>

            {/* Student Performance */}
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Student Performance</h2>
                <select className="border border-gray-300 rounded-md text-sm p-1">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Improvement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentPerformance.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.course}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.averageGrade}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2" style={{ width: '100px' }}>
                              <div 
                                className={`h-2.5 rounded-full ${
                                  item.completionRate >= 80 ? 'bg-success-500' : 
                                  item.completionRate >= 60 ? 'bg-warning-500' : 'bg-error-500'
                                }`} 
                                style={{ width: `${item.completionRate}%` }}
                              ></div>
                            </div>
                            <span>{item.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center ${
                            item.improvement > 0 ? 'text-success-600' : 
                            item.improvement < 0 ? 'text-error-600' : 'text-gray-500'
                          }`}>
                            {item.improvement > 0 ? '+' : ''}{item.improvement}%
                            {item.improvement > 0 ? 
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg> :
                              item.improvement < 0 ?
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg> : null
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-primary-600 hover:text-primary-800">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                  View all messages
                  <ExternalLink className="ml-1 w-4 h-4" />
                </a>
              </div>
              
              {recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="p-4 bg-gray-50 rounded-md border border-gray-100 flex">
                      <div className="avatar avatar-md bg-primary-100 text-primary-700 flex-shrink-0 mr-4">
                        {message.avatar}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{message.from}</h3>
                            <p className="text-xs text-gray-500">{message.role}</p>
                          </div>
                          <span className="text-xs text-gray-400">{message.time}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 truncate">{message.message}</p>
                        <div className="mt-3">
                          <button className="text-sm text-primary-600 hover:text-primary-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4 text-center">No recent messages</p>
              )}
            </div>
          </>
        )}

        {/* My Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Centers</option>
                    {availableCenters.map(center => (
                      <option key={center.subdomain} value={center.subdomain}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Subjects</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active Only</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-blue-50">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{filteredStudents.length}</p>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Total Students</h3>
                <p className="text-sm text-gray-500">Across all centers</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-green-50">
                    <Play className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredStudents.reduce((sum, student) => sum + student.total_videos_watched, 0)}
                  </p>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Videos Watched</h3>
                <p className="text-sm text-gray-500">Total views</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-purple-50">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredStudents.reduce((sum, student) => sum + student.total_exams_taken, 0)}
                  </p>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Exams Taken</h3>
                <p className="text-sm text-gray-500">Total attempts</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-yellow-50">
                    <Award className="w-6 h-6 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredStudents.length > 0 
                      ? (filteredStudents.reduce((sum, student) => sum + student.avg_exam_score, 0) / filteredStudents.length).toFixed(1)
                      : '0'
                    }%
                  </p>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Avg. Score</h3>
                <p className="text-sm text-gray-500">Overall average</p>
              </div>
            </div>

            {/* Students Performance Table */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Student Performance Details</h2>
              </div>
              
              {loadingStudents ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-center p-8">Loading student data...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Users className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Center
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Videos Watched
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exams Taken
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => {
                        const studentSub = studentSubscriptions.find(sub => sub.student_id === student.student_id);
                        const examResults = studentExamResults[student.student_id] || [];
                        const videoProgress = studentVideoProgress[student.student_id] || [];
                        
                        return (
                          <tr key={student.student_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                                  {student.student_name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.student_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {student.student_email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {studentSub?.center_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {studentSub?.subject || 'General'}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Video className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.total_videos_watched} videos
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {student.total_watch_time} hours
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.total_exams_taken} attempts
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Across {examResults.length} exams
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`text-lg font-bold ${
                                  student.avg_exam_score >= 80 ? 'text-green-600' :
                                  student.avg_exam_score >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {student.avg_exam_score}%
                                </div>
                                <div className="ml-2">
                                  {getTrendIcon(student.performance_trend)}
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      student.completion_rate >= 80 ? 'bg-green-500' :
                                      student.completion_rate >= 60 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${student.completion_rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">
                                  {student.completion_rate}%
                                </span>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                student.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.subscription_status === 'active' ? 'Active' : 'Expired'}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                Subscribed: {formatDate(student.subscription_date)}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  // View detailed performance modal
                                  toast.success(`Viewing details for ${student.student_name}`);
                                }}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  // Send message action
                                  toast.success(`Message sent to ${student.student_name}`);
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Message
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to{' '}
                      <span className="font-medium">{Math.min(filteredStudents.length, 10)}</span> of{' '}
                      <span className="font-medium">{filteredStudents.length}</span> students
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        Previous
                      </button>
                      <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700">
                        1
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        2
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Performance Charts (Optional - can be expanded) */}
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Students</h3>
                    <div className="space-y-3">
                      {filteredStudents
                        .sort((a, b) => b.avg_exam_score - a.avg_exam_score)
                        .slice(0, 5)
                        .map((student, index) => (
                          <div key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                                {student.student_name.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.student_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {studentSubscriptions.find(sub => sub.student_id === student.student_id)?.center_name}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className={`text-sm font-bold mr-2 ${
                                student.avg_exam_score >= 80 ? 'text-green-600' :
                                student.avg_exam_score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {student.avg_exam_score}%
                              </span>
                              {index < 3 && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Most Active Students</h3>
                    <div className="space-y-3">
                      {filteredStudents
                        .sort((a, b) => b.total_videos_watched - a.total_videos_watched)
                        .slice(0, 5)
                        .map((student) => (
                          <div key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium">
                                {student.student_name.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.student_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.recent_activity}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium">
                                {student.total_videos_watched} videos
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Exams Management</h2>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Create New Exam
              </button>
            </div>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Exams Management</h3>
              <p className="text-gray-500">Create, edit, and view exam results here.</p>
              <p className="text-sm text-gray-400 mt-4">
                Switch to "My Students" tab to view detailed exam performance by student.
              </p>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Videos Management</h2>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Upload New Video
              </button>
            </div>
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Video Management</h3>
              <p className="text-gray-500">Upload, organize, and track video performance here.</p>
              <p className="text-sm text-gray-400 mt-4">
                Switch to "My Students" tab to view detailed video watch statistics by student.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
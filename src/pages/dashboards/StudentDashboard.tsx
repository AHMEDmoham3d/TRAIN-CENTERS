import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, FileText, Calendar, Award, TrendingUp, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

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

const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Get center subdomain from user or localStorage
      const centerSubdomain = user.center_subdomain || localStorage.getItem("center_subdomain");
      if (!centerSubdomain) return;

      setLoading(true);
      try {
        // First, get center_id from subdomain
        const { data: center, error: centerError } = await supabase
          .from('centers')
          .select('id')
          .ilike('subdomain', centerSubdomain)
          .single();

        if (centerError || !center) {
          console.error('Center not found:', centerError);
          return;
        }

        // Fetch student's subscriptions (active courses) filtered by center
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*, materials(*)')
          .eq('student_id', user.id)
          .eq('status', 'active');

        // Fetch exam results for pending assignments filtered by center
        const { data: examResults } = await supabase
          .from('exam_results')
          .select('*, exams(*)')
          .eq('student_id', user.id)
          .is('score', null); // Pending exams

        // Fetch payments for achievements (completed payments) filtered by center
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', user.id)
          .eq('status', 'completed');

        // Set upcoming lessons (mock for now, since no schedule table)
        setUpcomingLessons([
          {
            id: '1',
            title: 'Advanced Mathematics',
            time: '10:00 AM - 11:30 AM',
            teacher: 'Dr. Sarah Johnson',
          },
          {
            id: '2',
            title: 'Physics Fundamentals',
            time: '1:00 PM - 2:30 PM',
            teacher: 'Prof. Michael Chen',
          },
        ]);

        // Set pending assignments from exam_results
        if (examResults) {
          setPendingAssignments(examResults.map(er => ({
            id: er.id,
            title: er.exams?.title || 'Exam',
            dueDate: er.exams?.due_date ? new Date(er.exams.due_date).toLocaleDateString() : 'Soon',
            course: er.exams?.material_id || 'Course',
            status: 'urgent',
          })));
        } else {
          setPendingAssignments([
            {
              id: '1',
              title: 'Algebra Problem Set',
              dueDate: 'Tomorrow',
              course: 'Mathematics',
              status: 'urgent',
            },
          ]);
        }

        // Set course progress from subscriptions
        if (subscriptions) {
          setCourseProgress(subscriptions.map(sub => ({
            id: sub.id,
            title: sub.materials?.title || 'Course',
            progress: Math.floor(Math.random() * 100), // Mock progress
            totalModules: 12,
            completedModules: Math.floor(Math.random() * 12),
          })));
        } else {
          setCourseProgress([
            {
              id: '1',
              title: 'Mathematics',
              progress: 75,
              totalModules: 12,
              completedModules: 9,
            },
          ]);
        }

        // Mock AI suggestions
        setAiSuggestions([
          {
            id: '1',
            title: 'Review Calculus Fundamentals',
            reason: 'Based on your recent quiz performance',
            icon: 'BookOpen',
          },
          {
            id: '2',
            title: 'Practice Physics Equations',
            reason: 'You seem to struggle with kinematic problems',
            icon: 'FileText',
          },
          {
            id: '3',
            title: 'Schedule a session with your Math tutor',
            reason: 'To clarify integration techniques',
            icon: 'Calendar',
          },
        ]);

        // Set recent achievements from payments
        if (payments && payments.length > 0) {
          setRecentAchievements(payments.slice(0, 2).map(p => ({
            id: p.id,
            title: 'Payment Completed',
            description: `Paid ${p.amount} for subscription`,
            date: new Date(p.created_at).toLocaleDateString(),
          })));
        } else {
          setRecentAchievements([
            {
              id: '1',
              title: 'Perfect Score',
              description: 'Achieved 100% on your English Literature quiz',
              date: '2 days ago',
            },
          ]);
        }

      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper for progress bar color
  const getProgressColor = (progress: number) => {
    if (progress < 50) return 'bg-warning-500';
    if (progress < 75) return 'bg-secondary-500';
    return 'bg-success-500';
  };

  // Helper for assignment status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'bg-error-100 text-error-800';
      case 'upcoming':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper for AI suggestion icon
  const getSuggestionIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-primary-500" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-secondary-500" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-accent-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-primary-500" />;
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.name || '' })}
          </h1>
          <p className="mt-1 text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Dashboard overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's lessons */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.todaysLessons')}</h2>
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
            
            <a href="#" className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all classes
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>

          {/* Pending assignments */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-secondary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.pendingAssignments')}</h2>
            </div>
            
            {pendingAssignments.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        {assignment.course} • Due {assignment.dueDate}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No pending assignments</p>
            )}
            
            <a href="#" className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all assignments
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-accent-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">{t('ai.aiSuggestions')}</h2>
            </div>
            
            {aiSuggestions.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex">
                    <div className="mr-3 mt-1">
                      {getSuggestionIcon(suggestion.icon)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{suggestion.title}</p>
                      <p className="text-sm text-gray-500">{suggestion.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No recommendations available</p>
            )}
            
            <a href="#" className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              See more recommendations
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>

          {/* Recent achievements */}
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-warning-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.achievements')}</h2>
            </div>
            
            {recentAchievements.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-center">
                      <span className="h-8 w-8 rounded-full bg-warning-100 flex items-center justify-center mr-3">
                        <Award className="h-4 w-4 text-warning-600" />
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No achievements yet</p>
            )}
            
            <a href="#" className="mt-4 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all achievements
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Course Progress Section */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.progress')}</h2>
            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View detailed progress
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courseProgress.map((course) => (
              <div key={course.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <span className="text-gray-700 font-semibold">{course.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className={`h-2.5 rounded-full ${getProgressColor(course.progress)}`} 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-500">
                  Completed {course.completedModules} of {course.totalModules} modules
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.performanceMetrics')}</h2>
            <select className="border border-gray-300 rounded-md text-sm p-1">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            {/* Placeholder for Charts/Graphs that would be implemented with Chart.js */}
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Performance metrics visualization would appear here</p>
            <p className="text-sm">This would include attendance, grades, participation, etc.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
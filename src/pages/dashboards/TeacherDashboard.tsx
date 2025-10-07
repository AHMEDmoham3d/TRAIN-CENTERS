import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, BookOpen, FileText, Calendar, ExternalLink } from 'lucide-react';
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

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch materials count (courses)
        const { count: materialsCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch students count (students taught by this teacher)
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch exams count (pending assignments)
        const { count: examsCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        // Fetch videos count (upcoming sessions)
        const { count: videosCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id);

        setCourseStats([
          {
            id: '1',
            title: 'Active Courses',
            count: materialsCount || 0,
            icon: <BookOpen className="w-6 h-6 text-primary-500" />,
            trend: '+2 from last month',
            trendUp: true,
          },
          {
            id: '2',
            title: 'Total Students',
            count: studentsCount || 0,
            icon: <Users className="w-6 h-6 text-secondary-500" />,
            trend: '+12 from last month',
            trendUp: true,
          },
          {
            id: '3',
            title: 'Pending Assignments',
            count: examsCount || 0,
            icon: <FileText className="w-6 h-6 text-warning-500" />,
            trend: '-5 from last week',
            trendUp: false,
          },
          {
            id: '4',
            title: 'Upcoming Sessions',
            count: videosCount || 0,
            icon: <Calendar className="w-6 h-6 text-accent-500" />,
            trend: 'Next 7 days',
            trendUp: null,
          },
        ]);

        // Mock upcoming classes (since no schedule table)
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
          {
            id: '3',
            title: 'Geometry for Beginners',
            date: 'Tomorrow, 11:30 AM',
            students: 18,
            location: 'Room 201',
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
          {
            id: '3',
            title: 'Review Student Progress Reports',
            dueDate: 'This Week',
            priority: 'medium',
            course: 'All Courses',
          },
          {
            id: '4',
            title: 'Update Course Materials',
            dueDate: 'Next Week',
            priority: 'low',
            course: 'Geometry for Beginners',
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
          {
            id: '3',
            course: 'Geometry for Beginners',
            averageGrade: 82,
            completionRate: 65,
            improvement: -3,
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
          {
            id: '3',
            from: 'Dr. Robert Chen',
            role: 'Department Head',
            message: 'Please submit your syllabus for the next semester by Friday.',
            time: '2 days ago',
            avatar: 'RC',
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
                <p className={`text-sm ${stat.trendUp === true ? 'text-success-600' : stat.trendUp === false ? 'text-warning-600' : 'text-gray-500'}`}>
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
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
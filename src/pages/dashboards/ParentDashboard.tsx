import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ExternalLink, Award } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  school: string;
  avatar: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  child: string;
}

interface AcademicPerformance {
  id: string;
  child: string;
  subject: string;
  grade: string;
  progress: number;
  trend: string;
}

interface RecentMessage {
  id: string;
  from: string;
  role: string;
  message: string;
  time: string;
  child: string;
  avatar: string;
}

interface PaymentHistory {
  id: string;
  description: string;
  amount: string;
  date: string;
  status: string;
  child: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  child: string;
}

const ParentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [children, setChildren] = useState<Child[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [academicPerformance, setAcademicPerformance] = useState<AcademicPerformance[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch parent's children (students)
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);

        if (studentsData) {
          setChildren(studentsData.map(s => ({
            id: s.id,
            name: s.name || 'Student',
            age: s.age || 10,
            grade: s.grade || 'Unknown',
            school: s.school || 'Unknown',
            avatar: (s.name || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          })));
        }

        // Fetch payments for this parent
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (paymentsData) {
          setPaymentHistory(paymentsData.map(p => ({
            id: p.id,
            description: p.description || 'Payment',
            amount: `$${p.amount}`,
            date: new Date(p.created_at).toLocaleDateString(),
            status: p.status,
            child: p.student_id ? 'Child' : 'General', // Mock child name
          })));
        }

        // Mock upcoming events
        setUpcomingEvents([
          {
            id: '1',
            title: 'Parent-Teacher Conference',
            date: 'Tomorrow, 4:00 PM',
            location: 'School',
            child: 'Child',
          },
        ]);

        // Mock academic performance
        setAcademicPerformance([
          {
            id: '1',
            child: 'Child',
            subject: 'Mathematics',
            grade: 'A-',
            progress: 87,
            trend: '+5%',
          },
        ]);

        // Mock recent messages
        setRecentMessages([
          {
            id: '1',
            from: 'Teacher',
            role: 'Math Teacher',
            message: 'Good progress in math.',
            time: 'Yesterday',
            child: 'Child',
            avatar: 'T',
          },
        ]);

        // Mock achievements
        setAchievements([
          {
            id: '1',
            title: 'Good Grade',
            description: 'Achieved A in math',
            date: '2 weeks ago',
            child: 'Child',
          },
        ]);

      } catch (error) {
        console.error('Error fetching parent dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper for payment status
  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'overdue':
        return 'bg-error-100 text-error-800';
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

        {/* Children Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded-lg shadow-card p-5">
              <div className="flex items-start space-x-4">
                <div className="avatar avatar-lg bg-primary-100 text-primary-700 flex-shrink-0">
                  {child.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                  <p className="text-gray-600">{child.grade} • {child.age} years old</p>
                  <p className="text-gray-600">{child.school}</p>
                  
                  <div className="mt-4 flex space-x-3">
                    <button className="btn btn-sm btn-primary">
                      View Progress
                    </button>
                    <button className="btn btn-sm btn-outline">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                View all
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500">{event.date}</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                        <p className="text-xs text-primary-600 mt-1">For: {event.child}</p>
                      </div>
                      <button className="text-xs py-1 px-2 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100">
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No upcoming events</p>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Teacher Messages</h2>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                View all
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
            
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="avatar avatar-sm bg-secondary-100 text-secondary-700 flex-shrink-0">
                        {message.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900">{message.from}</h3>
                          <span className="text-xs text-gray-400">{message.time}</span>
                        </div>
                        <p className="text-xs text-gray-500">{message.role}</p>
                        <p className="mt-2 text-sm text-gray-600">{message.message}</p>
                        <p className="text-xs text-primary-600 mt-1">Re: {message.child}</p>
                        <div className="mt-2">
                          <button className="text-xs text-primary-600 hover:text-primary-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No recent messages</p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                View all
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
            
            {achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-warning-100 text-warning-700">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-primary-600">{achievement.child}</p>
                          <p className="text-xs text-gray-400">{achievement.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No recent achievements</p>
            )}
          </div>
        </div>

        {/* Academic Performance */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Academic Performance</h2>
            <select className="border border-gray-300 rounded-md text-sm p-1">
              <option>Current Semester</option>
              <option>Previous Semester</option>
              <option>Full Academic Year</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academicPerformance.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.child}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2" style={{ width: '100px' }}>
                          <div 
                            className={`h-2.5 rounded-full ${
                              item.progress >= 90 ? 'bg-success-500' : 
                              item.progress >= 70 ? 'bg-secondary-500' : 
                              item.progress >= 50 ? 'bg-warning-500' : 'bg-error-500'
                            }`} 
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <span>{item.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.trend.includes('+') ? (
                        <span className="text-success-600">{item.trend} <TrendingUp className="inline-block h-4 w-4" /></span>
                      ) : item.trend.includes('-') ? (
                        <span className="text-error-600">{item.trend} <TrendingUp className="inline-block h-4 w-4 transform rotate-180" /></span>
                      ) : (
                        <span className="text-gray-500">{item.trend}</span>
                      )}
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

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all payments
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Child
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.child}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-800">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
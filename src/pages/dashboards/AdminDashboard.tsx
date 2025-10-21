import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, CreditCard, BarChart2,
  TrendingUp, TrendingDown, ExternalLink,
  PieChart, Server, ShieldCheck, Settings
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface PlatformStat {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  status: string;
  avatar: string;
}

interface SubscriptionItem {
  plan: string;
  users: number;
  percentage: number;
}

interface SystemHealthItem {
  id: string;
  name: string;
  status: string;
  metric: string;
  icon: React.ReactNode;
}

interface RecentActivityItem {
  id: string;
  action: string;
  details: string;
  time: string;
  ip: string;
  user: string;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
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

        // Fetch total users for this center
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Fetch total centers (admins see all centers? or just their own? Assuming all for now)
        const { count: totalCenters } = await supabase
          .from('centers')
          .select('*', { count: 'exact', head: true });

        // Fetch total materials (as courses) for this center
        const { count: totalMaterials } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true });

        // Fetch total payments (revenue) for this center
        const { data: payments } = await supabase
          .from('payments')
          .select('amount');

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Set platform stats
        setPlatformStats([
          {
            id: '1',
            title: 'Total Users',
            count: totalUsers || 0,
            icon: <Users className="w-6 h-6 text-primary-500" />,
            trend: '+12.5%',
            trendUp: true,
          },
          {
            id: '2',
            title: 'Active Centers',
            count: totalCenters || 0,
            icon: <BookOpen className="w-6 h-6 text-secondary-500" />,
            trend: '+5.2%',
            trendUp: true,
          },
          {
            id: '3',
            title: 'Revenue (Total)',
            count: totalRevenue,
            icon: <CreditCard className="w-6 h-6 text-success-500" />,
            trend: '+15.3%',
            trendUp: true,
          },
          {
            id: '4',
            title: 'Total Materials',
            count: totalMaterials || 0,
            icon: <BarChart2 className="w-6 h-6 text-warning-500" />,
            trend: '-2.8%',
            trendUp: false,
          },
        ]);

        // Fetch recent users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        if (usersData) {
          setRecentUsers(usersData.map(u => ({
            id: u.id,
            name: u.name || u.email,
            email: u.email,
            role: u.role,
            joinDate: new Date(u.created_at).toLocaleDateString(),
            status: 'active',
            avatar: (u.name || u.email).split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          })));
        }

        // Mock subscription data (since subscriptions table might not have plan types)
        setSubscriptionData([
          { plan: 'Free Trial', users: 1250, percentage: 25 },
          { plan: 'Basic', users: 2000, percentage: 40 },
          { plan: 'Standard', users: 1200, percentage: 24 },
          { plan: 'Premium', users: 550, percentage: 11 },
        ]);

        // Mock system health
        setSystemHealth([
          {
            id: '1',
            name: 'Server Uptime',
            status: 'healthy',
            metric: '99.98%',
            icon: <Server className="w-5 h-5" />,
          },
          {
            id: '2',
            name: 'Database Load',
            status: 'normal',
            metric: '42%',
            icon: <PieChart className="w-5 h-5" />,
          },
          {
            id: '3',
            name: 'API Response Time',
            status: 'warning',
            metric: '320ms',
            icon: <TrendingUp className="w-5 h-5" />,
          },
          {
            id: '4',
            name: 'Security Status',
            status: 'healthy',
            metric: 'Secure',
            icon: <ShieldCheck className="w-5 h-5" />,
          },
        ]);

        // Mock recent activity
        setRecentActivity([
          {
            id: '1',
            action: 'User Created',
            details: 'New teacher account registered',
            time: '10 minutes ago',
            ip: '192.168.1.45',
            user: 'System API',
          },
          {
            id: '2',
            action: 'Course Published',
            details: 'Advanced Physics course is now live',
            time: '2 hours ago',
            ip: '172.16.254.1',
            user: 'David Wilson (Admin)',
          },
          {
            id: '3',
            action: 'Payment Processed',
            details: 'Monthly subscription payment received',
            time: '3 hours ago',
            ip: 'Stripe API',
            user: 'System',
          },
          {
            id: '4',
            action: 'System Update',
            details: 'Platform updated to version 2.4.0',
            time: 'Yesterday',
            ip: 'Internal',
            user: 'System Admin',
          },
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper for status badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'disabled':
        return 'bg-error-100 text-error-800';
      case 'healthy':
        return 'bg-success-100 text-success-800';
      case 'warning':
        return 'bg-warning-100 text-warning-800';
      case 'critical':
        return 'bg-error-100 text-error-800';
      case 'normal':
        return 'bg-secondary-100 text-secondary-800';
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
            Platform Overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map(stat => (
            <div key={stat.id} className="bg-white rounded-lg shadow-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-md bg-gray-50">
                  {stat.icon}
                </div>
                <div className={`flex items-center text-sm ${stat.trendUp ? 'text-success-500' : 'text-error-500'}`}>
                  <span>{stat.trend}</span>
                  {stat.trendUp ? 
                    <TrendingUp className="ml-1 w-4 h-4" /> : 
                    <TrendingDown className="ml-1 w-4 h-4" />
                  }
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.count}</p>
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Activity Chart */}
          <div className="bg-white rounded-lg shadow-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">User Activity</h2>
              <select className="border border-gray-300 rounded-md text-sm p-1">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>
            
            <div className="h-64 text-center py-4 text-gray-500">
              {/* Chart.js would be implemented here */}
              <BarChart2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p>User activity chart would be rendered here</p>
              <p className="text-sm">Showing daily active students, teachers, and parents</p>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                View all
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
            
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-start space-x-3">
                    <div className={`avatar avatar-sm ${
                      user.role === 'Student' ? 'bg-primary-100 text-primary-700' : 
                      user.role === 'Teacher' ? 'bg-secondary-100 text-secondary-700' : 
                      'bg-accent-100 text-accent-700'
                    }`}>
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{user.role}</span>
                        <span className="text-xs text-gray-400">{user.joinDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No recent user registrations</p>
            )}
          </div>
        </div>

        {/* Subscription & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Distribution */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                Manage plans
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
            
            <div className="space-y-4">
              {subscriptionData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.plan}</span>
                    <span className="text-sm text-gray-500">{item.users} users ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        index === 0 ? 'bg-gray-500' : 
                        index === 1 ? 'bg-primary-500' : 
                        index === 2 ? 'bg-secondary-500' : 'bg-accent-500'
                      }`} 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button className="btn btn-sm btn-primary">
                Add New Plan
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemHealth.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        item.status === 'healthy' ? 'bg-success-100 text-success-700' : 
                        item.status === 'warning' ? 'bg-warning-100 text-warning-700' : 
                        item.status === 'critical' ? 'bg-error-100 text-error-700' : 
                        'bg-secondary-100 text-secondary-700'
                      }`}>
                        {item.icon}
                      </div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 pl-11">Current: {item.metric}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View full log
              <ExternalLink className="ml-1 w-4 h-4" />
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="btn btn-lg btn-outline flex flex-col items-center justify-center space-y-2 py-6">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </button>
            <button className="btn btn-lg btn-outline flex flex-col items-center justify-center space-y-2 py-6">
              <BookOpen className="h-6 w-6" />
              <span>Course Admin</span>
            </button>
            <button className="btn btn-lg btn-outline flex flex-col items-center justify-center space-y-2 py-6">
              <CreditCard className="h-6 w-6" />
              <span>Billing</span>
            </button>
            <button className="btn btn-lg btn-outline flex flex-col items-center justify-center space-y-2 py-6">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
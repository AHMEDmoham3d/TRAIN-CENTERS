import React, { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Layers, Users, BookOpen, CalendarDays, 
  MessageSquare, Bell, Settings, LogOut, 
  FileText, BarChart, User, Home, Menu, X, 
  CreditCard, Languages
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface DashboardLayoutProps {
  children: ReactNode;
  onNavAction?: (action: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onNavAction }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { 
        icon: <Home size={20} />, 
        label: t('navigation.dashboard'), 
        path: `/dashboard/${user?.role.toLowerCase()}` 
      },
      {
        icon: <BookOpen size={20} />,
        label: t('navigation.courses'),
        path: '/courses',
        action: user?.role === 'student' ? 'showVideos' : undefined
      },
      { 
        icon: <CalendarDays size={20} />, 
        label: t('navigation.calendar'), 
        path: '/calendar' 
      },
      { 
        icon: <MessageSquare size={20} />, 
        label: t('navigation.messages'), 
        path: '/messages' 
      },
    ];

    const roleSpecificItems: Record<string, any[]> = {
      student: [
        { 
          icon: <FileText size={20} />, 
          label: t('navigation.assignments'), 
          path: '/assignments' 
        },
      ],
      teacher: [
        { 
          icon: <Users size={20} />, 
          label: t('navigation.students'), 
          path: '/students' 
        },
        { 
          icon: <FileText size={20} />, 
          label: t('navigation.assignments'), 
          path: '/assignments' 
        },
      ],
      parent: [
        { 
          icon: <Users size={20} />, 
          label: t('navigation.myChildren'), 
          path: '/children' 
        },
      ],
      admin: [
        { 
          icon: <Users size={20} />, 
          label: t('navigation.users'), 
          path: '/users' 
        },
        { 
          icon: <Layers size={20} />, 
          label: t('navigation.courseManagement'), 
          path: '/admin/courses' 
        },
        { 
          icon: <CreditCard size={20} />, 
          label: t('navigation.subscriptions'), 
          path: '/admin/subscriptions' 
        },
        { 
          icon: <BarChart size={20} />, 
          label: t('navigation.analytics'), 
          path: '/admin/analytics' 
        },
      ],
    };

    return [
      ...commonItems,
      ...(roleSpecificItems[user?.role.toLowerCase() || 'student'] || []),
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <Layers className="h-8 w-8 text-primary-500" />
            <span className="text-xl font-bold text-gray-900">{t('general.appName')}</span>
          </Link>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  {item.action ? (
                    <button
                      onClick={() => onNavAction && onNavAction(item.action)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={isActive ? 'text-primary-500' : 'text-gray-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={isActive ? 'text-primary-500' : 'text-gray-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="pt-4 mt-6 border-t border-gray-200">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings size={20} className="text-gray-500" />
                  <span>{t('navigation.settings')}</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={20} className="text-gray-500" />
                  <span>{t('navigation.logout')}</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Sidebar footer with user info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="avatar avatar-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || t('general.welcome')}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top navigation */}
        <header className="z-10 h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6">
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 flex justify-end items-center space-x-4">
            <LanguageSwitcher />
            
            <button className="relative p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Bell size={22} />
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary-500 text-xs text-white flex items-center justify-center transform translate-x-1 -translate-y-1">
                3
              </span>
            </button>
            
            <Link
              to="/profile"
              className="avatar avatar-sm md:hidden"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
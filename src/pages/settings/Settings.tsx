import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Settings as SettingsIcon, User, Bell, Globe, Shield, Key } from 'lucide-react';

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const settingsSections = [
    {
      id: 'profile',
      title: t('settings.profile'),
      icon: User,
      description: t('settings.profileDesc'),
    },
    {
      id: 'notifications',
      title: t('settings.notifications'),
      icon: Bell,
      description: t('settings.notificationsDesc'),
    },
    {
      id: 'language',
      title: t('settings.language'),
      icon: Globe,
      description: t('settings.languageDesc'),
    },
    {
      id: 'privacy',
      title: t('settings.privacy'),
      icon: Shield,
      description: t('settings.privacyDesc'),
    },
    {
      id: 'security',
      title: t('settings.security'),
      icon: Key,
      description: t('settings.securityDesc'),
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('settings.accountInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.email')}
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.role')}
              </label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
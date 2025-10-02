import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-16">
      <div className="text-center">
        <Layers className="h-12 w-12 text-primary-500 mx-auto mb-4" />
        
        <div className="flex items-center justify-center mb-6">
          <span className="text-8xl font-bold text-primary-500">4</span>
          <div className="relative mx-2">
            <Search className="h-20 w-20 text-gray-300 animate-pulse" />
          </div>
          <span className="text-8xl font-bold text-primary-500">4</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('errors.pageNotFound')}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          {t('errors.pageNoLongerExists')}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('errors.goHome')}
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
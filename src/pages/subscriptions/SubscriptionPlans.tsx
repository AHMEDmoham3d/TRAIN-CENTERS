import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, X, CreditCard } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Demo subscription plans
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: {
      monthly: 9.99,
      yearly: 99.99
    },
    description: 'Perfect for individual students with basic needs',
    features: [
      'Access to all basic courses',
      'Limited progress tracking',
      'Email support',
      'Basic AI recommendations',
      'Mobile app access'
    ],
    notIncluded: [
      'Advanced courses & materials',
      'Personalized learning paths',
      'Live tutoring sessions',
      'Parent & teacher collaboration',
      'Advanced analytics'
    ],
    popular: false,
    color: 'primary'
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    price: {
      monthly: 19.99,
      yearly: 199.99
    },
    description: 'Ideal for students seeking more personalized learning',
    features: [
      'All Basic Plan features',
      'Access to advanced courses',
      'Personalized learning paths',
      'Advanced progress tracking',
      'Priority email support',
      'Enhanced AI recommendations',
      'Group study rooms'
    ],
    notIncluded: [
      'Live tutoring sessions',
      'Parent-teacher collaboration tools',
      'Advanced analytics & reporting',
      'Multi-language support'
    ],
    popular: true,
    color: 'secondary'
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: {
      monthly: 29.99,
      yearly: 299.99
    },
    description: 'Complete solution for serious students and families',
    features: [
      'All Standard Plan features',
      'Unlimited access to all courses',
      'Live tutoring sessions (4/month)',
      'Parent-teacher collaboration',
      'Advanced analytics & reporting',
      'Multi-language support',
      'Phone & priority support',
      'Family accounts (up to 3 students)'
    ],
    notIncluded: [],
    popular: false,
    color: 'accent'
  }
];

const SubscriptionPlans: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    // Navigate to checkout page with selected plan
    navigate(`/subscriptions/checkout?plan=${planId}&cycle=${billingCycle}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('subscriptions.plans')}
          </h1>
          <p className="text-gray-600">
            Choose the perfect plan to enhance your learning experience
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              className={`px-4 py-2 text-sm rounded-md ${
                billingCycle === 'monthly'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              {t('subscriptions.monthlyPlan')}
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md ${
                billingCycle === 'yearly'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              {t('subscriptions.yearlyPlan')}
              <span className="ml-1 text-xs bg-success-100 text-success-800 px-1.5 py-0.5 rounded-full">
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative bg-white rounded-xl shadow-card overflow-hidden border-2 ${
                plan.popular ? `border-${plan.color}-500` : 'border-transparent'
              } transition-all hover:shadow-lg`}
            >
              {plan.popular && (
                <div className={`absolute top-0 right-0 bg-${plan.color}-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg`}>
                  Most Popular
                </div>
              )}
              
              <div className={`p-6 bg-${plan.color}-50`}>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                  </span>
                  <span className="ml-1 text-gray-500">
                    /{billingCycle === 'monthly' ? t('subscriptions.perMonth') : t('subscriptions.perYear')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 uppercase mb-4">
                  {t('subscriptions.features')}
                </h4>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className={`h-5 w-5 text-${plan.color}-500 shrink-0 mr-2`} />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                  
                  {plan.notIncluded.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 text-gray-300 shrink-0 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-8 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${plan.color}-600 hover:bg-${plan.color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${plan.color}-500`}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('subscriptions.upgrade')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-card p-6 mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">Can I switch plans later?</h3>
              <p className="mt-2 text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be applied to your next billing cycle.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">How does the family account work?</h3>
              <p className="mt-2 text-gray-600">With the Premium plan, you can add up to 3 student accounts. Each student gets their own personalized learning experience while sharing the subscription.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-gray-600">We accept all major credit cards, PayPal, and in some regions, direct bank transfers. All payments are securely processed.</p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">Can I cancel my subscription?</h3>
              <p className="mt-2 text-gray-600">Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.</p>
            </div>
          </div>
        </div>

        {/* Need help section */}
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900">Need help choosing a plan?</h3>
          <p className="mt-2 text-gray-600 max-w-lg mx-auto">Our team is ready to help you find the perfect plan for your learning needs. Contact us for personalized assistance.</p>
          <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
            Contact Support
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPlans;
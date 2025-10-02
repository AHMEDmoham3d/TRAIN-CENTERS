import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Check, ArrowLeft, Lock, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Import Stripe elements
// Note: In a real app, we would integrate with @stripe/react-stripe-js

// Demo subscription plans (simplified version of the plans from SubscriptionPlans.tsx)
const subscriptionPlans = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: {
      monthly: 9.99,
      yearly: 99.99
    }
  },
  standard: {
    id: 'standard',
    name: 'Standard Plan',
    price: {
      monthly: 19.99,
      yearly: 199.99
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: {
      monthly: 29.99,
      yearly: 299.99
    }
  }
};

const SubscriptionCheckout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const planId = queryParams.get('plan') || 'basic';
  const cycle = queryParams.get('cycle') || 'monthly';

  // Form state
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    saveCard: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Ensure we have a valid plan and cycle
  const selectedPlan = subscriptionPlans[planId as keyof typeof subscriptionPlans] || subscriptionPlans.basic;
  const selectedCycle = cycle === 'yearly' ? 'yearly' : 'monthly';
  const price = selectedPlan.price[selectedCycle as keyof typeof selectedPlan.price];

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    
    return parts.join(' ').substring(0, 19); // Limit to 16 digits + spaces
  };

  // Format expiry date with slash
  const formatExpiry = (value: string) => {
    const val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (val.length <= 2) {
      return val;
    }
    
    return `${val.substring(0, 2)}/${val.substring(2, 4)}`;
  };

  // Special handlers for formatted inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCardNumber(e.target.value);
    handleInputChange(e);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatExpiry(e.target.value);
    handleInputChange(e);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form fields
    if (!formData.cardName.trim()) {
      setError('Cardholder name is required');
      setLoading(false);
      return;
    }
    
    if (formData.cardNumber.replace(/\s+/g, '').length !== 16) {
      setError('Please enter a valid card number');
      setLoading(false);
      return;
    }
    
    // Simple validation for expiry format (MM/YY)
    if (!formData.expiry.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      setLoading(false);
      return;
    }
    
    if (formData.cvc.length < 3) {
      setError('Please enter a valid security code');
      setLoading(false);
      return;
    }
    
    // Simulate payment processing
    try {
      // In a real app, this would make a call to Stripe or another payment processor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      setSuccess(true);
      // After success, you'd typically redirect to a confirmation page or dashboard
      setTimeout(() => {
        navigate('/dashboard/student'); // Or wherever appropriate
      }, 3000);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <button
            onClick={() => navigate('/subscriptions')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('general.back')}
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('subscriptions.confirmSubscription')}
          </h1>
          <p className="text-gray-600">
            Complete your subscription to the {selectedPlan.name}
          </p>
        </div>

        {/* Main checkout content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-card p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-success-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {t('subscriptions.subscriptionConfirmed')}
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  Your subscription has been processed successfully. You now have access to all features of the {selectedPlan.name}.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('subscriptions.paymentMethod')}
                </h2>
                
                {error && (
                  <div className="p-3 bg-error-50 border border-error-200 rounded-md text-error-700 text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                    {t('subscriptions.cardholderName')}
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="John Smith"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                    {t('subscriptions.cardNumber')}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pl-10"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                      {t('subscriptions.expiryDate')}
                    </label>
                    <input
                      type="text"
                      id="expiry"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleExpiryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                      {t('subscriptions.cvv')}
                    </label>
                    <input
                      type="text"
                      id="cvc"
                      name="cvc"
                      value={formData.cvc}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="saveCard"
                    name="saveCard"
                    type="checkbox"
                    checked={formData.saveCard}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700">
                    Save this card for future payments
                  </label>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {t('subscriptions.proceed')}
                        <Lock className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Your payment information is secure. We use industry-standard encryption.
                </p>
              </form>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-lg shadow-card p-6 lg:h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{selectedPlan.name}</span>
                <span className="font-medium text-gray-900">${price}</span>
              </div>
              <div className="text-sm text-gray-500">
                {selectedCycle === 'monthly' ? 'Monthly subscription' : 'Annual subscription'}
              </div>
            </div>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${price}</span>
              </div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
            </div>
            
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>${price}</span>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              {selectedCycle === 'monthly' ? 
                'You will be charged monthly until you cancel.' : 
                'You will be charged annually until you cancel.'}
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionCheckout;
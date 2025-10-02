import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  ArrowRight, 
  BookOpen, 
  BrainCircuit, 
  Users, 
  LineChart, 
  BarChart3, 
  Globe, 
  CreditCard,
  Check
} from 'lucide-react';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">{t('general.appName')}</span>
            </div>
            
            <nav className="hidden md:flex space-x-10">
              <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
              <a href="#plans" className="text-gray-500 hover:text-gray-900">Plans</a>
              <a href="#testimonials" className="text-gray-500 hover:text-gray-900">Testimonials</a>
              <a href="#faq" className="text-gray-500 hover:text-gray-900">FAQ</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
              >
                {t('auth.login')}
              </Link>
              
              <Link
                to="/register"
                className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                {t('auth.signup')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6 xl:col-span-5">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">AI-Powered</span>
                <span className="block text-primary-600">Learning Platform</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500">
                Personalized education at scale. Advanced analytics, adaptive learning, and AI-driven insights to help students achieve their full potential.
              </p>
              <div className="mt-10 flex space-x-4">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Learn More
                </a>
              </div>
              
              <div className="mt-12">
                <p className="text-sm font-medium text-gray-500">Trusted by leading educational institutions</p>
                <div className="mt-4 flex space-x-8">
                  <div className="h-8 text-gray-400">Harvard University</div>
                  <div className="h-8 text-gray-400">Stanford</div>
                  <div className="h-8 text-gray-400">MIT</div>
                </div>
              </div>
            </div>
            
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6 xl:col-span-7">
              <div className="relative bg-gray-50 rounded-lg shadow-xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg" 
                  alt="Student using Trainify platform" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Intelligent Features for Modern Learning
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Designed to enhance the educational experience for students, teachers, parents, and administrators.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center mb-4">
                <BrainCircuit className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Driven Personalization</h3>
              <p className="text-gray-600">
                Our adaptive learning system creates personalized pathways based on individual strengths, weaknesses, and learning pace.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-secondary-100 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Course Management</h3>
              <p className="text-gray-600">
                Create, organize, and deliver engaging content with our intuitive course creation and management tools.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-accent-100 flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">
                Gain deep insights into student performance with detailed reports and predictive analytics.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-success-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Collaborative Learning</h3>
              <p className="text-gray-600">
                Foster collaboration with group projects, discussion forums, and peer-to-peer learning opportunities.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-warning-100 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-warning-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Language Support</h3>
              <p className="text-gray-600">
                Break language barriers with our platform available in multiple languages, starting with English and Arabic.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white rounded-lg shadow-card p-6 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-12 w-12 rounded-md bg-error-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-error-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Tracking</h3>
              <p className="text-gray-600">
                Track progress with real-time performance monitoring and achievement milestones for students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How Trainify Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our platform brings together students, teachers, and parents in a unified learning ecosystem.
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary-100"></div>
            
            {/* Step 1 */}
            <div className="relative mb-16">
              <div className="flex items-center justify-center">
                <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full border-4 border-white">
                  <span className="text-primary-700 font-bold">1</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-right md:pr-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Personalized Registration</h3>
                  <p className="text-gray-600">
                    Students, teachers, and parents create role-specific accounts that provide customized experiences.
                  </p>
                </div>
                <div className="md:pl-12">
                  <img 
                    src="https://images.pexels.com/photos/5212696/pexels-photo-5212696.jpeg" 
                    alt="Registration process" 
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative mb-16">
              <div className="flex items-center justify-center">
                <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full border-4 border-white">
                  <span className="text-primary-700 font-bold">2</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:order-last text-left md:pl-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI Learning Assessment</h3>
                  <p className="text-gray-600">
                    Our AI analyzes learning patterns and knowledge levels to create tailored learning paths.
                  </p>
                </div>
                <div className="md:order-first md:pr-12">
                  <img 
                    src="https://images.pexels.com/photos/8636603/pexels-photo-8636603.jpeg" 
                    alt="AI assessment" 
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative mb-16">
              <div className="flex items-center justify-center">
                <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full border-4 border-white">
                  <span className="text-primary-700 font-bold">3</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-right md:pr-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Learning Experience</h3>
                  <p className="text-gray-600">
                    Engage with multimedia course materials, interactive assignments, and real-time feedback.
                  </p>
                </div>
                <div className="md:pl-12">
                  <img 
                    src="https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg" 
                    alt="Interactive learning" 
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full border-4 border-white">
                  <span className="text-primary-700 font-bold">4</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:order-last text-left md:pl-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Continuous Improvement</h3>
                  <p className="text-gray-600">
                    Receive ongoing personalized recommendations and analytics to improve learning outcomes.
                  </p>
                </div>
                <div className="md:order-first md:pr-12">
                  <img 
                    src="https://images.pexels.com/photos/7516363/pexels-photo-7516363.jpeg" 
                    alt="Progress tracking" 
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="plans" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Flexible Pricing Plans
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Choose the perfect plan for your educational needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:max-w-5xl lg:mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="p-6 bg-primary-50">
                <h3 className="text-xl font-bold text-gray-900">Basic Plan</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900">
                    $9.99
                  </span>
                  <span className="ml-1 text-gray-500">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Perfect for individual students</p>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Access to all basic courses</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Limited progress tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Basic AI recommendations</span>
                  </li>
                </ul>
                
                <Link
                  to="/register"
                  className="mt-8 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Standard Plan */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden border-2 border-secondary-500 transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute top-0 right-0 bg-secondary-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Most Popular
              </div>
              <div className="p-6 bg-secondary-50">
                <h3 className="text-xl font-bold text-gray-900">Standard Plan</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900">
                    $19.99
                  </span>
                  <span className="ml-1 text-gray-500">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Perfect for serious students</p>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-secondary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">All Basic Plan features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-secondary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Access to advanced courses</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-secondary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Personalized learning paths</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-secondary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Advanced progress tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-secondary-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Priority support</span>
                  </li>
                </ul>
                
                <Link
                  to="/register"
                  className="mt-8 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="p-6 bg-accent-50">
                <h3 className="text-xl font-bold text-gray-900">Premium Plan</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-gray-900">
                    $29.99
                  </span>
                  <span className="ml-1 text-gray-500">
                    /month
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Perfect for families & schools</p>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">All Standard Plan features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Live tutoring sessions</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Parent-teacher collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Family accounts (up to 3 students)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 shrink-0 mr-2" />
                    <span className="text-gray-600 text-sm">Phone & priority support</span>
                  </li>
                </ul>
                
                <Link
                  to="/register"
                  className="mt-8 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-600 hover:bg-accent-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-500">All plans include a 14-day free trial. No credit card required.</p>
            <div className="mt-6 inline-flex items-center p-2 bg-white rounded-full shadow-sm">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Secure payment processing with Stripe</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Hear from students, teachers, and parents who are using Trainify.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-card">
              <div className="flex items-center mb-4">
                <div className="avatar avatar-md bg-primary-100 text-primary-700 mr-4">
                  JS
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">John Smith</h4>
                  <p className="text-sm text-gray-500">High School Student</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Trainify completely changed how I learn. The AI recommendations helped me focus on areas where I needed improvement, and my grades have gone up significantly."
              </p>
              <div className="mt-4 flex text-warning-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-card">
              <div className="flex items-center mb-4">
                <div className="avatar avatar-md bg-secondary-100 text-secondary-700 mr-4">
                  SW
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Sarah Williams</h4>
                  <p className="text-sm text-gray-500">Math Teacher</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "As a teacher, Trainify has revolutionized how I manage my classroom. The analytics help me identify struggling students before they fall behind, and the course creation tools are simply amazing."
              </p>
              <div className="mt-4 flex text-warning-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-card">
              <div className="flex items-center mb-4">
                <div className="avatar avatar-md bg-accent-100 text-accent-700 mr-4">
                  MJ
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Michael Johnson</h4>
                  <p className="text-sm text-gray-500">Parent</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Being able to track my children's progress and communicate directly with their teachers has been invaluable. The detailed reports help me understand where they need additional support."
              </p>
              <div className="mt-4 flex text-warning-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Find answers to common questions about Trainify.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {/* FAQ Item 1 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">
                How does Trainify use AI to personalize learning?
              </h3>
              <div className="mt-2 text-gray-600">
                <p>Our AI analyzes learning patterns, performance data, and interactions to create personalized learning paths. It identifies knowledge gaps, recommends appropriate resources, and adapts difficulty levels based on individual progress.</p>
              </div>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">
                Can Trainify integrate with existing school systems?
              </h3>
              <div className="mt-2 text-gray-600">
                <p>Yes, Trainify is designed to integrate with popular Learning Management Systems (LMS) through standard protocols like LTI. For custom integrations, our team can work with your IT department to ensure smooth data flow.</p>
              </div>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">
                How secure is student data on Trainify?
              </h3>
              <div className="mt-2 text-gray-600">
                <p>We take data security very seriously. All data is encrypted both in transit and at rest. We comply with GDPR, FERPA, and other relevant regulations. We never sell user data and provide detailed privacy controls.</p>
              </div>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">
                How do parents monitor their children's progress?
              </h3>
              <div className="mt-2 text-gray-600">
                <p>Parents have access to a dedicated dashboard showing real-time progress, upcoming assignments, grades, teacher feedback, and AI-generated insights. They can also communicate directly with teachers through the platform.</p>
              </div>
            </div>
            
            {/* FAQ Item 5 */}
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">
                What languages does Trainify support?
              </h3>
              <div className="mt-2 text-gray-600">
                <p>Currently, Trainify is available in English and Arabic. We're working on adding more languages based on user demand, with Spanish, French, and Mandarin coming soon.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-gray-600">Can't find what you're looking for?</p>
            <a href="#" className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700">
              Contact our support team
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Transform Your Learning Experience Today
          </h2>
          <p className="mt-4 text-xl text-primary-100 max-w-2xl mx-auto">
            Join thousands of students, teachers, and parents already using Trainify to achieve better educational outcomes.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 shadow-sm"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#plans"
              className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900"
            >
              View Plans
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">{t('general.appName')}</span>
              </div>
              <p className="text-gray-500 text-base">
                Intelligent learning for a brighter future. AI-powered education platform for students, teachers, and parents.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Solutions
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">For Students</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">For Teachers</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">For Parents</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">For Schools</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Help Center</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Contact Us</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">API Documentation</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Community Forum</a></li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Blog</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Careers</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Press</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy Policy</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms of Service</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Data Processing</a></li>
                    <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Accessibility</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Trainify, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
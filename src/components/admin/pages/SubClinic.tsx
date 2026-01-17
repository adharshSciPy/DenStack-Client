import React, { useState, useEffect } from 'react';
import baseUrl from "../../../baseUrl"
import { useAppSelector } from "../../../redux/hook";
import axios from "axios"

// Type Definitions
interface Subscription {
  package: string;
  type: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  nextBillingDate?: string | null;
  lastPaymentDate?: string | null;
  transactionId?: string | null;
}

interface Features {
  patient_management?: {
    records?: boolean;
    appointments?: boolean;
    billing?: boolean;
  };
  inventory?: {
    stock?: boolean;
    orders?: boolean;
    suppliers?: boolean;
  };
  reports?: {
    financial?: boolean;
    medical?: boolean;
    operational?: boolean;
  };
  billing?: {
    invoices?: boolean;
    payments?: boolean;
    tax?: boolean;
  };
  [key: string]: any;
}

interface Clinic {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  type: string;
  isMultipleClinic: boolean;
  subscription?: Subscription;
  features?: Features;
  subClinics?: string[];
  status?: 'active' | 'inactive' | 'pending';
}

interface Subclinic extends Omit<Clinic, 'subClinics' | 'isMultipleClinic'> {
  parentClinicId: string;
  isSubClinic: boolean;
  isOwnLab: boolean;
  address?: string;
  description?: string;
  theme?: string;
}

interface FormData {
  name: string;
  type: string;
  email: string;
  phoneNumber: string;
  password: string;
  address: string;
  description: string;
  theme: string;
  isOwnLab: boolean;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

interface FeatureCategory {
  label: string;
  subFeatures: string[];
}

interface FeatureCategories {
  [key: string]: FeatureCategory;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const SubclinicManagement: React.FC = () => {
  const token = useAppSelector((state)=>state.auth.token)
  const id = useAppSelector((state)=>state.auth.clinicId)

  const [activeTab, setActiveTab] = useState<'subclinics' | 'register'>('subclinics');
  const [selectedSubclinic, setSelectedSubclinic] = useState<Subclinic | null>(null);
  const [parentClinic, setParentClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    email: '',
    phoneNumber: '',
    password: '',
    address: '',
    description: '',
    theme: 'green',
    isOwnLab: false
  });

  const [subclinics, setSubclinics] = useState<Subclinic[]>([]);

  useEffect(() => {
    fetchParentClinic();
    fetchSubclinics();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string): void => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchParentClinic = async (): Promise<void> => {
    try {
      const response = await axios.get(`${baseUrl}api/v1/auth/clinic/view-clinic/${id}`);
      console.log("parentClinic",response.data.data);
      
      if (response.data.data) {
        setParentClinic(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clinic:', error);
      showMessage('error', 'Failed to load parent clinic data');
    }
  };

  const fetchSubclinics = async (): Promise<void> => {
    try {
      const response = await axios.get(`${baseUrl}api/v1/auth/clinic/${id}/sub-clinic`, {
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      console.log(response);
      
      setSubclinics(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subclinics:', error);
      showMessage('error', 'Failed to load subclinics');
    }
  };

const handleSubmit = async (
  e: React.MouseEvent<HTMLButtonElement>
): Promise<void> => {
  e.preventDefault();

  if (!parentClinic || !parentClinic._id) {
    showMessage('error', 'Parent clinic not found');
    return;
  }

  // Validation
  if (
    !formData.name ||
    !formData.type ||
    !formData.email ||
    !formData.phoneNumber ||
    !formData.password
  ) {
    showMessage('error', 'Please fill all required fields');
    return;
  }

  if (formData.password.length < 5) {
    showMessage('error', 'Password must be at least 8 characters');
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(
      `${baseUrl}api/v1/auth/clinic/register-subclinic/${id}`,
      formData
    );

    if (response.data.success) {
      showMessage('success', 'Subclinic registered successfully!');

      setFormData({
        name: '',
        type: '',
        email: '',
        phoneNumber: '',
        password: '',
        address: '',
        description: '',
        theme: 'green',
        isOwnLab: false
      });

      fetchSubclinics();
      setActiveTab('subclinics');
    } else {
      showMessage('error', response.data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('error', 'Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const featureCategories: FeatureCategories = {
    patient_management: {
      label: 'Patient Management',
      subFeatures: ['records', 'appointments', 'billing']
    },
    inventory: {
      label: 'Inventory',
      subFeatures: ['stock', 'orders', 'suppliers']
    },
    reports: {
      label: 'Reports',
      subFeatures: ['financial', 'medical', 'operational']
    },
    billing: {
      label: 'Billing',
      subFeatures: ['invoices', 'payments', 'tax']
    }
  };

  const inheritedFeatures: Features = parentClinic?.features || {};

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Subclinic Management</h1>
        <p className="text-slate-600">Manage subclinics and track their operations</p>
      </div>

      {/* Parent Clinic Info */}
      {parentClinic && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6" style={{margin:"20px 0px"}}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{parentClinic.name}</h2>
              <p className="text-slate-600 mt-1">{parentClinic.email} • {parentClinic.phoneNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  Parent Clinic
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {parentClinic.subClinics?.length || 0} Subclinics
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Subscription</div>
              <div className="text-lg font-semibold text-slate-900">
                {parentClinic.subscription?.package || 'No Subscription'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('subclinics')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'subclinics'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subclinics ({subclinics.length})
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'register'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'subclinics' && (
            <div>
              {subclinics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">No subclinics registered yet</div>
                  <p className="text-slate-600">Click "Register New" to add your first subclinic</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subclinics.map((subclinic: Subclinic) => (
                    <div
                      key={subclinic._id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{subclinic.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{subclinic.type}</p>
                          </div>
                          <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-slate-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {subclinic.email}
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {subclinic.phoneNumber}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Subscription</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            subclinic.subscription?.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {subclinic.subscription?.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {subclinic.subscription?.package} • Expires: {subclinic.subscription?.endDate?.split('T')[0]}
                        </div>
                      </div>

                      <div className="p-4">
                        <button
                          onClick={() => setSelectedSubclinic(subclinic)}
                          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Register New Subclinic</h2>
                <p className="text-slate-600">
                  Fill in the details below to register a new subclinic under {parentClinic?.name}
                </p>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subclinic Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter subclinic name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Clinic Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">Select type</option>
                        <option value="clinic">Clinic</option>
                        <option value="specialty">Specialty Clinic</option>
                        <option value="dental">Dental</option>
                        <option value="pediatric">Pediatric</option>
                        <option value="surgical">Surgical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="subclinic@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="+1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Theme Color
                      </label>
                      <select
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Full address"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Describe this subclinic"
                    />
                  </div>

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="isOwnLab"
                      name="isOwnLab"
                      checked={formData.isOwnLab}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="isOwnLab" className="ml-2 text-sm text-slate-700">
                      Has its own laboratory
                    </label>
                  </div>
                </div>

                {/* Features Inheritance */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Inherited Features
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        This subclinic will automatically inherit all features from the parent clinic
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(featureCategories).map(([key, category]: [string, FeatureCategory]) => {
                      const isEnabled = inheritedFeatures[key];
                      const featureObj = (inheritedFeatures[key] as Record<string, boolean>) || {};
                      
                      return (
                        <div key={key} className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">
                              {category.label}
                            </label>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              isEnabled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isEnabled ? '✓ Enabled' : 'Disabled'}
                            </span>
                          </div>
                          
                          {isEnabled && category.subFeatures && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {category.subFeatures.map((subFeature: string) => {
                                const isSubEnabled = typeof featureObj === 'object' && featureObj[subFeature];
                                
                                return (
                                  <span
                                    key={subFeature}
                                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                                      isSubEnabled
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {subFeature}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Subscription Details</h3>
                      <p className="text-green-700 mb-3">
                        This subclinic will inherit the parent's subscription: 
                        <span className="font-semibold ml-1">{parentClinic?.subscription?.package || 'N/A'}</span>
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          parentClinic?.subscription?.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {parentClinic?.subscription?.isActive ? '● Active' : '● Inactive'}
                        </span>
                        {parentClinic?.subscription?.endDate && (
                          <span className="text-green-700">
                            Expires: <span className="font-medium">{parentClinic.subscription.endDate.split('T')[0]}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActiveTab('subclinics')}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register Subclinic'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubclinicManagement;
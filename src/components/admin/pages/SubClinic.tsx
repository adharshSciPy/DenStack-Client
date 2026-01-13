// SubclinicManagement.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

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
  assignedStaff?: StaffMember[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  assignedTo?: string[];
}

interface Expense {
  id: string | number;
  description: string;
  amount: number;
  category: 'office' | 'medical' | 'staff' | 'equipment' | 'other';
  date: string;
  subclinicId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
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
  features: Features;
}

interface NewExpense {
  description: string;
  amount: string;
  category: 'office' | 'medical' | 'staff' | 'equipment' | 'other';
  date: string;
}

// Feature Categories Type
interface FeatureCategory {
  label: string;
  subFeatures: string[];
}

// Main Component
const SubclinicManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subclinics' | 'register' | 'staff' | 'expenses'>('subclinics');
  const [selectedSubclinic, setSelectedSubclinic] = useState<Subclinic | null>(null);
  const [parentClinic, setParentClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    email: '',
    phoneNumber: '',
    password: '',
    address: '',
    description: '',
    theme: 'green',
    isOwnLab: false,
    features: {}
  });

  const [subclinics, setSubclinics] = useState<Subclinic[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchParentClinic();
    fetchSubclinics();
    fetchStaff();
    fetchExpenses();
  }, []);

  const fetchParentClinic = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/clinic/profile');
      setParentClinic(response.data);
    } catch (error) {
      console.error('Error fetching clinic:', error);
      toast.error('Failed to load parent clinic data');
    }
  };

  const fetchSubclinics = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/clinic/subclinics');
      setSubclinics(response.data);
    } catch (error) {
      console.error('Error fetching subclinics:', error);
      toast.error('Failed to load subclinics');
    }
  };

  const fetchStaff = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchExpenses = async (): Promise<void> => {
    try {
      if (selectedSubclinic) {
        const response = await axios.get(`/api/expenses/${selectedSubclinic._id}`);
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!parentClinic || !parentClinic._id) {
      toast.error('Parent clinic not found');
      return;
    }

    try {
      const response = await axios.post(
        `/api/clinic/${parentClinic._id}/subclinic`,
        formData
      );

      if (response.data.success) {
        toast.success('Subclinic registered successfully!');
        setFormData({
          name: '',
          type: '',
          email: '',
          phoneNumber: '',
          password: '',
          address: '',
          description: '',
          theme: 'green',
          isOwnLab: false,
          features: {}
        });
        fetchSubclinics();
        setActiveTab('subclinics');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      console.error('Registration error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureToggle = (feature: string, subFeature?: string): void => {
    setFormData(prev => {
      const newFeatures = { ...prev.features };
      
      if (subFeature) {
        if (!newFeatures[feature]) newFeatures[feature] = {};
        (newFeatures[feature] as Record<string, boolean>)[subFeature] = 
          !(newFeatures[feature] as Record<string, boolean>)?.[subFeature];
      } else {
        newFeatures[feature] = !newFeatures[feature];
      }
      
      return { ...prev, features: newFeatures };
    });
  };

  const inheritedFeatures = parentClinic?.features || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Subclinic Management</h1>
        <p className="text-slate-600">Manage subclinics, assign staff, and track expenses</p>
      </div>

      {/* Parent Clinic Info */}
      {parentClinic && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
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
            {selectedSubclinic && (
              <>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === 'staff'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Staff Assignment
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === 'expenses'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expenses
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'subclinics' && (
            <SubclinicList
              subclinics={subclinics}
              onSelect={setSelectedSubclinic}
              onManage={(subclinic) => {
                setSelectedSubclinic(subclinic);
                setActiveTab('staff');
              }}
            />
          )}

          {activeTab === 'register' && (
            <RegisterForm
              formData={formData}
              inheritedFeatures={inheritedFeatures}
              parentClinic={parentClinic}
              onChange={handleInputChange}
              onFeatureToggle={handleFeatureToggle}
              onSubmit={handleSubmit}
            />
          )}

          {activeTab === 'staff' && selectedSubclinic && (
            <StaffAssignment
              subclinic={selectedSubclinic}
              staff={staff}
              onStaffUpdate={setStaff}
            />
          )}

          {activeTab === 'expenses' && selectedSubclinic && (
            <ExpenseManagement
              subclinic={selectedSubclinic}
              expenses={expenses}
              onExpenseUpdate={setExpenses}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Subclinic List Component
interface SubclinicListProps {
  subclinics: Subclinic[];
  onSelect: (subclinic: Subclinic) => void;
  onManage: (subclinic: Subclinic) => void;
}

const SubclinicList: React.FC<SubclinicListProps> = ({ subclinics, onSelect, onManage }) => {
  const getStatusColor = (status?: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      inactive: 'bg-red-500',
      pending: 'bg-yellow-500'
    };
    return colors[status || ''] || 'bg-gray-500';
  };

  if (subclinics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">No subclinics registered yet</div>
        <p className="text-slate-600">Click "Register New" to add your first subclinic</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* {subclinics.map((subclinic) => (
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
              <span className={`h-3 w-3 rounded-full ${getStatusColor(subclinic.status)}`}></span>
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

          <div className="p-4 flex gap-2">
            <button
              onClick={() => onSelect(subclinic)}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              View Details
            </button>
            <button
              onClick={() => onManage(subclinic)}
              className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Manage
            </button>
          </div>
        </div>
      ))} */}
    </div>
  );
};

// Registration Form Component
interface RegisterFormProps {
  formData: FormData;
  inheritedFeatures: Features;
  parentClinic: Clinic | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFeatureToggle: (feature: string, subFeature?: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  inheritedFeatures,
  parentClinic,
  onChange,
  onFeatureToggle,
  onSubmit
}) => {
  const featureCategories: Record<string, FeatureCategory> = {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Register New Subclinic</h2>
        <p className="text-slate-600">
          Fill in the details below to register a new subclinic under {parentClinic?.name}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
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
                onChange={onChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                onChange={onChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select type</option>
                <option value="general">General Practice</option>
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
                onChange={onChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                onChange={onChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                onChange={onChange}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Theme Color
              </label>
              <select
                name="theme"
                value={formData.theme}
                onChange={onChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
              onChange={onChange}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
              onChange={onChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Describe this subclinic"
            />
          </div>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isOwnLab"
              name="isOwnLab"
              checked={formData.isOwnLab}
              onChange={onChange}
              className="h-4 w-4 text-primary rounded focus:ring-primary"
            />
            <label htmlFor="isOwnLab" className="ml-2 text-sm text-slate-700">
              Has its own laboratory
            </label>
          </div>
        </div>

        {/* Features Inheritance */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Features Configuration
            <span className="text-sm font-normal text-slate-500 ml-2">
              (Inherited from parent clinic)
            </span>
          </h3>

          {Object.entries(featureCategories).map(([key, category]) => (
            <div key={key} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  {category.label}
                </label>
                <button
                  type="button"
                  onClick={() => onFeatureToggle(key)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    formData.features[key] || inheritedFeatures[key]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {formData.features[key] || inheritedFeatures[key] ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              
              {(formData.features[key] || inheritedFeatures[key]) && category.subFeatures && (
                <div className="ml-4 mt-2 flex flex-wrap gap-2">
                  {category.subFeatures.map(subFeature => {
                    const featureObj = formData.features[key] as Record<string, boolean> || {};
                    const inheritedObj = inheritedFeatures[key] as Record<string, boolean> || {};
                    
                    return (
                      <button
                        key={subFeature}
                        type="button"
                        onClick={() => onFeatureToggle(key, subFeature)}
                        className={`px-3 py-1 text-xs rounded-full ${
                          featureObj[subFeature] || inheritedObj[subFeature]
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {subFeature}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subscription Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Subscription</h3>
          <p className="text-blue-700">
            This subclinic will inherit the parent's subscription: 
            <span className="font-semibold"> {parentClinic?.subscription?.package}</span>
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Status: <span className="font-medium">{parentClinic?.subscription?.isActive ? 'Active' : 'Inactive'}</span> • 
            Expires: {parentClinic?.subscription?.endDate?.split('T')[0]}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Register Subclinic
          </button>
        </div>
      </form>
    </div>
  );
};

// Staff Assignment Component
interface StaffAssignmentProps {
  subclinic: Subclinic;
  staff: StaffMember[];
  onStaffUpdate: (staff: StaffMember[]) => void;
}

const StaffAssignment: React.FC<StaffAssignmentProps> = ({ subclinic, staff, onStaffUpdate }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async (staffId: string): Promise<void> => {
    try {
      await axios.post(`/api/subclinic/${subclinic._id}/staff/${staffId}/assign`);
      toast.success('Staff assigned successfully');
      // Refresh staff list
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast.error('Failed to assign staff');
    }
  };

  const handleRemove = async (staffId: string): Promise<void> => {
    try {
      await axios.post(`/api/subclinic/${subclinic._id}/staff/${staffId}/remove`);
      toast.success('Staff removed successfully');
      // Refresh staff list
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('Failed to remove staff');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Staff Assignment - {subclinic.name}
        </h2>
        <p className="text-slate-600">Manage staff members assigned to this subclinic</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Staff */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Available Staff</h3>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              {filteredStaff.map(person => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-semibold">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{person.name}</div>
                      <div className="text-sm text-slate-600">{person.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(person.id)}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assigned Staff */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Assigned Staff</h3>
            
            <div className="space-y-3">
              {subclinic.assignedStaff && subclinic.assignedStaff.length > 0 ? (
                subclinic.assignedStaff.map(staffMember => (
                  <div
                    key={staffMember.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-green-700 font-semibold text-sm">
                          {staffMember.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{staffMember.name}</div>
                        <div className="text-xs text-slate-600">{staffMember.role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(staffMember.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  No staff assigned yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expense Management Component
interface ExpenseManagementProps {
  subclinic: Subclinic;
  expenses: Expense[];
  onExpenseUpdate: (expenses: Expense[]) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ subclinic, expenses, onExpenseUpdate }) => {
  const [newExpense, setNewExpense] = useState<NewExpense>({
    description: '',
    amount: '',
    category: 'office',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddExpense = async (): Promise<void> => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        subclinicId: subclinic._id
      };
      
      const response = await axios.post('/api/expenses', expenseData);
      
      if (response.data.success) {
        onExpenseUpdate([...expenses, response.data.expense]);
        setNewExpense({
          description: '',
          amount: '',
          category: 'office',
          date: new Date().toISOString().split('T')[0]
        });
        toast.success('Expense added successfully');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      office: 'bg-blue-500/10 text-blue-700 border-blue-200',
      medical: 'bg-green-500/10 text-green-700 border-green-200',
      staff: 'bg-purple-500/10 text-purple-700 border-purple-200',
      equipment: 'bg-orange-500/10 text-orange-700 border-orange-200',
      other: 'bg-slate-500/10 text-slate-700 border-slate-200'
    };
    return colors[category] || colors.other;
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Expense Management - {subclinic.name}
        </h2>
        <p className="text-slate-600">Track and manage expenses for this subclinic</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-600">Total Expenses</div>
          <div className="text-2xl font-bold text-slate-900">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-600">This Month</div>
          <div className="text-2xl font-bold text-slate-900">$0.00</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-600">Pending</div>
          <div className="text-2xl font-bold text-slate-900">$0.00</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm text-slate-600">Approved</div>
          <div className="text-2xl font-bold text-slate-900">$0.00</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Expense</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="What was the expense for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value as Expense['category']})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="office">Office Supplies</option>
                  <option value="medical">Medical Supplies</option>
                  <option value="staff">Staff Expenses</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleAddExpense}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 font-medium"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Recent Expenses</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-4 text-sm font-medium text-slate-700">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-700">Description</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-700">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-700">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-sm text-slate-600">
                        {expense.date}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-900">{expense.description}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs rounded-full border ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          expense.status === 'approved' 
                            ? 'bg-green-100 text-green-700'
                            : expense.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubclinicManagement;
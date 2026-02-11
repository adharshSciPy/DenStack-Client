import React, { useState, useEffect } from 'react';
import { 
  Palette, Lock, User, Bell, Shield, Globe, 
  Plus, Edit, Trash2, Eye, Search, X, Settings,
  ChevronLeft, FileText, Stethoscope, MessageSquare,
  ClipboardCheck, Heart, Activity, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import baseUrl from '../../../baseUrl';
import { useSelector } from 'react-redux';
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl.js";

// Types
interface ProcedureItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProcedureFormData {
  name: string;
  description: string;
  price?: string;
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TabConfig {
  key: string;
  title: string;
  apiEndpoint: string;
  hasPrice: boolean;
  icon: React.ReactNode;
  description: string;
}

export default function SettingsGrid() {
  const userId = useSelector((state: any) => state?.auth?.user?.id) ?? null;
  const token = useSelector((state: any) => state?.auth?.token) ?? null;
  const clinicId = useSelector((state: any) => state?.auth?.user?.clinicId) ?? null;
  
  const [activeSettingsTab, setActiveSettingsTab] = useState<'grid' | 'practice'>('grid');
  const [activeProcedureTab, setActiveProcedureTab] = useState<string>('treatment-procedures');
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [showProcedureDrawer, setShowProcedureDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  const [colorSettings, setColorSettings] = useState({
    startColor: '#3b82f6',
    endColor: '#8b5cf6',
    primaryForeground: '#ffffff',
    sidebarForeground: '#1f2937',
    secondary: '#6366f1'
  });

  const [procedureForm, setProcedureForm] = useState<ProcedureFormData>({
    name: '',
    description: '',
    price: ''
  });

  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);

  // Axios configuration with auth token
  const api = axios.create({
    baseURL: clinicServiceBaseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Tab configurations
  const tabConfigs: TabConfig[] = [
    {
      key: 'treatment-procedures',
      title: 'All Procedures',
      apiEndpoint: '/api/v1/patient_treatment/details/treatment-procedures',
      hasPrice: true,
      icon: <FileText className="w-4 h-4" />,
      description: 'View and manage all treatment procedures'
    },
    {
      key: 'patient-complaints',
      title: 'Patient complaints',
      apiEndpoint: '/api/v1/patient_treatment/details/patient-complaints',
      hasPrice: false,
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'Manage patient complaints and symptoms'
    },
    {
      key: 'medical-history',
      title: 'Medical history',
      apiEndpoint: '/api/v1/patient_treatment/details/medical-history',
      hasPrice: false,
      icon: <Heart className="w-4 h-4" />,
      description: 'Medical history assessment procedures'
    },
    {
      key: 'treatment-advice',
      title: 'Advices',
      apiEndpoint: '/api/v1/patient_treatment/details/treatment-advice',
      hasPrice: false,
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Patient advice and counseling items'
    },
    {
      key: 'examination-findings',
      title: 'On examination',
      apiEndpoint: '/api/v1/patient_treatment/details/examination-findings',
      hasPrice: false,
      icon: <ClipboardCheck className="w-4 h-4" />,
      description: 'Physical examination procedures'
    },
    {
      key: 'dental-history',
      title: 'Dental history',
      apiEndpoint: '/api/v1/patient_treatment/details/dental-history',
      hasPrice: false,
      icon: <Activity className="w-4 h-4" />,
      description: 'Dental treatment history items'
    },
    {
      key: 'patient-diagnosis',
      title: 'Diagnosis',
      apiEndpoint: '/api/v1/patient_treatment/details/patient-diagnosis',
      hasPrice: false,
      icon: <Stethoscope className="w-4 h-4" />,
      description: 'Diagnostic procedures and assessments'
    }
  ];

  // Helper function to get active tab config
  const getActiveTabConfig = () => {
    return tabConfigs.find(tab => tab.key === activeProcedureTab) || tabConfigs[0];
  };

  // Get display name for item type
  const getItemTypeName = () => {
    const tab = getActiveTabConfig();
    if (tab.title === 'All Procedures') return 'procedure';
    if (tab.title === 'Patient complaints') return 'complaint';
    if (tab.title === 'Medical history') return 'medical history item';
    if (tab.title === 'Advices') return 'advice';
    if (tab.title === 'On examination') return 'examination finding';
    if (tab.title === 'Dental history') return 'dental history item';
    if (tab.title === 'Diagnosis') return 'diagnosis';
    return 'item';
  };

  // Get singular form of tab title
  const getSingularTitle = () => {
    const tab = getActiveTabConfig();
    if (tab.title === 'All Procedures') return 'Procedure';
    if (tab.title === 'Patient complaints') return 'Patient Complaint';
    if (tab.title === 'Medical history') return 'Medical History';
    if (tab.title === 'Advices') return 'Advice';
    if (tab.title === 'On examination') return 'Examination Finding';
    if (tab.title === 'Dental history') return 'Dental History';
    if (tab.title === 'Diagnosis') return 'Diagnosis';
    return 'Item';
  };

  // Fetch items based on active tab
  const fetchItems = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const activeTab = getActiveTabConfig();
      
      const response = await api.get(activeTab.apiEndpoint, {
        params: {
          page,
          limit: pagination.itemsPerPage,
          search: search || undefined
        }
      });

      if (response.data.success) {
        const { data, pagination: paginationData } = response.data;
        
        // Transform API data to match your component's structure
        const transformedData = data.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          description: item.description || '',
          price: item.price || 0,
          category: activeTab.title,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));

        setProcedures(transformedData);
        setPagination({
          currentPage: paginationData?.currentPage || page,
          itemsPerPage: paginationData?.itemsPerPage || pagination.itemsPerPage,
          totalPages: paginationData?.totalPages || 1,
          totalItems: paginationData?.totalItems || transformedData.length,
          hasNextPage: paginationData?.hasNextPage || false,
          hasPreviousPage: paginationData?.hasPreviousPage || false
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error: any) {
      console.error(`Error fetching ${getActiveTabConfig().title}:`, error);
      
      // If it's a 404 or empty response, set empty state
      if (error.response?.status === 404 || error.response?.data?.success === false) {
        setProcedures([]);
        setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1 }));
      } else {
        alert(`Failed to fetch ${getActiveTabConfig().title.toLowerCase()}. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    await fetchItems(1, searchQuery);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchItems(page, searchQuery);
    }
  };

  // Create new item
  const handleAddItem = async () => {
    try {
      const activeTab = getActiveTabConfig();
      const requestData: any = {
        name: procedureForm.name.trim(),
        description: procedureForm.description.trim()
      };

      // Add price only for tabs that have price
      if (activeTab.hasPrice && procedureForm.price) {
        const price = parseFloat(procedureForm.price);
        if (isNaN(price) || price < 0) {
          alert('Please enter a valid price');
          return;
        }
        requestData.price = price;
      }

      const response = await api.post(activeTab.apiEndpoint, requestData);

      if (response.data.success) {
        // Refresh the items list
        await fetchItems(1, searchQuery);
        
        setShowProcedureDrawer(false);
        resetForm();
        alert(`${getSingularTitle()} added successfully!`);
      } else {
        alert(response.data.message || `Failed to add ${getItemTypeName()}`);
      }
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(error.response?.data?.message || 'Failed to add item. Please try again.');
    }
  };

  // Update item
  const handleUpdateItem = async () => {
    if (!editingProcedure) return;

    try {
      const activeTab = getActiveTabConfig();
      const requestData: any = {
        name: procedureForm.name.trim(),
        description: procedureForm.description.trim()
      };

      // Add price only for tabs that have price
      if (activeTab.hasPrice && procedureForm.price !== undefined) {
        const price = parseFloat(procedureForm.price || '0');
        if (isNaN(price) || price < 0) {
          alert('Please enter a valid price');
          return;
        }
        requestData.price = price;
      }

      const response = await api.put(`${activeTab.apiEndpoint}/${editingProcedure.id}`, requestData);

      if (response.data.success) {
        // Refresh the items list
        await fetchItems(pagination.currentPage, searchQuery);
        
        setShowProcedureDrawer(false);
        setIsEditing(false);
        setEditingProcedure(null);
        resetForm();
        alert(`${getSingularTitle()} updated successfully!`);
      } else {
        alert(response.data.message || `Failed to update ${getItemTypeName()}`);
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      alert(error.response?.data?.message || 'Failed to update item. Please try again.');
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    const activeTab = getActiveTabConfig();
    const itemTypeName = getItemTypeName();
    const singularTitle = getSingularTitle();
    
    if (window.confirm(`Are you sure you want to delete this ${itemTypeName}?`)) {
      try {
        const response = await api.delete(`${activeTab.apiEndpoint}/${id}`);

        if (response.data.success) {
          // Refresh the items list
          await fetchItems(pagination.currentPage, searchQuery);
          alert(`${singularTitle} deleted successfully!`);
        } else {
          alert(response.data.message || `Failed to delete ${itemTypeName}`);
        }
      } catch (error: any) {
        console.error('Error deleting item:', error);
        alert(error.response?.data?.message || 'Failed to delete item. Please try again.');
      }
    }
  };

  // View item details
  const handleViewItem = async (id: string) => {
    try {
      const activeTab = getActiveTabConfig();
      const response = await api.get(`${activeTab.apiEndpoint}/${id}`);
      
      if (response.data.success) {
        const item = response.data.data;
        let details = `${getSingularTitle()} Details:\n\nName: ${item.name}\nDescription: ${item.description || 'No description'}`;
        
        if (activeTab.hasPrice && item.price !== undefined) {
          details += `\nPrice: ₹${item.price}`;
        }
        
        if (item.createdAt) {
          details += `\nCreated: ${new Date(item.createdAt).toLocaleDateString()}`;
        }
        
        alert(details);
      }
    } catch (error: any) {
      console.error('Error fetching item details:', error);
      alert(error.response?.data?.message || 'Failed to fetch item details.');
    }
  };

  const handleEditItem = async (item: ProcedureItem) => {
    try {
      const activeTab = getActiveTabConfig();
      const response = await api.get(`${activeTab.apiEndpoint}/${item.id}`);
      
      if (response.data.success) {
        const itemData = response.data.data;
        setProcedureForm({
          name: itemData.name,
          description: itemData.description || '',
          price: activeTab.hasPrice ? (itemData.price?.toString() || '') : undefined
        });
        setEditingProcedure(item);
        setIsEditing(true);
        setShowProcedureDrawer(true);
      }
    } catch (error: any) {
      console.error('Error fetching item for edit:', error);
      alert(error.response?.data?.message || 'Failed to load item for editing.');
    }
  };

  const resetForm = () => {
    const activeTab = getActiveTabConfig();
    setProcedureForm({
      name: '',
      description: '',
      price: activeTab.hasPrice ? '' : undefined
    });
    setIsEditing(false);
    setEditingProcedure(null);
  };

  const handleColorChange = (field: keyof typeof colorSettings, value: string) => {
    setColorSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveColors = async() => {
    try {
      const res = await axios.patch(`${baseUrl}api/v1/auth/clinic/updateTheme/${userId}`, colorSettings);
      if (res.data.success) {
        setShowColorPopup(false);
        alert('Color settings saved successfully!');
      } else {
        alert(res.data.message || 'Failed to save color settings');
      }
    } catch (error: any) {
      console.error('Error saving colors:', error);
      alert(error.response?.data?.message || 'Failed to save color settings. Please try again.');
    }
  };

  // Filter items based on search query
  const filteredItems = procedures.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  // Fetch items when component mounts or when active tab changes
  useEffect(() => {
    if (activeSettingsTab === 'practice') {
      fetchItems();
    }
  }, [activeSettingsTab, activeProcedureTab]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSettingsTab === 'practice') {
        fetchItems(1, searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeProcedureTab]);

  const settingsCards = [
    {
      id: 'colors',
      icon: Palette,
      title: 'Color Changing',
      description: 'Customize your theme colors',
      onClick: () => setShowColorPopup(true)
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Password Reset',
      description: 'Change your password',
      onClick: () => alert('Password reset clicked')
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile Settings',
      description: 'Update your profile information',
      onClick: () => alert('Profile settings clicked')
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Manage notification preferences',
      onClick: () => alert('Notifications clicked')
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security',
      description: 'Security and privacy settings',
      onClick: () => alert('Security clicked')
    },
    {
      id: 'language',
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your language preferences',
      onClick: () => alert('Language clicked')
    },
    {
      id: 'practice',
      icon: Settings,
      title: 'Practice Settings',
      description: 'Manage procedures and settings',
      onClick: () => {
        setActiveSettingsTab('practice');
        fetchItems();
      }
    }
  ];

  // Close drawer on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showProcedureDrawer) {
        setShowProcedureDrawer(false);
        resetForm();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showProcedureDrawer]);

  // Get active tab config
  const activeTab = getActiveTabConfig();
  const singularTitle = getSingularTitle();
  const itemTypeName = getItemTypeName();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {activeSettingsTab === 'grid' ? (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600 mb-6">Manage your account preferences and settings</p>

          {/* Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {settingsCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={card.onClick}
                  className="bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left group w-full"
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1 truncate">
                        {card.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{card.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // Practice Settings Page
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setActiveSettingsTab('grid')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm md:text-base"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              Back to Settings
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">Practice Settings</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base truncate">
                  {activeTab.description}
                </p>
              </div>
              <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
                {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    Total {activeTab.title.toLowerCase()}: {pagination.totalItems}
                    {pagination.totalPages > 1 && ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Procedure Tabs - Improved for mobile */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="border-b border-gray-200 px-1 md:px-2">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1">
                {tabConfigs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveProcedureTab(tab.key);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                      activeProcedureTab === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {tab.icon}
                    </span>
                    <span className="truncate max-w-[100px] md:max-w-none">{tab.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-3 md:p-6">
              {/* Search and Add Button */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab.title.toLowerCase()} by name`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 md:pl-10 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowProcedureDrawer(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-semibold transition-all shadow-sm text-sm md:text-base whitespace-nowrap flex-shrink-0"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Add New</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading {activeTab.title.toLowerCase()}...</p>
                </div>
              )}

              {/* Items Table */}
              {!isLoading && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                            No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[140px]">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell min-w-[200px]">
                            Description
                          </th>
                          {activeTab.hasPrice && (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                              Price (₹)
                            </th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-semibold text-gray-900 truncate max-w-[140px]" title={item.name}>
                                  {item.name}
                                </div>
                                {/* <div className="lg:hidden text-xs text-gray-600 mt-1 truncate max-w-[140px]">
                                  {item.description || 'No description'}
                                </div> */}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">
                                <div className="truncate max-w-[200px]" title={item.description}>
                                  {item.description || 'No description'}
                                </div>
                              </td>
                              {activeTab.hasPrice && (
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    ₹{item.price === 0 ? '0' : item.price?.toLocaleString() || '0'}
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleViewItem(item.id)}
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-md text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={activeTab.hasPrice ? 5 : 4} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <FileText className="w-12 h-12 mb-3 text-gray-300" />
                                <p className="text-lg font-medium mb-1">No {activeTab.title.toLowerCase()} found</p>
                                <p className="text-sm">
                                  {searchQuery ? 'Try a different search term' : `No ${itemTypeName}s added yet`}
                                </p>
                                <button
                                  onClick={() => {
                                    resetForm();
                                    setShowProcedureDrawer(true);
                                  }}
                                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Add Your First {singularTitle}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-semibold">
                            {Math.min(
                              (pagination.currentPage - 1) * pagination.itemsPerPage + 1,
                              pagination.totalItems
                            )} -{' '}
                            {Math.min(
                              pagination.currentPage * pagination.itemsPerPage,
                              pagination.totalItems
                            )}
                          </span>{' '}
                          of <span className="font-semibold">{pagination.totalItems}</span> {activeTab.title.toLowerCase()}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors ${
                              pagination.hasPreviousPage
                                ? 'text-gray-700 bg-white hover:bg-gray-50'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                          >
                            Previous
                          </button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-colors ${
                                  pagination.currentPage === pageNum
                                    ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors ${
                              pagination.hasNextPage
                                ? 'text-gray-700 bg-white hover:bg-gray-50'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Drawer - FIXED with proper styles */}
      {showProcedureDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'stretch'
        }}>
          {/* Click outside to close */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={() => {
              setShowProcedureDrawer(false);
              resetForm();
            }}
          />
          
          {/* Drawer Content */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '28rem',
            height: '100%',
            backgroundColor: 'white',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 51
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                    borderRadius: '0.5rem'
                  }}>
                    <Plus style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0
                    }}>
                      {isEditing ? `Edit ${singularTitle}` : `Add New ${singularTitle}`}
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0.25rem 0 0 0',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {activeTab.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProcedureDrawer(false);
                    resetForm();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#6b7280'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={procedureForm.name}
                    onChange={(e) => setProcedureForm({...procedureForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={`Enter ${singularTitle.toLowerCase()} name`}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Description *
                  </label>
                  <textarea
                    value={procedureForm.description}
                    onChange={(e) => setProcedureForm({...procedureForm, description: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={`Enter ${singularTitle.toLowerCase()} description`}
                    required
                  />
                </div>

                {/* Price - Only show for tabs with price */}
                {activeTab.hasPrice && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={procedureForm.price || ''}
                      onChange={(e) => setProcedureForm({...procedureForm, price: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {/* Category - Read only */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Category
                  </label>
                  <div style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: '#f9fafb',
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    {activeTab.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              position: 'sticky',
              bottom: 0
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => {
                    setShowProcedureDrawer(false);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease-in-out'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={isEditing ? handleUpdateItem : handleAddItem}
                  disabled={!procedureForm.name.trim() || !procedureForm.description.trim() || (activeTab.hasPrice && !procedureForm.price)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: !procedureForm.name.trim() || !procedureForm.description.trim() || (activeTab.hasPrice && !procedureForm.price) ? 'not-allowed' : 'pointer',
                    opacity: !procedureForm.name.trim() || !procedureForm.description.trim() || (activeTab.hasPrice && !procedureForm.price) ? 0.5 : 1,
                    transition: 'opacity 0.15s ease-in-out, background 0.15s ease-in-out'
                  }}
                  onMouseOver={(e) => {
                    if (!(!procedureForm.name.trim() || !procedureForm.description.trim() || (activeTab.hasPrice && !procedureForm.price))) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #7c3aed)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!(!procedureForm.name.trim() || !procedureForm.description.trim() || (activeTab.hasPrice && !procedureForm.price))) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
                    }
                  }}
                >
                  {isEditing ? `Update ${singularTitle}` : `Add ${singularTitle}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Popup */}
      {showColorPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '42rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                    borderRadius: '0.5rem'
                  }}>
                    <Palette style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    Color Customization
                  </h2>
                </div>
                <button
                  onClick={() => setShowColorPopup(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#6b7280'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                Customize your theme colors to match your preferences
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Start Color */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Start Color
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <input
                      type="color"
                      value={colorSettings.startColor}
                      onChange={(e) => handleColorChange('startColor', e.target.value)}
                      style={{
                        width: '3.5rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: '2px solid #d1d5db',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colorSettings.startColor}
                      onChange={(e) => handleColorChange('startColor', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                {/* End Color */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    End Color
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <input
                      type="color"
                      value={colorSettings.endColor}
                      onChange={(e) => handleColorChange('endColor', e.target.value)}
                      style={{
                        width: '3.5rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: '2px solid #d1d5db',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colorSettings.endColor}
                      onChange={(e) => handleColorChange('endColor', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                {/* Primary Foreground */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Primary Foreground
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <input
                      type="color"
                      value={colorSettings.primaryForeground}
                      onChange={(e) => handleColorChange('primaryForeground', e.target.value)}
                      style={{
                        width: '3.5rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: '2px solid #d1d5db',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colorSettings.primaryForeground}
                      onChange={(e) => handleColorChange('primaryForeground', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Sidebar Foreground */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Sidebar Foreground
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <input
                      type="color"
                      value={colorSettings.sidebarForeground}
                      onChange={(e) => handleColorChange('sidebarForeground', e.target.value)}
                      style={{
                        width: '3.5rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: '2px solid #d1d5db',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colorSettings.sidebarForeground}
                      onChange={(e) => handleColorChange('sidebarForeground', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                {/* Secondary */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Secondary
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <input
                      type="color"
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      style={{
                        width: '3.5rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: '2px solid #d1d5db',
                        flexShrink: 0
                      }}
                    />
                    <input
                      type="text"
                      value={colorSettings.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Preview
                  </label>
                  <div
                    style={{
                      height: '6rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      background: `linear-gradient(135deg, ${colorSettings.startColor}, ${colorSettings.endColor})`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setShowColorPopup(false)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease-in-out'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveColors}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease-in-out'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #7c3aed)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)'}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
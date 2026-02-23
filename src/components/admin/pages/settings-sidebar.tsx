import React, { useState, useEffect } from 'react';
import {
  Palette, Lock, User, Bell, Shield, Globe,
  Plus, Edit, Trash2, Eye, Search, X, Settings,
  ChevronLeft, FileText, Stethoscope, MessageSquare,
  ClipboardCheck, Heart, Activity, AlertCircle,
  MessageCircle, CreditCard, Zap, Clock, RefreshCw,
  Upload, Download, File, FileText as FileIcon, CheckCircle, AlertTriangle
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

// WhatsApp Integration Types
interface WhatsAppSettings {
  isEnabled: boolean;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  walocalApiKey: string;
  messageLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  expiryDate?: string;
  autoRecharge: boolean;
  rechargeThreshold: number;
  lastRechargeDate?: string;
  totalMessagesPurchased?: number;
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED';
  messagingTier?: string;
}

interface RechargePackage {
  id: string;
  name: string;
  messageCount: number;
  price: number;
  validityDays: number;
  popular?: boolean;
}

interface MessageHistory {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  type: 'appointment' | 'reminder' | 'promotional' | 'test' | 'document' | 'other';
  messageId?: string;
  metadata?: {
    fileType?: string;
    fileSize?: number;
    fileName?: string;
    mediaId?: string;
  };
  error?: string;
}

export default function SettingsGrid() {
  const userId = useSelector((state: any) => state?.auth?.user?.id) ?? null;
  const token = useSelector((state: any) => state?.auth?.token) ?? null;
  const clinicId = useSelector((state: any) => state?.auth?.user?.clinicId) ?? null;

  const [activeSettingsTab, setActiveSettingsTab] = useState<'grid' | 'practice' | 'whatsapp'>('grid');
  const [activeProcedureTab, setActiveProcedureTab] = useState<string>('treatment-procedures');
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [showProcedureDrawer, setShowProcedureDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [showDocumentSender, setShowDocumentSender] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [documentCaption, setDocumentCaption] = useState('');
  const [walocalStatus, setWalocalStatus] = useState<any>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [historyFilters, setHistoryFilters] = useState({
    type: '',
    status: '',
    page: 1
  });
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });

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

  // WhatsApp State - WALOCAL Configuration
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    isEnabled: false,
    phoneNumber: '+91 90740 85694',
    phoneNumberId: '1003912882796252',
    businessAccountId: '',
    walocalApiKey: '7ea296-0db531-3e53ce-f3bce8-8abd48',
    messageLimit: 1000,
    messagesUsed: 0,
    messagesRemaining: 1000,
    autoRecharge: false,
    rechargeThreshold: 100,
    qualityRating: 'GREEN',
    messagingTier: 'TIER_1K'
  });

  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [rechargePackages] = useState<RechargePackage[]>([
    {
      id: 'basic',
      name: 'Basic Pack',
      messageCount: 1000,
      price: 499,
      validityDays: 30
    },
    {
      id: 'standard',
      name: 'Standard Pack',
      messageCount: 5000,
      price: 1999,
      validityDays: 30,
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      messageCount: 10000,
      price: 3499,
      validityDays: 60
    },
    {
      id: 'unlimited',
      name: 'Unlimited Pack',
      messageCount: 50000,
      price: 12999,
      validityDays: 90
    }
  ]);

  // Axios configuration
  const api = axios.create({
    baseURL: clinicServiceBaseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const whatsappApi = axios.create({
    baseURL: baseUrl,
    headers: {
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

  // Helper functions
  const getActiveTabConfig = () => {
    return tabConfigs.find(tab => tab.key === activeProcedureTab) || tabConfigs[0];
  };

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

  // Fetch WhatsApp settings
  const fetchWhatsAppSettings = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching WhatsApp settings for clinicId:", userId);
      const response = await whatsappApi.get(`api/v1/whatsapp/settings/${userId}`);

      if (response.data.success) {
        const settings = response.data.data;
        console.log("Received settings:", settings);

        if (settings && Object.keys(settings).length > 0) {
          setWhatsappSettings({
            isEnabled: settings.isEnabled || false,
            phoneNumber: settings.phoneNumber || '+91 90740 85694',
            phoneNumberId: settings.phoneNumberId || '1003912882796252',
            businessAccountId: settings.businessAccountId || '',
            walocalApiKey: '', // Don't store in state
            messageLimit: settings.messageLimit || 1000,
            messagesUsed: settings.messagesUsed || 0,
            messagesRemaining: settings.messagesRemaining || 1000,
            autoRecharge: settings.autoRecharge || false,
            rechargeThreshold: settings.rechargeThreshold || 100,
            lastRechargeDate: settings.lastRechargeDate,
            totalMessagesPurchased: settings.totalMessagesPurchased,
            qualityRating: settings.qualityRating || 'GREEN',
            messagingTier: settings.messagingTier || 'TIER_1K'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify WALOCAL connection
  const verifyWalocalConnection = async () => {
    if (!whatsappSettings.phoneNumberId) {
      alert('Phone Number ID is required for verification');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationMessage('Verifying connection...');
      
      const response = await whatsappApi.post(`api/v1/whatsapp/verify`, {
        clinicId: userId,
        phoneNumberId: whatsappSettings.phoneNumberId
        // No need to send apiKey as it's using env var on backend
      });
      
      if (response.data.success) {
        setWalocalStatus(response.data.data);
        setVerificationMessage('✅ Connection verified successfully!');
        setTimeout(() => setVerificationMessage(''), 3000);
      } else {
        setVerificationMessage('❌ Verification failed. Please check your Phone Number ID.');
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      setVerificationMessage(error.response?.data?.message || '❌ Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch message history
  const fetchMessageHistory = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });

      if (historyFilters.type) params.append('type', historyFilters.type);
      if (historyFilters.status) params.append('status', historyFilters.status);

      const response = await whatsappApi.get(`api/v1/whatsapp/history/${userId}?${params.toString()}`);

      if (response.data.success) {
        setMessageHistory(response.data.data);
        setHistoryPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save WhatsApp settings with WALOCAL
  const handleSaveWhatsAppSettings = async () => {
    try {
      setIsLoading(true);

      const settingsData = {
        clinicId: userId,
        phoneNumber: whatsappSettings.phoneNumber,
        phoneNumberId: whatsappSettings.phoneNumberId,
        businessAccountId: whatsappSettings.businessAccountId,
        walocalApiKey: whatsappSettings.walocalApiKey, // Will be saved if provided
        isEnabled: true,
        autoRecharge: whatsappSettings.autoRecharge,
        rechargeThreshold: whatsappSettings.rechargeThreshold
        // Backend will set default values for messageLimit, qualityRating etc.
      };

      console.log("Saving WALOCAL settings:", settingsData);

      const response = await whatsappApi.post(`api/v1/whatsapp/settings`, settingsData);

      if (response.data.success) {
        alert('✅ WALOCAL connected successfully! Your WhatsApp is now active.');
        
        setWhatsappSettings(prev => ({
          ...prev,
          isEnabled: true
        }));

        await fetchWhatsAppSettings();
        setShowWhatsAppSetup(false);
        
        // Verify connection after saving
        await verifyWalocalConnection();

      } else {
        alert(response.data.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving WhatsApp settings:', error);
      alert(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recharge
  const handleRecharge = async () => {
    if (!selectedPackage) return;

    try {
      setIsLoading(true);
      const response = await whatsappApi.post(`api/v1/whatsapp/recharge`, {
        clinicId: userId,
        packageId: selectedPackage.id,
        messageCount: selectedPackage.messageCount,
        amount: selectedPackage.price,
        paymentMethod: 'online'
      });

      if (response.data.success) {
        alert(`✅ Successfully recharged with ${selectedPackage.messageCount} messages!`);
        setShowRechargeModal(false);
        setSelectedPackage(null);
        fetchWhatsAppSettings();
      } else {
        alert(response.data.message || 'Recharge failed');
      }
    } catch (error: any) {
      console.error('Error during recharge:', error);
      alert(error.response?.data?.message || 'Recharge failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Send test message
  const handleSendTestMessage = async () => {
    if (!whatsappSettings.phoneNumberId) {
      alert('Please set up your WALOCAL credentials first');
      return;
    }

    if (whatsappSettings.messagesRemaining <= 0) {
      alert('No messages remaining. Please recharge to continue.');
      setShowRechargeModal(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await whatsappApi.post(`api/v1/whatsapp/send-test`, {
        clinicId: userId,
        to: whatsappSettings.phoneNumber, // Send to yourself for testing
        message: '✅ Test message from Denstack! Your WALOCAL integration is working!'
      });

      if (response.data.success) {
        setWhatsappSettings(prev => ({
          ...prev,
          messagesUsed: prev.messagesUsed + 1,
          messagesRemaining: prev.messagesRemaining - 1
        }));
        alert('✅ Test message sent successfully! Check your WhatsApp.');

        fetchMessageHistory();

        if (whatsappSettings.autoRecharge &&
          whatsappSettings.messagesRemaining <= whatsappSettings.rechargeThreshold) {
          setShowRechargeModal(true);
        }
      } else {
        alert(response.data.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100MB limit');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, TXT, ODT, ODS, or RTF files.');
      return;
    }

    setSelectedFile(file);
  };

  // Send document
  const handleSendDocument = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    if (!recipientNumber) {
      alert('Please enter recipient phone number');
      return;
    }

    if (whatsappSettings.messagesRemaining <= 0) {
      alert('No messages remaining. Please recharge to continue.');
      setShowRechargeModal(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('clinicId', userId);
    formData.append('recipient', recipientNumber);
    formData.append('caption', documentCaption);
    formData.append('filename', selectedFile.name);
    // No need to append phoneNumberId as backend gets it from settings

    try {
      setIsLoading(true);
      const response = await whatsappApi.post('api/v1/whatsapp/send-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        alert('✅ Document sent successfully!');
        setSelectedFile(null);
        setRecipientNumber('');
        setDocumentCaption('');
        setUploadProgress(0);
        setShowDocumentSender(false);

        setWhatsappSettings(prev => ({
          ...prev,
          messagesUsed: prev.messagesUsed + 1,
          messagesRemaining: prev.messagesRemaining - 1
        }));

        fetchMessageHistory();
      } else {
        alert(response.data.message || 'Failed to send document');
      }
    } catch (error: any) {
      console.error('Error sending document:', error);
      alert(error.response?.data?.message || 'Failed to send document');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp? This will remove your settings.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await whatsappApi.post(`api/v1/whatsapp/disconnect/${userId}`);

      if (response.data.success) {
        alert('WhatsApp disconnected successfully');
        setWhatsappSettings({
          isEnabled: false,
          phoneNumber: '+91 90740 85694',
          phoneNumberId: '1003912882796252',
          businessAccountId: '',
          walocalApiKey: '7ea296-0db531-3e53ce-f3bce8-8abd48',
          messageLimit: 1000,
          messagesUsed: 0,
          messagesRemaining: 1000,
          autoRecharge: false,
          rechargeThreshold: 100,
          qualityRating: 'GREEN',
          messagingTier: 'TIER_1K'
        });
        setWalocalStatus(null);
      }
    } catch (error: any) {
      console.error('Error disconnecting WhatsApp:', error);
      alert(error.response?.data?.message || 'Failed to disconnect');
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

  const handleSaveColors = async () => {
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

  // Effects
  useEffect(() => {
    if (activeSettingsTab === 'practice') {
      fetchItems();
    } else if (activeSettingsTab === 'whatsapp') {
      fetchWhatsAppSettings();
      fetchMessageHistory();
    }
  }, [activeSettingsTab, activeProcedureTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSettingsTab === 'practice') {
        fetchItems(1, searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeProcedureTab]);

  useEffect(() => {
    if (whatsappSettings.autoRecharge &&
      whatsappSettings.messagesRemaining <= whatsappSettings.rechargeThreshold &&
      whatsappSettings.messagesRemaining > 0) {
      console.log('Low message count:', whatsappSettings.messagesRemaining);
    }
  }, [whatsappSettings.messagesRemaining, whatsappSettings.autoRecharge, whatsappSettings.rechargeThreshold]);

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

  const settingsCards = [
    {
      id: 'colors',
      icon: Palette,
      title: 'Color Changing',
      description: 'Customize your theme colors',
      onClick: () => setShowColorPopup(true)
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      title: 'WhatsApp via WALOCAL',
      description: 'Integrated with WALOCAL - 99.98% delivery rate',
      onClick: () => {
        setActiveSettingsTab('whatsapp');
        fetchWhatsAppSettings();
      }
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

  const activeTab = getActiveTabConfig();
  const singularTitle = getSingularTitle();
  const itemTypeName = getItemTypeName();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {activeSettingsTab === 'grid' ? (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600 mb-6">Manage your account preferences and settings</p>

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
      ) : activeSettingsTab === 'whatsapp' ? (
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
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">WALOCAL WhatsApp Integration</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base truncate">
                  Powered by WALOCAL - 99.98% delivery rate • 1.8s average speed
                </p>
              </div>
              {whatsappSettings.isEnabled && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowDocumentSender(!showDocumentSender)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Send Document
                  </button>
                  <button
                    onClick={() => setShowMessageHistory(!showMessageHistory)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    {showMessageHistory ? 'Hide History' : 'View History'}
                  </button>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Recharge Messages
                  </button>
                </div>
              )}
            </div>
          </div>

          {!whatsappSettings.isEnabled && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Your WALOCAL account is ready!</p>
                  <p className="text-green-600 text-sm">Phone: +91 90740 85694 • Phone ID: 1003912882796252 • Status: CONNECTED • Quality: GREEN</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">WALOCAL Message Credits</h3>
                  <p className="text-sm text-gray-600">Tier: {whatsappSettings.messagingTier} • Quality: {whatsappSettings.qualityRating}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Used</p>
                  <p className="text-2xl font-bold text-gray-800">{whatsappSettings.messagesUsed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className={`text-2xl font-bold ${whatsappSettings.messagesRemaining <= 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {whatsappSettings.messagesRemaining}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daily Limit</p>
                  <p className="text-2xl font-bold text-gray-800">{whatsappSettings.messageLimit}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${whatsappSettings.messagesRemaining <= 100 ? 'bg-red-600' : 'bg-green-600'}`}
                  style={{ width: `${(whatsappSettings.messagesUsed / whatsappSettings.messageLimit) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {whatsappSettings.messagesRemaining} messages remaining today (resets at midnight)
              </p>
            </div>

            {verificationMessage && (
              <div className="mt-2 text-sm text-center" style={{ color: verificationMessage.includes('✅') ? '#10b981' : '#ef4444' }}>
                {verificationMessage}
              </div>
            )}
          </div>

          {showDocumentSender && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Document via WALOCAL</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+919074085694"
                  />
                  <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.odt,.ods,.rtf"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, ODT, ODS, RTF (Max 100MB)
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-sm text-gray-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading: {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={documentCaption}
                    onChange={(e) => setDocumentCaption(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a caption for your document"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDocumentSender(false);
                      setSelectedFile(null);
                      setRecipientNumber('');
                      setDocumentCaption('');
                      setUploadProgress(0);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendDocument}
                    disabled={!selectedFile || !recipientNumber || isLoading || whatsappSettings.messagesRemaining <= 0}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : `Send Document (${whatsappSettings.messagesRemaining} credits left)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showMessageHistory ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {!whatsappSettings.isEnabled ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Activate Your WALOCAL Connection</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Your WALOCAL account is ready. Just click activate to start sending WhatsApp messages.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Business Number
                      </label>
                      <input
                        type="tel"
                        value={whatsappSettings.phoneNumber}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={whatsappSettings.phoneNumberId}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your Phone Number ID"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your WALOCAL Phone Number ID (e.g., 1003912882796252)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WALOCAL API Key (Optional)
                      </label>
                      <input
                        type="password"
                        value={whatsappSettings.walocalApiKey}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, walocalApiKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your API key if different from default"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to use default WALOCAL API key</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={verifyWalocalConnection}
                        disabled={isVerifying || !whatsappSettings.phoneNumberId}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify Connection'}
                      </button>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        WALOCAL Account Status
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>✓ Phone: +91 90740 85694 (Verified)</li>
                        <li>✓ Quality Rating: GREEN (Excellent)</li>
                        <li>✓ Daily Limit: 1,000 messages (TIER_1K)</li>
                        <li>✓ Platform: Cloud API</li>
                        <li>✓ Status: CONNECTED</li>
                      </ul>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSaveWhatsAppSettings}
                        disabled={!whatsappSettings.phoneNumberId || isLoading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Activating...' : 'Activate WALOCAL WhatsApp'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">WALOCAL Settings</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected via WALOCAL
                      </span>
                      <button
                        onClick={handleDisconnectWhatsApp}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        {whatsappSettings.phoneNumber}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number ID
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        {whatsappSettings.phoneNumberId}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Rating
                      </label>
                      <p className="text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200 font-medium">
                        {whatsappSettings.qualityRating} ✓
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Message Tier
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        {whatsappSettings.messagingTier} (1,000 messages/day)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto Recharge
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={whatsappSettings.autoRecharge}
                            onChange={(e) => setWhatsappSettings({ ...whatsappSettings, autoRecharge: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm text-gray-600">
                          Automatically recharge when low
                        </span>
                      </div>
                    </div>

                    {whatsappSettings.autoRecharge && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recharge Threshold
                        </label>
                        <input
                          type="number"
                          min="10"
                          max={whatsappSettings.messageLimit}
                          value={whatsappSettings.rechargeThreshold}
                          onChange={(e) => setWhatsappSettings({ ...whatsappSettings, rechargeThreshold: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-recharge when messages fall below this number
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-4">Test Your WALOCAL Connection</h4>
                    <div className="flex gap-3">
                      <button
                        onClick={verifyWalocalConnection}
                        disabled={isVerifying}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify Connection'}
                      </button>
                      <button
                        onClick={handleSendTestMessage}
                        disabled={whatsappSettings.messagesRemaining <= 0}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 font-medium disabled:opacity-50"
                      >
                        Send Test Message
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Test message will be sent to {whatsappSettings.phoneNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Message History</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={historyFilters.type}
                      onChange={(e) => {
                        setHistoryFilters({ ...historyFilters, type: e.target.value, page: 1 });
                        fetchMessageHistory(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="test">Test</option>
                      <option value="document">Document</option>
                      <option value="appointment">Appointment</option>
                      <option value="reminder">Reminder</option>
                    </select>
                    <select
                      value={historyFilters.status}
                      onChange={(e) => {
                        setHistoryFilters({ ...historyFilters, status: e.target.value, page: 1 });
                        fetchMessageHistory(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="read">Read</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message / Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {messageHistory.length > 0 ? (
                      messageHistory.map((msg) => (
                        <tr key={msg.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {msg.recipient}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                            {msg.type === 'document' ? (
                              <div className="flex items-center gap-2">
                                {getFileIcon(msg.metadata?.fileType || '')}
                                <span className="truncate">{msg.metadata?.fileName || msg.message}</span>
                              </div>
                            ) : (
                              <p className="truncate">{msg.message}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="capitalize">{msg.type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(msg.status)}`}>
                              {msg.status}
                            </span>
                            {msg.error && (
                              <span className="ml-2 text-xs text-red-600" title={msg.error}>
                                ⚠️
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(msg.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium mb-1">No messages sent yet</p>
                          <p className="text-sm">Send a test message to see history</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {historyPagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing {messageHistory.length} of {historyPagination.totalItems} messages
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newPage = historyPagination.currentPage - 1;
                          setHistoryFilters({ ...historyFilters, page: newPage });
                          fetchMessageHistory(newPage);
                        }}
                        disabled={historyPagination.currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm">
                        Page {historyPagination.currentPage} of {historyPagination.totalPages}
                      </span>
                      <button
                        onClick={() => {
                          const newPage = historyPagination.currentPage + 1;
                          setHistoryFilters({ ...historyFilters, page: newPage });
                          fetchMessageHistory(newPage);
                        }}
                        disabled={historyPagination.currentPage === historyPagination.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
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
      ) : (
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
                    className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${activeProcedureTab === tab.key
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

              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading {activeTab.title.toLowerCase()}...</p>
                </div>
              )}

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
                            className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors ${pagination.hasPreviousPage
                              ? 'text-gray-700 bg-white hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              }`}
                          >
                            Previous
                          </button>
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
                                className={`px-3 py-1.5 text-sm font-medium border rounded-md transition-colors ${pagination.currentPage === pageNum
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
                            className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md transition-colors ${pagination.hasNextPage
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

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    onChange={(e) => setProcedureForm({ ...procedureForm, name: e.target.value })}
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
                    onChange={(e) => setProcedureForm({ ...procedureForm, description: e.target.value })}
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
                      onChange={(e) => setProcedureForm({ ...procedureForm, price: e.target.value })}
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

      {showRechargeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '56rem',
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
                    background: 'linear-gradient(to bottom right, #10b981, #059669)',
                    borderRadius: '0.5rem'
                  }}>
                    <Zap style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    Recharge WALOCAL Messages
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowRechargeModal(false);
                    setSelectedPackage(null);
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

            <div style={{ padding: '1.5rem' }}>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                Current Balance: <span className="font-semibold text-gray-900">{whatsappSettings.messagesRemaining} messages</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rechargePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    style={{
                      border: selectedPackage?.id === pkg.id ? '2px solid #10b981' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      position: 'relative',
                      backgroundColor: selectedPackage?.id === pkg.id ? '#f0fdf4' : 'white'
                    }}
                  >
                    {pkg.popular && (
                      <span style={{
                        position: 'absolute',
                        top: '-0.5rem',
                        right: '1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        Popular
                      </span>
                    )}
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}>
                      {pkg.name}
                    </h3>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#10b981',
                      marginBottom: '0.5rem'
                    }}>
                      ₹{pkg.price}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#4b5563',
                      marginBottom: '0.25rem'
                    }}>
                      {pkg.messageCount} messages
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      Valid for {pkg.validityDays} days
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => {
                    setShowRechargeModal(false);
                    setSelectedPackage(null);
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
                  onClick={handleRecharge}
                  disabled={!selectedPackage}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: !selectedPackage ? '#d1d5db' : 'linear-gradient(to right, #10b981, #059669)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: !selectedPackage ? 'not-allowed' : 'pointer',
                    opacity: !selectedPackage ? 0.5 : 1,
                    transition: 'opacity 0.15s ease-in-out, background 0.15s ease-in-out'
                  }}
                  onMouseOver={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)';
                    }
                  }}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
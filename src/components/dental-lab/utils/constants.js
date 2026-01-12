// src/modules/dental-lab/utils/constants.js
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  READY: 'ready'
};

export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'ready', label: 'Ready' }
];

export const LAB_VENDORS = [
  { id: '1', name: 'Premium Dental Lab', email: 'contact@premiumlab.com', phone: '+1 (555) 123-4567' },
  { id: '2', name: 'Quick Lab Services', email: 'info@quicklab.com', phone: '+1 (555) 987-6543' },
  { id: '3', name: 'Elite Ceramics Lab', email: 'support@eliteceramics.com', phone: '+1 (555) 456-7890' },
  { id: '4', name: 'Precision Prosthetics', email: 'hello@precisionlab.com', phone: '+1 (555) 321-0987' },
];

export const DOCTORS = [
  { id: '1', name: 'Dr. Smith', specialty: 'Orthodontics' },
  { id: '2', name: 'Dr. Johnson', specialty: 'Prosthodontics' },
  { id: '3', name: 'Dr. Williams', specialty: 'Endodontics' },
  { id: '4', name: 'Dr. Brown', specialty: 'Periodontics' },
];

export const ORDER_TYPES = [
  { value: 'crown', label: 'Crown' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'denture', label: 'Denture' },
  { value: 'veneer', label: 'Veneer' },
  { value: 'implant', label: 'Implant' },
  { value: 'night-guard', label: 'Night Guard' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'other', label: 'Other' }
];

export const FILE_TYPES = {
  XRAY: 'xray',
  SCAN: 'scan',
  PHOTO: 'photo',
  PDF: 'pdf',
  DICOM: 'dicom'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
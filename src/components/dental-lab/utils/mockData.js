// src/modules/dental-lab/utils/mockData.js
export const stats = {
  totalLabs: 5,
  pendingCount: 12,
  completedCount: 45,
  totalOrders: 67,
  monthlyRevenue: 15420,
  revenueGrowth: 12.5
};

export const orders = [
  {
    _id: '1',
    patientname: 'John Doe',
    doctorName: 'Dr. Smith',
    vendor: 'Premium Dental Lab',
    status: 'pending',
    deliveryDate: '2026-01-15',
    price: 450,
    createdAt: '2026-01-05',
    note: 'Crown preparation for tooth #14',
    attachments: [{ fileName: 'xray.jpg', fileUrl: '/uploads/xray.jpg' }]
  },
  {
    _id: '2',
    patientname: 'Jane Smith',
    doctorName: 'Dr. Johnson',
    vendor: 'Quick Lab Services',
    status: 'in-progress',
    deliveryDate: '2026-01-12',
    price: 320,
    createdAt: '2026-01-03',
    note: 'Bridge for teeth #6-8',
    attachments: []
  },
  {
    _id: '3',
    patientname: 'Mike Wilson',
    doctorName: 'Dr. Smith',
    vendor: 'Premium Dental Lab',
    status: 'completed',
    deliveryDate: '2026-01-08',
    price: 580,
    createdAt: '2025-12-28',
    note: 'Full denture upper',
    resultFiles: [{ fileName: 'result.pdf', fileUrl: '/uploads/result.pdf' }]
  },
  {
    _id: '4',
    patientname: 'Sarah Johnson',
    doctorName: 'Dr. Williams',
    vendor: 'Elite Ceramics Lab',
    status: 'ready',
    deliveryDate: '2026-01-10',
    price: 680,
    createdAt: '2026-01-02',
    note: 'Veneers set of 6',
    resultFiles: [{ fileName: 'final.pdf', fileUrl: '/uploads/final.pdf' }]
  }
];
// // src/modules/dental-lab/utils/statusConfig.js
// import { Clock, Activity, CheckCircle, XCircle, Sparkles } from 'lucide-react';

// export const getStatusConfig = (status) => {
//   const configs = {
//     pending: { 
//       bg: 'bg-gradient-to-br from-amber-50 to-orange-50', 
//       text: 'text-amber-700',
//       border: 'border-amber-200',
//       icon: <Clock className="w-4 h-4" />,
//       badge: 'bg-amber-100 text-amber-700'
//     },
//     'in-progress': { 
//       bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', 
//       text: 'text-blue-700',
//       border: 'border-blue-200',
//       icon: <Activity className="w-4 h-4" />,
//       badge: 'bg-blue-100 text-blue-700'
//     },
//     completed: { 
//       bg: 'bg-gradient-to-br from-emerald-50 to-green-50', 
//       text: 'text-emerald-700',
//       border: 'border-emerald-200',
//       icon: <CheckCircle className="w-4 h-4" />,
//       badge: 'bg-emerald-100 text-emerald-700'
//     },
//     cancelled: { 
//       bg: 'bg-gradient-to-br from-red-50 to-rose-50', 
//       text: 'text-red-700',
//       border: 'border-red-200',
//       icon: <XCircle className="w-4 h-4" />,
//       badge: 'bg-red-100 text-red-700'
//     },
//     ready: { 
//       bg: 'bg-gradient-to-br from-purple-50 to-violet-50', 
//       text: 'text-purple-700',
//       border: 'border-purple-200',
//       icon: <Sparkles className="w-4 h-4" />,
//       badge: 'bg-purple-100 text-purple-700'
//     }
//   };
//   return configs[status] || configs.pending;
// };
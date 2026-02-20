// // components/DoctorModeToggle.tsx - UPDATED VERSION

// import { useState } from "react";
// import { Stethoscope, Building2, ArrowRightLeft } from "lucide-react";
// import { useAppSelector, useAppDispatch } from "../../redux/hook";
// import { toggleUserMode, setUserMode } from "../../redux/slice/authSlice";
// import { useNavigate } from "react-router-dom";

// export function DoctorModeToggle() {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
  
//   const { isHybrid, activeMode, clinicId, doctorId } = useAppSelector(
//     (state) => state.auth
//   );
  
//   const [isHovered, setIsHovered] = useState(false);
  
//   // If not hybrid, don't render
//   if (!isHybrid) return null;
  
//   const handleToggle = () => {
//     const currentMode = activeMode;
//     dispatch(toggleUserMode());
    
//     // Navigate based on the target mode (not current mode)
//     if (currentMode === 'clinic') {
//       // Switching to doctor mode - DIRECT REDIRECT
//       if (doctorId && clinicId) {
//         const token = localStorage.getItem('token');
//         const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(token || '')}&role=760&doctorId=${doctorId}&clinicId=${clinicId}`;
//         // Immediate redirect - no setTimeout
//         window.location.href = redirectURL;
//       } else {
//         console.error("Missing doctorId or clinicId for doctor mode");
//       }
//     } else {
//       // Switching to clinic mode - stay in main app
//       navigate(`/dashboard/${clinicId}`);
//     }
//   };
  
//   const handleDirectNav = (mode: 'clinic' | 'doctor') => {
//     dispatch(setUserMode(mode));
    
//     if (mode === 'doctor') {
//       // Go to doctor portal - DIRECT REDIRECT
//       if (doctorId && clinicId) {
//         const token = localStorage.getItem('token');
//         const redirectURL = `http://localhost:3001/login-redirect?token=${encodeURIComponent(token || '')}&role=760&doctorId=${doctorId}&clinicId=${clinicId}`;
//         // Immediate redirect
//         window.location.href = redirectURL;
//       }
//     } else {
//       // Stay in clinic mode
//       navigate(`/dashboard/${clinicId}`);
//     }
//   };
  
//   return (
//     <div className="relative">
//       {/* Main Toggle Button */}
//       <button
//         onClick={handleToggle}
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//         className={`
//           w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
//           ${activeMode === 'doctor' 
//             ? 'bg-blue-50 text-blue-600 border border-blue-200' 
//             : 'bg-green-50 text-green-600 border border-green-200'
//           }
//           hover:shadow-md
//         `}
//       >
//         {activeMode === 'doctor' ? (
//           <Stethoscope className="w-5 h-5" />
//         ) : (
//           <Building2 className="w-5 h-5" />
//         )}
        
//         <span className="text-sm font-medium flex-1 text-left">
//           {activeMode === 'doctor' ? '👨‍⚕️ Doctor Mode' : '🏥 Clinic Mode'}
//         </span>
        
//         <ArrowRightLeft className="w-4 h-4 opacity-70" />
//       </button>
      
//       {/* Quick Switch Dropdown on Hover */}
//       {isHovered && (
//         <div 
//           className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border p-1 z-50"
//           onMouseEnter={() => setIsHovered(true)}
//           onMouseLeave={() => setIsHovered(false)}
//         >
//           <button
//             onClick={() => handleDirectNav('clinic')}
//             className={`
//               w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
//               ${activeMode === 'clinic' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'}
//             `}
//           >
//             <Building2 className="w-4 h-4" />
//             <span>Clinic Mode</span>
//             {activeMode === 'clinic' && <span className="ml-auto text-xs">Active</span>}
//           </button>
          
//           <button
//             onClick={() => handleDirectNav('doctor')}
//             className={`
//               w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
//               ${activeMode === 'doctor' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}
//             `}
//           >
//             <Stethoscope className="w-4 h-4" />
//             <span>Doctor Mode</span>
//             {activeMode === 'doctor' && <span className="ml-auto text-xs">Active</span>}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
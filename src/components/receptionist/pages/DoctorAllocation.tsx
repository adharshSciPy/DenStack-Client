import { useEffect, useState } from 'react';
import { Users, MapPin, Clock, Activity, User, RefreshCw, Calendar, Phone, Mail } from 'lucide-react';
import styles from '../styles/Doctor.module.css';
import { useAppSelector } from "../../../redux/hook";
import axios from 'axios';
import clinicServiceBaseUrl from "../../../clinicServiceBaseUrl";

interface Doctor {
  _id: string;
  doctorId: string;
  doctor: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: number;
    specialization?: string;
  };
  roleInClinic: string;
  standardConsultationFee: number;
  status: string;
  clinicLogin: Record<string, any>;
}

interface ApiResponse {
  clinicId: string;
  doctors: Doctor[];
  limit: number;
  page: number;
  success: boolean;
  totalDoctors: number;
}

interface ReceptionistUser {
  id: string;
  name: string;
  clinicId: string;
  clinicData?: ClinicData;
}

interface ClinicData {
  _id: string;
  name: string;
}

export default function DoctorAllocation() {
  const reception = useAppSelector(
    (state) => state.auth.user
  ) as ReceptionistUser | null;

  const clinicId = reception?.clinicData?._id || "";
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getItemClass = (status: string) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'active':
        return styles.itemAvailable;
      case 'busy':
        return styles.itemBusy;
      case 'on break':
      case 'away':
        return styles.itemBreak;
      default:
        return '';
    }
  };

  const getStatusIndicatorClass = (status: string) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'active':
        return styles.statusIndicatorGreen;
      case 'busy':
        return styles.statusIndicatorRed;
      case 'on break':
      case 'away':
        return styles.statusIndicatorOrange;
      default:
        return '';
    }
  };

  const formatPhoneNumber = (phoneNumber?: number | string): string => {
    if (!phoneNumber) return 'Not available';
    
    try {
      const numStr = phoneNumber.toString();
      if (numStr.length === 10) {
        return `+91 ${numStr.slice(0,5)} ${numStr.slice(5)}`;
      }
      return numStr;
    } catch (err) {
      console.error('Error formatting phone number:', err);
      return 'Invalid number';
    }
  };

  const handleRefresh = async () => {
    await fetchDoctors();
  };

  const handleAssignPatient = (doctorId: string) => {
    console.log('Assigning patient to doctor:', doctorId);
    // Implementation would go here
  };

  const fetchDoctors = async () => {
    if (!clinicId) {
      setError('Clinic ID not found');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ApiResponse>(
        `${clinicServiceBaseUrl}/api/v1/clinic-service/active-doctors`,
        { params: { clinicId } }
      );
      
      if (res.data.success && Array.isArray(res.data.doctors)) {
        // Ensure all doctor objects have required properties
        const sanitizedDoctors = res.data.doctors.map(doctor => ({
          ...doctor,
          doctor: {
            _id: doctor.doctor?._id || doctor.doctorId || '',
            name: doctor.doctor?.name || 'Unknown Doctor',
            email: doctor.doctor?.email || 'No email',
            phoneNumber: doctor.doctor?.phoneNumber,
            specialization: doctor.doctor?.specialization || 'Not specified',
          },
          status: doctor.status || 'unknown',
          roleInClinic: doctor.roleInClinic || 'Not specified',
          standardConsultationFee: doctor.standardConsultationFee || 0,
        }));
        
        setDoctors(sanitizedDoctors);
      } else {
        setDoctors([]);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err.response?.data?.message || 'Failed to fetch doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [clinicId]);

  // Calculate stats based on API data
  const availableDoctors = doctors.filter(d => d.status?.toLowerCase() === 'active').length;
  const busyDoctors = doctors.filter(d => d.status?.toLowerCase() === 'busy').length;
  const onBreakDoctors = doctors.filter(d => 
    d.status?.toLowerCase() === 'on break' || d.status?.toLowerCase() === 'away'
  ).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Doctor Allocation & Room Management</h1>
          <p className={styles.subtitle}>Manage doctor availability and room assignments in real-time</p>
        </div>
        <button 
          className={styles.refreshBtn} 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? styles.spin : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <Users size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Available Doctors</p>
            <p className={styles.statValue}>{availableDoctors}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <Activity size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Busy Doctors</p>
            <p className={styles.statValue}>{busyDoctors}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <Clock size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>On Break</p>
            <p className={styles.statValue}>{onBreakDoctors}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <User size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Total Doctors</p>
            <p className={styles.statValue}>{doctors.length}</p>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          Doctors ({doctors.length})
        </h2>
        {loading ? (
          <div className={styles.loadingContainer}>
            <RefreshCw size={24} className={styles.spin} />
            <p>Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No doctors found for this clinic.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {doctors.map((doctor) => {
              const doctorName = doctor.doctor?.name || 'Unknown Doctor';
              const initials = doctorName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              const status = doctor.status || 'unknown';
              const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
              
              return (
                <div key={doctor._id || doctor.doctorId} className={`${styles.card} ${getItemClass(status)}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      {initials}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardTitle}>{doctorName}</h3>
                      <p className={styles.cardSubtitle}>{doctor.doctor?.specialization || 'Not specified'}</p>
                    </div>
                    <span className={`${styles.statusBadge} ${getStatusIndicatorClass(status)}`}>
                      {formattedStatus}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <Mail size={16} />
                      <span>{doctor.doctor?.email || 'No email'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <Phone size={16} />
                      <span>{formatPhoneNumber(doctor.doctor?.phoneNumber)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <Users size={16} />
                      <span>Role: {doctor.roleInClinic?.charAt(0).toUpperCase() + doctor.roleInClinic?.slice(1) || 'Not specified'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <Calendar size={16} />
                      <span>Fee: ₹{doctor.standardConsultationFee || 0}</span>
                    </div>
                    
                    {status.toLowerCase() === 'active' && (
                      <button 
                        className={styles.assignBtn}
                        onClick={() => handleAssignPatient(doctor.doctorId)}
                      >
                        Assign Patient
                      </button>
                    )}
                    
                    {status.toLowerCase() === 'busy' && (
                      <div className={styles.infoRow}>
                        <Clock size={16} />
                        <span>Currently with patient</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
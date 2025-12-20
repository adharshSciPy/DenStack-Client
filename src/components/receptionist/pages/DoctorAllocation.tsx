import { useState } from 'react';
import { Users, MapPin, Clock, Activity, User, RefreshCw, Calendar, Phone, Mail } from 'lucide-react';
import styles from '../styles/Doctor.module.css';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: 'available' | 'busy' | 'break';
  currentPatient?: string;
  room?: string;
  nextAvailable?: string;
}

interface Room {
  id: string;
  name: string;
  status: 'vacant' | 'occupied' | 'cleaning';
  occupiedBy?: string;
  patient?: string;
}

interface Patient {
  id: string;
  name: string;
  assignedTo: string;
}

export default function DoctorAllocation() {
  const [doctors, setDoctors] = useState<Doctor[]>([
    { 
      id: 'D001', 
      name: 'Dr. Amit Sharma', 
      specialty: 'General Physician', 
      status: 'busy', 
      currentPatient: 'Rahul Verma', 
      room: 'Room 101', 
      nextAvailable: '2:30 PM' 
    },
    { 
      id: 'D002', 
      name: 'Dr. Priya Patel', 
      specialty: 'Pediatrician', 
      status: 'available', 
      room: 'Room 102' 
    },
    { 
      id: 'D003', 
      name: 'Dr. Rajesh Kumar', 
      specialty: 'Cardiologist', 
      status: 'busy', 
      currentPatient: 'Amit Patel', 
      room: 'Room 103', 
      nextAvailable: '3:00 PM' 
    },
    { 
      id: 'D004', 
      name: 'Dr. Meera Singh', 
      specialty: 'Dermatologist', 
      status: 'break', 
      room: 'Room 104', 
      nextAvailable: '3:30 PM' 
    },
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    { 
      id: 'R101', 
      name: 'Room 101', 
      status: 'occupied', 
      occupiedBy: 'Dr. Amit Sharma', 
      patient: 'Rahul Verma' 
    },
    { 
      id: 'R102', 
      name: 'Room 102', 
      status: 'vacant', 
      occupiedBy: 'Dr. Priya Patel' 
    },
    { 
      id: 'R103', 
      name: 'Room 103', 
      status: 'occupied', 
      occupiedBy: 'Dr. Rajesh Kumar', 
      patient: 'Amit Patel' 
    },
    { 
      id: 'R104', 
      name: 'Room 104', 
      status: 'vacant', 
      occupiedBy: 'Dr. Meera Singh' 
    },
    { 
      id: 'R105', 
      name: 'Room 105', 
      status: 'vacant' 
    },
    { 
      id: 'R106', 
      name: 'Room 106', 
      status: 'cleaning' 
    },
  ]);

  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([
    { 
      id: 'P001', 
      name: 'Priya Sharma', 
      assignedTo: 'Dr. Priya Patel' 
    },
    { 
      id: 'P002', 
      name: 'Sneha Reddy', 
      assignedTo: 'Dr. Meera Singh' 
    },
    { 
      id: 'P003', 
      name: 'Vikram Singh', 
      assignedTo: 'Dr. Priya Patel' 
    },
  ]);

  const getItemClass = (status: string) => {
    switch (status) {
      case 'available':
      case 'vacant':
        return styles.itemAvailable;
      case 'busy':
      case 'occupied':
        return styles.itemBusy;
      case 'break':
      case 'cleaning':
        return styles.itemBreak;
      default:
        return '';
    }
  };

  const getStatusIndicatorClass = (status: string) => {
    switch (status) {
      case 'available':
      case 'vacant':
        return styles.statusIndicatorGreen;
      case 'busy':
      case 'occupied':
        return styles.statusIndicatorRed;
      case 'break':
      case 'cleaning':
        return styles.statusIndicatorOrange;
      default:
        return '';
    }
  };

  const getRoomIconClass = (status: string) => {
    switch (status) {
      case 'vacant':
        return styles.roomIconGreen;
      case 'occupied':
        return styles.roomIconRed;
      case 'cleaning':
        return styles.roomIconOrange;
      default:
        return '';
    }
  };

  const handleRefresh = () => {
    // Simulate refresh - in real app, this would fetch new data
    console.log('Refreshing data...');
  };

  const handleAssignPatient = (doctorId: string) => {
    console.log('Assigning patient to doctor:', doctorId);
    // Implementation would go here
  };

  const handleAssignRoom = (patientId: string) => {
    console.log('Assigning room to patient:', patientId);
    // Implementation would go here
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Doctor Allocation & Room Management</h1>
          <p className={styles.subtitle}>Manage doctor availability and room assignments in real-time</p>
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <Users size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Available Doctors</p>
            <p className={styles.statValue}>{doctors.filter(d => d.status === 'available').length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <Activity size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Busy Doctors</p>
            <p className={styles.statValue}>{doctors.filter(d => d.status === 'busy').length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <MapPin size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Vacant Rooms</p>
            <p className={styles.statValue}>{rooms.filter(r => r.status === 'vacant').length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <Clock size={20} />
          </div>
          <div>
            <p className={styles.statLabel}>Waiting Patients</p>
            <p className={styles.statValue}>{waitingPatients.length}</p>
          </div>
        </div>
      </div>

      {/* Doctors */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          Doctors ({doctors.length})
        </h2>
        <div className={styles.grid}>
          {doctors.map((doctor) => (
            <div key={doctor.id} className={`${styles.card} ${getItemClass(doctor.status)}`}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {doctor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{doctor.name}</h3>
                  <p className={styles.cardSubtitle}>{doctor.specialty}</p>
                </div>
                <span className={`${styles.statusBadge} ${getStatusIndicatorClass(doctor.status)}`}>
                  {doctor.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                {doctor.room && (
                  <div className={styles.infoRow}>
                    <MapPin size={16} />
                    <span>{doctor.room}</span>
                  </div>
                )}
                {doctor.currentPatient && (
                  <div className={styles.infoRow}>
                    <User size={16} />
                    <span>Currently with: {doctor.currentPatient}</span>
                  </div>
                )}
                {doctor.nextAvailable && doctor.status !== 'available' && (
                  <div className={styles.infoRow}>
                    <Clock size={16} />
                    <span>Next available: {doctor.nextAvailable}</span>
                  </div>
                )}
                {doctor.status === 'available' && (
                  <button 
                    className={styles.assignBtn}
                    onClick={() => handleAssignPatient(doctor.id)}
                  >
                    Assign Patient
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rooms */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <MapPin size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          Rooms ({rooms.length})
        </h2>
        <div className={styles.grid}>
          {rooms.map((room) => (
            <div key={room.id} className={`${styles.card} ${getItemClass(room.status)}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.roomIcon} ${getRoomIconClass(room.status)}`}>
                  <MapPin size={20} />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{room.name}</h3>
                  <p className={styles.cardSubtitle}>{room.id}</p>
                </div>
                <span className={`${styles.statusBadge} ${getStatusIndicatorClass(room.status)}`}>
                  {room.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                {room.occupiedBy && (
                  <div className={styles.roomDetails}>
                    <p className={styles.roomDetailLabel}>
                      <User size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                      Doctor: {room.occupiedBy}
                    </p>
                    {room.patient && (
                      <p className={styles.roomDetailLabel}>
                        <User size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                        Patient: {room.patient}
                      </p>
                    )}
                  </div>
                )}
                {room.status === 'vacant' && !room.patient && (
                  <p className={styles.readyText}>✓ Ready for assignment</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting Patients */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Clock size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          Waiting for Room Assignment ({waitingPatients.length})
        </h2>
        <div className={styles.grid}>
          {waitingPatients.map((patient) => (
            <div key={patient.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{patient.name}</h3>
                  <p className={styles.cardSubtitle}>{patient.id}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.assignedLabel}>Assigned Doctor</p>
                <p className={styles.assignedValue}>{patient.assignedTo}</p>
                <button 
                  className={styles.assignBtn}
                  onClick={() => handleAssignRoom(patient.id)}
                >
                  Assign Room
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Layout Grid */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <MapPin size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
          Room Layout
        </h2>
        <div className={styles.roomGrid}>
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className={`${styles.roomCell} ${getItemClass(room.status)}`}
              title={`${room.name} - ${room.status}${room.occupiedBy ? ' - ' + room.occupiedBy : ''}`}
            >
              <div className={styles.roomNumber}>{room.name.replace('Room ', '')}</div>
              <div className={styles.roomStatus}>{room.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
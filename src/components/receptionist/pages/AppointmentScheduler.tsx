import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, FileText, Plus, X } from 'lucide-react';
import styles from "../styles/receptionist.module.css"

type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  doctor: string;
  time: string;
  duration: number;
  type: 'new' | 'follow-up' | 'emergency' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
};

export default function AppointmentScheduler() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);

  const appointments: Appointment[] = [
    {
      id: 'APT001',
      patientName: 'Rahul Verma',
      patientId: 'PT001',
      doctor: 'Dr. Amit Sharma',
      time: '09:00',
      duration: 30,
      type: 'follow-up',
      status: 'confirmed',
      reason: 'Follow-up checkup'
    },
    {
      id: 'APT002',
      patientName: 'Priya Sharma',
      patientId: 'PT002',
      doctor: 'Dr. Priya Patel',
      time: '09:30',
      duration: 45,
      type: 'new',
      status: 'scheduled',
      reason: 'Pediatric consultation'
    },
    {
      id: 'APT003',
      patientName: 'Amit Patel',
      patientId: 'PT003',
      doctor: 'Dr. Rajesh Kumar',
      time: '10:00',
      duration: 30,
      type: 'follow-up',
      status: 'confirmed',
      reason: 'BP monitoring'
    },
    {
      id: 'APT004',
      patientName: 'Sneha Reddy',
      patientId: 'PT004',
      doctor: 'Dr. Meera Singh',
      time: '10:30',
      duration: 60,
      type: 'procedure',
      status: 'scheduled',
      reason: 'Skin treatment'
    },
    {
      id: 'APT005',
      patientName: 'Emergency Patient',
      patientId: 'PT099',
      doctor: 'Dr. Amit Sharma',
      time: '11:00',
      duration: 30,
      type: 'emergency',
      status: 'confirmed',
      reason: 'Fever and chest pain'
    },
  ];

  const doctors = ['Dr. Amit Sharma', 'Dr. Priya Patel', 'Dr. Rajesh Kumar', 'Dr. Meera Singh'];
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'new': return styles.typeNew;
      case 'follow-up': return styles.typeFollowUp;
      case 'emergency': return styles.typeEmergency;
      case 'procedure': return styles.typeProcedure;
      default: return styles.typeDefault;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed': return styles.statusConfirmed;
      case 'scheduled': return styles.statusScheduled;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusDefault;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Appointment Scheduler</h2>
          <p className={styles.subtitle}>{formatDate(selectedDate)}</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className={styles.bookButton}
        >
          <Plus className={styles.icon} />
          Book Appointment
        </button>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlsInner}>
          {/* Date Navigation */}
          <div className={styles.dateNav}>
            <button
              onClick={() => changeDate(-1)}
              className={styles.navButton}
            >
              <ChevronLeft className={styles.navIcon} />
            </button>
            <div className={styles.dateDisplay}>
              <span className={styles.dateText}>{selectedDate.toLocaleDateString('en-IN')}</span>
            </div>
            <button
              onClick={() => changeDate(1)}
              className={styles.navButton}
            >
              <ChevronRight className={styles.navIcon} />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className={styles.todayButton}
            >
              Today
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className={styles.viewModeToggle}>
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`${styles.viewModeButton} ${viewMode === mode ? styles.viewModeButtonActive : ''}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Type Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItems}>
          {[
            { type: 'new', label: 'New Patient' },
            { type: 'follow-up', label: 'Follow-up' },
            { type: 'emergency', label: 'Emergency' },
            { type: 'procedure', label: 'Procedure' },
          ].map((item) => (
            <div key={item.type} className={styles.legendItem}>
              <div className={`${styles.legendIndicator} ${getTypeClass(item.type)}`}></div>
              <span className={styles.legendLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className={styles.scheduleContainer}>
        <div className={styles.scheduleScroll}>
          <div className={styles.scheduleGrid}>
            {/* Doctor Headers */}
            <div className={styles.headerRow}>
              <div className={styles.headerCell}>
                <span className={styles.headerText}>Time</span>
              </div>
              {doctors.map((doctor, index) => (
                <div key={index} className={styles.headerCell}>
                  <p className={styles.doctorName}>{doctor}</p>
                  <p className={styles.doctorSpec}>{doctor.split(' ')[2]}</p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className={styles.slotsContainer}>
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className={styles.slotRow}>
                  <div className={styles.timeCell}>
                    <span className={styles.timeText}>{time}</span>
                  </div>
                  {doctors.map((doctor, doctorIndex) => {
                    const appointment = appointments.find(
                      apt => apt.doctor === doctor && apt.time === time
                    );
                    return (
                      <div key={doctorIndex} className={styles.appointmentCell}>
                        {appointment && (
                          <div className={`${styles.appointmentCard} ${getTypeClass(appointment.type)}`}>
                            <div className={styles.appointmentHeader}>
                              <div className={styles.appointmentInfo}>
                                <div className={`${styles.statusIndicator} ${getStatusClass(appointment.status)}`}></div>
                                <span className={styles.patientName}>{appointment.patientName}</span>
                              </div>
                              <span className={styles.duration}>{appointment.duration}m</span>
                            </div>
                            <p className={styles.reason}>{appointment.reason}</p>
                            <div className={styles.appointmentFooter}>
                              <span className={styles.typeBadge}>
                                {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Book New Appointment</h3>
              <button
                onClick={() => setShowBookingForm(false)}
                className={styles.closeButton}
              >
                <X className={styles.closeIcon} />
              </button>
            </div>

            <div className={styles.modalContent}>
              {/* Patient Selection */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Patient</label>
                <input
                  type="text"
                  placeholder="Search patient by name or ID..."
                  className={styles.input}
                />
              </div>

              {/* Doctor Selection */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Doctor</label>
                <select className={styles.select}>
                  <option>Select a doctor</option>
                  {doctors.map((doctor, index) => (
                    <option key={index}>{doctor}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                {/* Date */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Date</label>
                  <input
                    type="date"
                    className={styles.input}
                  />
                </div>

                {/* Time */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Time</label>
                  <select className={styles.select}>
                    <option>Select time</option>
                    {timeSlots.map((time, index) => (
                      <option key={index}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Appointment Type */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Appointment Type</label>
                <div className={styles.typeButtons}>
                  {['New Patient', 'Follow-up', 'Emergency', 'Procedure'].map((type, index) => (
                    <button
                      key={index}
                      className={styles.typeButton}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Reason for Visit</label>
                <textarea
                  rows={3}
                  placeholder="Describe the reason for appointment..."
                  className={styles.textarea}
                />
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any special instructions..."
                  className={styles.textarea}
                />
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button className={styles.submitButton}>
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
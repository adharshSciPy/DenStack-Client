import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, FileText, Plus, X } from 'lucide-react';
import styles from "../styles/calendar.module.css";

export type CalendarAppointment = {
  id: string;
  patientName?: string;
  doctor?: string;
  time: string;
  date: string;
  status?: string;
  [key: string]: any;
};

type CalendarViewProps = {
  appointments: CalendarAppointment[];
  onDateClick?: (date: string) => void;
  onAppointmentClick?: (appointment: CalendarAppointment) => void;
  onCreateAppointment?: (date: string) => void;
  renderAppointmentCard?: (appointment: CalendarAppointment) => React.ReactNode;
  renderSidebarCard?: (appointment: CalendarAppointment) => React.ReactNode;
  maxAppointmentsPerDay?: number;
  initialDate?: Date;
  headerTitle?: string;
  headerSubtitle?: string;
  showCreateButton?: boolean;
  className?: string;
  // Add these new props for month/year navigation
  currentMonth?: number;
  currentYear?: number;
  onMonthChange?: (month: number, year: number) => void;
};

export default function CalendarView({
  appointments,
  onDateClick,
  onAppointmentClick,
  onCreateAppointment,
  renderAppointmentCard,
  renderSidebarCard,
  maxAppointmentsPerDay = 3,
  initialDate = new Date(),
  headerTitle = "Appointment Calendar",
  headerSubtitle = "Click any day to view appointments",
  showCreateButton = true,
  className = "",
  // New props with defaults
  currentMonth,
  currentYear,
  onMonthChange
}: CalendarViewProps) {
  // Use external month/year if provided, otherwise use internal state
  const [internalCurrentDate, setInternalCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Determine which date to use for calendar rendering
  const displayDate = currentMonth && currentYear 
    ? new Date(currentYear, currentMonth - 1, 1)
    : internalCurrentDate;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter(apt => apt.date === dateStr);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
    
    if (onMonthChange) {
      // Use external handler if provided
      onMonthChange(newDate.getMonth() + 1, newDate.getFullYear());
    } else {
      // Use internal state if no external handler
      setInternalCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
    
    if (onMonthChange) {
      // Use external handler if provided
      onMonthChange(newDate.getMonth() + 1, newDate.getFullYear());
    } else {
      // Use internal state if no external handler
      setInternalCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    
    if (onMonthChange) {
      // Use external handler if provided
      onMonthChange(today.getMonth() + 1, today.getFullYear());
    } else {
      // Use internal state if no external handler
      setInternalCurrentDate(today);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDayDetails(true);
    onDateClick?.(dateStr);
  };

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    onAppointmentClick?.(appointment);
  };

  const handleCreateClick = () => {
    if (selectedDate && onCreateAppointment) {
      onCreateAppointment(selectedDate);
    }
  };

  // Default appointment card renderer
  const defaultAppointmentCard = (apt: CalendarAppointment, idx: number) => (
    <div
      className={`${styles.appointmentCard} ${
        idx === 0 ? styles.appointmentTeal :
        idx === 1 ? styles.appointmentOrange :
        styles.appointmentPurple
      }`}
    >
      <div className={styles.appointmentTime}>{apt.time}</div>
      {apt.doctor && <div className={styles.appointmentDoctor}>{apt.doctor}</div>}
      {apt.patientName && <div className={styles.appointmentPatient}>{apt.patientName.split(' ')[0]}...</div>}
    </div>
  );

  // Default sidebar card renderer
  const defaultSidebarCard = (apt: CalendarAppointment) => (
    <div
      className={styles.appointmentDetailCard}
      onClick={() => handleAppointmentClick(apt)}
    >
      <div className={styles.appointmentDetailHeader}>
        <div className={styles.appointmentTimeDetail}>
          <Clock className={styles.iconSmall} />
          {apt.time}
        </div>
        {apt.status && (
          <span className={styles.statusBadge}>
            {apt.status}
          </span>
        )}
      </div>
      <div className={styles.appointmentDetailInfo}>
        {apt.patientName && (
          <div className={styles.infoRow}>
            <User className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Patient:</span> {apt.patientName}
          </div>
        )}
        {apt.doctor && (
          <div className={styles.infoRow}>
            <User className={styles.iconSmallGray} />
            <span className={styles.infoLabel}>Doctor:</span> {apt.doctor}
          </div>
        )}
      </div>
    </div>
  );

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(displayDate);
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyCell}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const dayAppointments = getAppointmentsForDate(dateStr);
      const displayedAppointments = dayAppointments.slice(0, maxAppointmentsPerDay);
      const hasMore = dayAppointments.length > maxAppointmentsPerDay;

      days.push(
        <div
          key={day}
          className={styles.dayCell}
          onClick={() => handleDateClick(dateStr)}
        >
          <div className={styles.dayNumber}>{day}</div>
          <div className={styles.appointmentsList}>
            {displayedAppointments.map((apt, idx) => (
              <div key={apt.id}>
                {renderAppointmentCard ? renderAppointmentCard(apt) : defaultAppointmentCard(apt, idx)}
              </div>
            ))}
            {hasMore && (
              <div className={styles.moreIndicator}>
                +{dayAppointments.length - maxAppointmentsPerDay} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>{headerTitle}</h1>
            <p className={styles.headerSubtitle}>{headerSubtitle}</p>
          </div>
          <button onClick={handleToday} className={styles.todayButton}>
            Today
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className={styles.calendarWrapper}>
        <div className={styles.calendarCard}>
          {/* Month Navigation */}
          <div className={styles.monthNavigation}>
            <button onClick={handlePrevMonth} className={styles.navButton}>
              <ChevronLeft className={styles.navIcon} />
            </button>
            <h2 className={styles.monthTitle}>
              {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className={styles.navButton}>
              <ChevronRight className={styles.navIcon} />
            </button>
          </div>

          {/* Days of Week */}
          <div className={styles.daysOfWeekGrid}>
            {daysOfWeek.map(day => (
              <div key={day} className={styles.dayOfWeekLabel}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarGrid}>
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Day Details Sidebar */}
      {showDayDetails && selectedDate && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>
              <div>
                <h3 className={styles.sidebarTitle}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className={styles.sidebarSubtitle}>{getAppointmentsForDate(selectedDate).length} appointment(s)</p>
              </div>
              <button onClick={() => setShowDayDetails(false)} className={styles.closeButton}>
                <X className={styles.closeIcon} />
              </button>
            </div>

            <div className={styles.sidebarBody}>
              {showCreateButton && onCreateAppointment && (
                <button onClick={handleCreateClick} className={styles.newAppointmentButton}>
                  <Plus className={styles.plusIcon} />
                  New Appointment
                </button>
              )}

              <div className={styles.appointmentsListSidebar}>
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <div key={apt.id}>
                    {renderSidebarCard ? renderSidebarCard(apt) : defaultSidebarCard(apt)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
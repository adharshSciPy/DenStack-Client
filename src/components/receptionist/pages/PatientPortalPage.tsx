// pages/PatientPortalPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PatientPortal from '../../PatientPortal';
import axios from 'axios';
import patientServiceBaseUrl from '../../../patientServiceBaseUrl';

export default function PatientPortalPage() {
  const { encryptedId } = useParams<{ encryptedId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clinicId, setClinicId] = useState('');

  useEffect(() => {
    // You might need to decode or validate the encryptedId here
    // For now, we'll just pass it to the PatientPortal component
    setLoading(false);
  }, [encryptedId]);

  if (!encryptedId) {
    return <div>Invalid access link</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <PatientPortal 
      encryptedId={encryptedId}
      theme={{
        primaryColor: "#2563EB",
        secondaryColor: "#7C3AED"
      }}
    />
  );
}
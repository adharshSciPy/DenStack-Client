import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";

interface Patient {
  _id: string;
  clinicId: string;
  name: string;
  isReviewed: boolean;
}


const ReviewPage = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // 🔹 Fetch patient using token
useEffect(() => {
  const fetchData = async () => {
    try {
      const data  = await axios.get(`${patientServiceBaseUrl}/api/v1/review/${token}`);
      console.log(data);
      
      if (data && data.data) {
        setPatient(data.data.patient);  
        setSubmitted(data.data.patient.isReviewed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [token]);

  // 🔹 Submit review
const handleSubmit = async () => {
  if (!rating) return alert("Please select rating");

  try {
    const  data = await axios.post(`${patientServiceBaseUrl}/api/v1/review/${token}`, {
      rating,
      comment
    });

    if (data.data.success) {
      setSubmitted(true);
      alert("Thanks for your feedback ❤️");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
};

  // ================= UI =================

  if (loading) return <h3>Loading...</h3>;

  if (!patient) return <h3>Invalid review link ❌</h3>;

  if (submitted)
    return <h3>✅ You already submitted your review. Thank you!</h3>;

  return (
    <div style={styles.container}>
      <h2>Clinic Feedback</h2>
      <p>Hello {patient.name}, how was your experience?</p>

      {/* ⭐ Star Rating */}
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "32px",
              cursor: "pointer",
              color: star <= rating ? "#f5b301" : "#ccc",
            }}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      {/* Comment */}
      <textarea
        placeholder="Write your feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={styles.textarea}
      />

      <button style={styles.button} onClick={handleSubmit}>
        Submit Review
      </button>
    </div>
  );
};

export default ReviewPage;

// ================= Styles =================

const styles: any = {
  container: {
    maxWidth: "400px",
    margin: "80px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  stars: {
    margin: "20px 0",
  },
  textarea: {
    width: "100%",
    height: "80px",
    marginBottom: "15px",
    padding: "8px",
  },
  button: {
    padding: "10px 20px",
    background: "#2d89ef",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

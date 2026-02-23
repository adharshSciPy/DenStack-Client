import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import patientServiceBaseUrl from "../patientServiceBaseUrl";

interface FeedbackContext {
  patientName: string;
  doctorName:  string;
  department:  string;
  visitDate:   string;
  expiresAt:   string;
}

type PageState = "loading" | "ready" | "submitted" | "already_submitted" | "expired" | "invalid";

const ReviewPage = () => {
  const { token } = useParams<{ token: string }>();

  // ── Debug logs — remove after fixing ─────────────────────────────────────
  console.log("TOKEN:", token);
  console.log("BASE URL:", patientServiceBaseUrl);
  console.log("FULL URL:", `${patientServiceBaseUrl}/api/v1/feedback/${token}`);

  const [pageState, setPageState]   = useState<PageState>("loading");
  const [context,   setContext]     = useState<FeedbackContext | null>(null);
  const [rating,    setRating]      = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [googleUrl, setGoogleUrl]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const { data } = await axios.get(
          `${patientServiceBaseUrl}/api/v1/feedback/${token}`
        );
        console.log("RESPONSE:", data); // ── log response
        if (data.success) {
          setContext(data);
          setPageState("ready");
        }
      } catch (err: any) {
        console.log("ERROR STATUS:", err.response?.status);   // ── log error
        console.log("ERROR BODY:",   err.response?.data);     // ── log error body
        const status = err.response?.status;
        if      (status === 409) setPageState("already_submitted");
        else if (status === 410) setPageState("expired");
        else                     setPageState("invalid");
      }
    };
    fetchContext();
  }, [token]);

  const handleSubmit = async () => {
    if (!rating) return alert("Please select a star rating");
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${patientServiceBaseUrl}/api/v1/feedback/submit`,
        {
          token,
          rating,
          feedbackText: feedbackText.trim() || undefined,
        }
      );
      if (data.success) {
        setGoogleUrl(data.googleReviewUrl);
        setPageState("submitted");
      }
    } catch (err: any) {
      const status = err.response?.status;
      if      (status === 409) setPageState("already_submitted");
      else if (status === 410) setPageState("expired");
      else alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") return <div style={styles.center}>Loading...</div>;
  if (pageState === "invalid") return <div style={styles.center}>❌ Invalid feedback link.</div>;
  if (pageState === "expired") return <div style={styles.center}>⏰ This feedback link has expired.</div>;
  if (pageState === "already_submitted") return <div style={styles.center}>✅ You already submitted your review. Thank you!</div>;

  if (pageState === "submitted")
    return (
      <div style={styles.container}>
        <h2>Thank you! ❤️</h2>
        {googleUrl ? (
          <>
            <p>We're glad you had a great experience. Would you mind sharing it on Google?</p>
            <a href={googleUrl} target="_blank" rel="noreferrer" style={styles.googleButton}>
              ⭐ Leave a Google Review
            </a>
          </>
        ) : (
          <p>Your feedback has been noted. Our team will look into it shortly.</p>
        )}
      </div>
    );

  return (
    <div style={styles.container}>
      <h2>Clinic Feedback</h2>
      <p>Hello <strong>{context?.patientName}</strong>, how was your experience with <strong>Dr. {context?.doctorName}</strong>?</p>
      {context?.department && <p style={styles.meta}>Department: {context.department}</p>}

      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "40px",
              cursor:   "pointer",
              color:    star <= rating ? "#f5b301" : "#ccc",
              transition: "color 0.2s",
            }}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      {rating > 0 && rating <= 3 && (
        <textarea
          placeholder="Please tell us what went wrong so we can improve..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          style={styles.textarea}
          maxLength={2000}
        />
      )}

      <button
        style={{ ...styles.button, opacity: submitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
};

export default ReviewPage;

const styles: any = {
  center: {
    textAlign: "center",
    marginTop: "100px",
    fontSize:  "18px",
  },
  container: {
    maxWidth:     "440px",
    margin:       "80px auto",
    padding:      "30px",
    borderRadius: "12px",
    boxShadow:    "0 0 16px rgba(0,0,0,0.1)",
    textAlign:    "center",
    fontFamily:   "sans-serif",
  },
  stars: { margin: "20px 0" },
  meta: { color: "#888", fontSize: "14px" },
  textarea: {
    width:         "100%",
    height:        "100px",
    marginBottom:  "15px",
    padding:       "10px",
    borderRadius:  "8px",
    border:        "1px solid #ddd",
    resize:        "vertical",
    fontFamily:    "sans-serif",
  },
  button: {
    padding:      "12px 28px",
    background:   "#2d89ef",
    color:        "white",
    border:       "none",
    borderRadius: "8px",
    cursor:       "pointer",
    fontSize:     "16px",
  },
  googleButton: {
    display:        "inline-block",
    marginTop:      "16px",
    padding:        "12px 24px",
    background:     "#4285F4",
    color:          "white",
    borderRadius:   "8px",
    textDecoration: "none",
    fontWeight:     "bold",
  },
};
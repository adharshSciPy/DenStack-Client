import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import patientServiceBaseUrl from "../../../patientServiceBaseUrl";
import { color } from "framer-motion";

interface Review {
  _id: string;
  stars: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  patientName: string;
}

interface Stats {
  ratingAvg: number;
  totalReviews: number;
}

const ReviewListPage = () => {
  const { clinicId } = useParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchReviews();
    // fetchStats();
  }, []);

  const fetchReviews = async () => {
    const data = await axios.get(
      `${patientServiceBaseUrl}/api/v1/review/clinic/${clinicId}`,
    );
    console.log("data",data);

    setReviews(data.data.reviews);
  };

  // const fetchStats = async () => {
  //   const  data  = await axios.get(`/api/admin/reviews/${clinicId}/stats`);
  //   setStats(data.data.stats);
  // };

  const approve = async (id: string) => {
    await axios.patch(`${patientServiceBaseUrl}/api/v1/review/${id}/approve`);
    fetchReviews();
    // fetchStats();
  };

  const reject = async (id: string) => {
    await axios.patch(`${patientServiceBaseUrl}/api/v1/review/${id}/reject`);
    fetchReviews();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Clinic Reviews</h2>

      {/* ===== Stats ===== */}
      {stats && (
        <div style={styles.statsRow}>
          <div style={styles.card}>
            ⭐ Avg Rating
            <div style={styles.bigText}>{stats.ratingAvg}</div>
          </div>

          <div style={styles.card}>
            📝 Total Reviews
            <div style={styles.bigText}>{stats.totalReviews}</div>
          </div>
        </div>
      )}

      {/* ===== Table ===== */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Patient</th>
            <th style={styles.th}>Rating</th>
            <th style={styles.th}>Comment</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {reviews?.map((r) => (
            <tr key={r._id}>
              <td style={styles.td}>{r.patientName}</td>

              <td style={styles.td}>
                {"★".repeat(r.stars)}
                {"☆".repeat(5 - r.stars)}
              </td>

              <td style={styles.td}>{r.comment}</td>

              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    ...getStatusStyle(r.status),
                  }}
                >
                  {r.status}
                </span>
              </td>

              <td style={styles.td}>
                {r.status === "pending" ? (
                  <>
                    <button
                      style={styles.approveBtn}
                      onClick={() => approve(r._id)}
                    >
                      Approve
                    </button>

                    <button
                      style={styles.rejectBtn}
                      onClick={() => reject(r._id)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewListPage;

//
// ================= Styles =================
//

const styles: any = {

  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 25,
    color: "#0f172a",
  },

  // ================= Stats =================

  statsRow: {
    display: "flex",
    gap: 20,
    marginBottom: 30,
  },

  card: {
    flex: 1,
    padding: 22,
    borderRadius: 18,

    // 🔥 glass look
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",

    border: "1px solid rgba(255,255,255,0.4)",

    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",

    fontWeight: 600,
    color: "#0f172a",
  },

  bigText: {
    fontSize: 26,
    fontWeight: 700,
    marginTop: 10,
  },

  // ================= Table =================

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    overflow: "hidden",

    borderRadius: 18,

    // 🔥 glass table
    background: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",

    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },

  th: {
    textAlign: "left",
    padding: 14,
    fontWeight: 600,
    fontSize: 14,
    color: "#334155",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },

  td: {
    padding: 14,
    fontSize: 14,
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    color:"#0f172a"
  },

  // ================= Badges =================

  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },

  // ================= Buttons =================

  approveBtn: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },

  rejectBtn: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    marginLeft: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
};


const getStatusStyle = (status: string) => {
  if (status === "approved")
    return {
      background: "rgba(34,197,94,0.15)",
      color: "#16a34a",
    };

  if (status === "rejected")
    return {
      background: "rgba(239,68,68,0.15)",
      color: "#dc2626",
    };

  return {
    background: "rgba(251,191,36,0.2)",
    color: "#d97706",
  };
};


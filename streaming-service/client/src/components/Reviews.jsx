import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useUser } from "../UserContext.jsx";

export default function Reviews({ contentType, contentId }) {
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [contentId]);

  // Reset rating and review text when opening the form for a new review
  useEffect(() => {
    if (showForm && !myReview) {
      setRating(5);
      setReviewText("");
    }
  }, [showForm, myReview]);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await api.getReviews(contentType, contentId);
      setReviews(data);
      // Find user's review if exists
      if (user) {
        const userReview = data.find(r => r.userId === user.id);
        if (userReview) {
          setMyReview(userReview);
          setRating(userReview.rating);
          setReviewText(userReview.reviewText || "");
        }
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!user) {
      alert("Please login to leave a review");
      return;
    }

    try {
      await api.createReview({
        userId: user.id,
        contentId,
        contentType,
        rating,
        reviewText: reviewText.trim() || null
      });
      setShowForm(false);
      loadReviews();
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review");
    }
  }

  async function deleteReview() {
    if (!user || !myReview) return;
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await api.deleteReview(myReview.id);
      setMyReview(null);
      setRating(5);
      setReviewText("");
      loadReviews();
    } catch (error) {
      alert("Failed to delete review");
    }
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Reviews & Ratings</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{averageRating}</div>
            <div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{ color: star <= averageRating ? "#ffc107" : "#444", fontSize: 20 }}>
                    ⭐
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>{reviews.length} reviews</div>
            </div>
          </div>
        </div>
        
        {user && !showForm && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowForm(true)} className="btn btnPrimary">
              {myReview ? 'Edit My Review' : 'Write a Review'}
            </button>
            {myReview && (
              <button onClick={deleteReview} className="btn btnSecondary">
                Delete My Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <div style={{
          backgroundColor: "var(--panel)",
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ marginTop: 0 }}>Your Review</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              Rating
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 32,
                    cursor: "pointer",
                    padding: 0,
                    color: (hoverRating ? star <= hoverRating : star <= rating) ? "#ffc107" : "#444",
                    transition: "color 0.15s"
                  }}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: 14,
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={submitReview} className="btn btnPrimary">
              Submit Review
            </button>
            <button onClick={() => setShowForm(false)} className="btn btnSecondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>
          No reviews yet. Be the first to review!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map(review => (
            <div
              key={review.id}
              style={{
                backgroundColor: "var(--panel)",
                padding: 20,
                borderRadius: 12,
                border: "1px solid var(--border)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700
                  }}>
                    {review.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{review.username}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ color: star <= review.rating ? "#ffc107" : "#444", fontSize: 16 }}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              {review.reviewText && (
                <p style={{ margin: 0, lineHeight: 1.6 }}>{review.reviewText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

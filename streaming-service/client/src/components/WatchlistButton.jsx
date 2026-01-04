import React, { useState, useEffect } from "react";
import { useUser } from "../UserContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function WatchlistButton({ movieId, movieType = "movie" }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkWatchlist();
    }
  }, [user, movieId]);

  async function checkWatchlist() {
    try {
      const watchlist = await api.getWatchlist(user.id);
      setInWatchlist(watchlist.some(item => item.movieId === movieId));
    } catch (err) {
      console.error("Failed to check watchlist:", err);
    }
  }

  async function toggleWatchlist() {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await api.removeFromWatchlist(user.id, movieId);
        setInWatchlist(false);
      } else {
        await api.addToWatchlist({ userId: user.id, movieId, type: movieType });
        setInWatchlist(true);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={inWatchlist ? "btn btn-outline" : "btn btn-secondary"}
      title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      <i className={`bi ${inWatchlist ? "bi-bookmark-check-fill" : "bi-bookmark-plus"} me-2`}></i>
      {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
    </button>
  );
}

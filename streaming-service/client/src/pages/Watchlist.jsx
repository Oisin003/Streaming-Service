import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../UserContext.jsx";
import { api, fileUrl } from "../api.js";

export default function Watchlist() {
  const { user } = useUser();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadWatchlist();
  }, [user]);

  async function loadWatchlist() {
    try {
      setLoading(true);
      const data = await api.getWatchlist(user.id);
      setWatchlist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWatchlist(movieId) {
    if (!confirm("Remove from watchlist?")) return;
    
    try {
      await api.removeFromWatchlist(user.id, movieId);
      setWatchlist(watchlist.filter(item => item.movieId !== movieId));
    } catch (err) {
      alert("Failed to remove: " + err.message);
    }
  }

  if (!user) {
    return (
      <div className="emptyState">
        <i className="bi bi-person-circle" style={{ fontSize: '64px', opacity: 0.3 }}></i>
        <h2>Sign In Required</h2>
        <p>Please sign in to view your watchlist</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading your watchlist...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="emptyState">
        <i className="bi bi-bookmark-heart" style={{ fontSize: '64px', opacity: 0.3 }}></i>
        <h2>Your Watchlist is Empty</h2>
        <p>Add movies and shows to watch them later</p>
        <Link to="/" className="btn btn-accent">
          <i className="bi bi-search me-2"></i>
          Browse Content
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="pageTitle" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <i className="bi bi-bookmark-heart-fill"></i>
          My Watchlist
        </h1>
        <div className="pill" style={{ marginTop: 8 }}>{watchlist.length} item{watchlist.length !== 1 ? 's' : ''} saved</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
        {watchlist.map((item) => (
          <div key={item.movieId} style={{ position: 'relative' }}>
            <Link to={item.type === 'MOVIE' ? `/movie/${item.movieId}` : `/show/${item.movieId}`} style={{ textDecoration: 'none' }}>
              {item.posterPath ? (
                <img
                  className="movie-poster"
                  src={fileUrl(item.posterPath)}
                  alt={item.title}
                  loading="lazy"
                  onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                  style={{ width: '100%' }}
                />
              ) : null}
              {/* Fallback for missing poster or error */}
              <div className="movie-poster" style={{ display: item.posterPath ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff', fontSize: 48, letterSpacing: 2, position: 'absolute', top: 0, left: 0, width: '100%', height: 270 }}>
                <span role="img" aria-label="No poster">🎬</span>
              </div>
            </Link>
            
            <div style={{ padding: 12 }}>
              <Link to={item.type === 'MOVIE' ? `/movie/${item.movieId}` : `/show/${item.movieId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{item.title}</h3>
              </Link>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span className="badge">{item.type}</span>
                {item.genre && <span className="subtle" style={{ fontSize: 12 }}>{item.genre}</span>}
              </div>
              
              <button
                onClick={() => removeFromWatchlist(item.movieId)}
                className="btn btnDanger btnSmall"
                style={{ width: '100%' }}
              >
                <i className="bi bi-trash"></i> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

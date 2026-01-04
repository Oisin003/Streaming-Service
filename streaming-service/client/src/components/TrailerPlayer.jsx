import React from "react";

export default function TrailerPlayer({ trailerUrl }) {
  if (!trailerUrl) return null;
  return (
    <div className="trailerWrap" style={{ margin: '18px 0' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        <i className="bi bi-camera-reels"></i> Trailer
      </div>
      <video controls style={{ width: '100%', borderRadius: 10, background: '#111' }}>
        <source src={trailerUrl} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

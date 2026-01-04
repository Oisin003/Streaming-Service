import React, { useEffect, useMemo, useState } from "react";
import { api, fileUrl, streamMovieUrl, streamPartUrl } from "../api.js";
import { useParams, Link } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer.jsx";
import WatchlistButton from "../components/WatchlistButton.jsx";
import Reviews from "../components/Reviews.jsx";
import TrailerPlayer from "../components/TrailerPlayer.jsx";
import { getProgress } from "../watch.js";

export default function MovieDetails() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [err, setErr] = useState("");
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.getMovie(id),
      api.listMovieParts(id),
      api.getTrailers(id).catch(() => [])
    ])
      .then(([movie, movieParts, trailers]) => {
        if (ignore) return;
        setM(movie);
        setParts(movieParts);
        if (movieParts.length > 0) {
          setSelectedPart(movieParts[0]);
        }
        if (Array.isArray(trailers) && trailers.length > 0 && trailers[0].trailerPath) {
          setTrailer(trailers[0]);
        } else {
          setTrailer(null);
        }
      })
      .catch(e => setErr(e.message));
    return () => { ignore = true; };
  }, [id]);

  if (err) return <div className="error">{err}</div>;
  if (!m) return <div className="notice">Loading…</div>;

  const poster = fileUrl(m.posterPath);
  
  // Determine what to play and track
  const hasMultipleParts = parts.length > 0;
  const videoSrc = hasMultipleParts && selectedPart 
    ? streamPartUrl(selectedPart.id)
    : streamMovieUrl(m.id);
  const progressKey = hasMultipleParts && selectedPart
    ? `part:${selectedPart.id}`
    : `movie:${m.id}`;
  
  const prog = getProgress(progressKey);
  const pct = prog && prog.duration > 0 ? Math.round((prog.seconds / prog.duration) * 100) : null;

  return (
    <div className="detailsGrid">
      <div className="panel">
        <div className="panelBody">
          <div className="detailsTitle">{m.title}</div>

          <div className="detailsMeta">
            <span className="badge">{m.type}</span>
            {m.genre ? <span className="badge">{m.genre}</span> : null}
            {m.year ? <span>{m.year}</span> : <span className="subtle">—</span>}
            {hasMultipleParts && <span className="badge">{parts.length} Parts</span>}
            {pct !== null ? <span className="badge">{pct}% watched</span> : null}
          </div>

          <div className="detailsDesc">{m.description || "No description."}</div>

          {/* Trailer player (optional) */}
          {trailer && trailer.trailerPath ? (
            <TrailerPlayer trailerUrl={fileUrl(trailer.trailerPath)} />
          ) : null}

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <WatchlistButton movieId={parseInt(id)} movieType={m.type} />
          </div>

          <div style={{ marginTop: 14 }}>
            {hasMultipleParts && selectedPart && (
              <div className="detailsMeta" style={{ marginBottom: 10 }}>
                <span className="badge">Part {selectedPart.partNumber}</span>
                <span style={{ fontWeight: 900 }}>{selectedPart.title}</span>
              </div>
            )}
            {(m.videoPath || hasMultipleParts) ? (
              <>
                <VideoPlayer src={videoSrc} progressKey={progressKey} />
                {hasMultipleParts && selectedPart?.description && (
                  <div className="subtle" style={{ marginTop: 10 }}>
                    {selectedPart.description}
                  </div>
                )}
              </>
            ) : (
              <div className="warn">No video attached yet. Upload one in Admin.</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="sideHead">
          <div style={{ fontWeight: 900 }}>{hasMultipleParts ? "Parts" : "Info"}</div>
          <div className="rowRight">
            <Link className="btn btnSmall btnSecondary" to="/">Back</Link>
            <Link className="btn btnSmall btnPrimary" to="/admin/movies">Manage</Link>
          </div>
        </div>

        {hasMultipleParts ? (
          <>
            <div style={{ padding: 14 }}>
              {poster ? (
                <img
                  className="movie-poster"
                  src={poster}
                  alt={m.title}
                  loading="lazy"
                  style={{ margin: '0 auto', display: 'block' }}
                />
              ) : (
                <div className="movie-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff', fontSize: 48, letterSpacing: 2, margin: '0 auto' }}>
                  <span role="img" aria-label="No poster">🎬</span>
                </div>
              )}
            </div>

            <div className="list">
              {parts.map(part => {
                const partProgress = getProgress(`part:${part.id}`);
                const partPct = partProgress && partProgress.duration > 0
                  ? Math.round((partProgress.seconds / partProgress.duration) * 100)
                  : null;
                
                return (
                  <button
                    key={part.id}
                    className={`listItem ${selectedPart?.id === part.id ? "active" : ""}`}
                    onClick={() => setSelectedPart(part)}
                  >
                    <div className="listItemTop">
                      <div className="listItemTitle">{part.title}</div>
                      <div className="listItemMeta">
                        Part {part.partNumber}
                        {partPct !== null && ` · ${partPct}%`}
                      </div>
                    </div>
                    {part.description && (
                      <div className="listItemMeta" style={{ marginTop: 6 }}>
                        {part.description.slice(0, 90) + (part.description.length > 90 ? "…" : "")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="panelBody">
            <div className="subtle">Poster</div>
            <div style={{
              marginTop: 10,
              height: 190,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: poster ? `url(${poster}) center/cover` : "rgba(255,255,255,0.06)"
            }} />
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnSmall btnPrimary" to="/admin/movies">Open Admin</Link>
              <a className="btn btnSmall btnGhost" href={poster || "#"} target="_blank" rel="noreferrer">
                View Poster
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Reviews Section */}
      <div className="panel">
        <div className="panelBody">
          <Reviews contentType="movie" contentId={parseInt(id)} />
        </div>
      </div>
    </div>
  );
}

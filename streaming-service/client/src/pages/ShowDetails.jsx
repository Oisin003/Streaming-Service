import React, { useEffect, useMemo, useState } from "react";
import { api, fileUrl, streamEpisodeUrl } from "../api.js";
import { useParams, Link } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer.jsx";
import WatchlistButton from "../components/WatchlistButton.jsx";
import { getProgress } from "../watch.js";

export default function ShowDetails() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [eps, setEps] = useState([]);
  const [selectedEp, setSelectedEp] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api.getMovie(id), api.listEpisodes(id)])
      .then(([s, e]) => {
        setShow(s);
        setEps(e);
        if (e.length > 0) {
          // Auto-select first episode of first season
          const firstSeason = Math.min(...e.map(ep => ep.seasonNumber));
          setSelectedSeason(firstSeason);
          const firstEp = e.find(ep => ep.seasonNumber === firstSeason && ep.episodeNumber === 1) || e[0];
          setSelectedEp(firstEp);
        }
      })
      .catch(e => setErr(e.message));
  }, [id]);

  // Group episodes by season
  const seasonGroups = useMemo(() => {
    const groups = {};
    eps.forEach(ep => {
      if (!groups[ep.seasonNumber]) {
        groups[ep.seasonNumber] = [];
      }
      groups[ep.seasonNumber].push(ep);
    });
    
    // Sort episodes within each season
    Object.keys(groups).forEach(season => {
      groups[season].sort((a, b) => a.episodeNumber - b.episodeNumber);
    });
    
    return groups;
  }, [eps]);

  const seasons = Object.keys(seasonGroups).map(Number).sort((a, b) => a - b);

  const currentSeasonEps = selectedSeason ? (seasonGroups[selectedSeason] || []) : [];

  const bestPoster = useMemo(() => {
    if (!show) return null;
    // show poster preferred; else episode poster
    return show.posterPath || eps?.[0]?.posterPath || null;
  }, [show, eps]);

  if (err) return <div className="error">{err}</div>;
  if (!show) return <div className="notice">Loading…</div>;

  const poster = fileUrl(bestPoster);

  const progressKey = selectedEp ? `episode:${selectedEp.id}` : null;
  const prog = progressKey ? getProgress(progressKey) : null;
  const pct = prog ? Math.round((prog.pct || 0) * 100) : null;

  return (
    <div className="detailsGrid">
      <div className="panel">
        <div className="panelBody">
          <div className="detailsTitle">{show.title}</div>
          <div className="detailsMeta">
            <span className="badge">SHOW</span>
            {show.genre ? <span className="badge">{show.genre}</span> : null}
            <span className="subtle">{eps.length} episodes · {seasons.length} {seasons.length === 1 ? 'season' : 'seasons'}</span>
            {pct !== null ? <span className="badge">{pct}% watched</span> : null}
          </div>
          <div className="detailsDesc">{show.description || "No description."}</div>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <WatchlistButton movieId={parseInt(id)} movieType="show" />
          </div>

          <div style={{ marginTop: 14 }}>
            {selectedEp ? (
              <>
                <div className="detailsMeta" style={{ marginBottom: 10 }}>
                  <span className="badge">
                    S{selectedEp.seasonNumber}E{selectedEp.episodeNumber}
                  </span>
                  <span style={{ fontWeight: 900 }}>{selectedEp.title}</span>
                </div>
                <VideoPlayer
                  src={streamEpisodeUrl(selectedEp.id)}
                  progressKey={`episode:${selectedEp.id}`}
                />
                {selectedEp.description && (
                  <div className="subtle" style={{ marginTop: 10 }}>
                    {selectedEp.description}
                  </div>
                )}
              </>
            ) : (
              <div className="warn">No episodes yet. Add some in Admin.</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="sideHead">
          <div style={{ fontWeight: 900 }}>Episodes</div>
          <div className="rowRight">
            <Link className="btn btnSmall btnSecondary" to="/">Back</Link>
            <Link className="btn btnSmall btnPrimary" to={`/admin/shows/${id}/episodes`}>Manage</Link>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <div style={{
            height: 140,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: poster ? `url(${poster}) center/cover` : "rgba(255,255,255,0.06)"
          }} />
        </div>

        {/* Season Selector */}
        {seasons.length > 0 && (
          <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {seasons.map(season => (
              <button
                key={season}
                className={`btn btnSmall ${selectedSeason === season ? "btnPrimary" : "btnGhost"}`}
                onClick={() => setSelectedSeason(season)}
              >
                Season {season}
              </button>
            ))}
          </div>
        )}

        <div className="list">
          {currentSeasonEps.map(ep => {
            const epProgress = getProgress(`episode:${ep.id}`);
            const epPct = epProgress ? Math.round((epProgress.pct || 0) * 100) : null;
            
            return (
              <button
                key={ep.id}
                className={`listItem ${selectedEp?.id === ep.id ? "active" : ""}`}
                onClick={() => setSelectedEp(ep)}
              >
                <div className="listItemTop">
                  <div className="listItemTitle">{ep.title}</div>
                  <div className="listItemMeta">
                    E{ep.episodeNumber}
                    {epPct !== null && ` · ${epPct}%`}
                  </div>
                </div>
                <div className="listItemMeta" style={{ marginTop: 6 }}>
                  {ep.description ? (ep.description.slice(0, 90) + (ep.description.length > 90 ? "…" : "")) : "No description"}
                </div>
              </button>
            );
          })}
          {currentSeasonEps.length === 0 && <div className="notice">
            {selectedSeason ? `No episodes in Season ${selectedSeason}.` : "No episodes."}
          </div>}
        </div>
      </div>
    </div>
  );
}

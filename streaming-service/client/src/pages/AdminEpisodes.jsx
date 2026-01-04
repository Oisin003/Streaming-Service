import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Link, useParams } from "react-router-dom";

export default function AdminEpisodes() {
  const { id } = useParams(); // showId
  const [show, setShow] = useState(null);
  const [eps, setEps] = useState([]);
  const [err, setErr] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [seasonNames, setSeasonNames] = useState({});

  function refresh() {
    Promise.all([api.getMovie(id), api.adminListEpisodes(id), api.getSeasonNames?.(id)])
      .then(([s, e, names]) => { 
        setShow(s); 
        setEps(e);
        setSeasonNames(names || {});
        // Auto-select first season if available
        if (e.length > 0 && selectedSeason === "all") {
          const firstSeason = Math.min(...e.map(ep => ep.seasonNumber));
          setSelectedSeason(firstSeason);
        }
      })
      .catch(e => setErr(e.message));
  }

  useEffect(() => { refresh(); }, [id]);

  async function del(epId) {
    if (!confirm("Delete this episode?")) return;
    setErr("");
    try {
      await api.adminDeleteEpisode(epId);
      refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

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
  
  const filteredEps = selectedSeason === "all" 
    ? eps 
    : seasonGroups[selectedSeason] || [];

  // Get the next episode number for the selected season
  const nextEpisodeNumber = useMemo(() => {
    if (selectedSeason === "all") return 1;
    const seasonEps = seasonGroups[selectedSeason] || [];
    if (seasonEps.length === 0) return 1;
    return Math.max(...seasonEps.map(ep => ep.episodeNumber)) + 1;
  }, [selectedSeason, seasonGroups]);

  return (
    <div>
      <div className="row">
        <div className="rowLeft">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            Episodes {show ? `— ${show.title}` : ""}
          </h1>
          <div className="pill">{eps.length} episodes · {seasons.length} seasons</div>
        </div>
        <div className="rowRight">
          <Link 
            className="btn btnPrimary btnSmall" 
            to={`/admin/shows/${id}/episodes/new`}
            state={{ suggestedSeason: selectedSeason === "all" ? 1 : selectedSeason, suggestedEpisode: nextEpisodeNumber }}
          >
            + New Episode
          </Link>
          <Link className="btn btnGhost btnSmall" to="/admin/movies">Back</Link>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      {/* Season Filter & Naming */}
      {seasons.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button 
            className={`btn btnSmall ${selectedSeason === "all" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setSelectedSeason("all")}
          >
            All Seasons
          </button>
          {seasons.map(season => (
            <div key={season} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button 
                className={`btn btnSmall ${selectedSeason === season ? "btnPrimary" : "btnGhost"}`}
                onClick={() => setSelectedSeason(season)}
              >
                Season {season} ({seasonGroups[season].length})
              </button>
              <input
                type="text"
                value={seasonNames[season] || ""}
                onChange={e => {
                  const name = e.target.value;
                  setSeasonNames(prev => ({ ...prev, [season]: name }));
                  api.setSeasonName?.(id, season, name);
                }}
                placeholder="Season name (optional)"
                style={{ width: 120, fontSize: 13, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="table" style={{ marginTop: 16 }}>
        <div className="thead">
          <div>Episode</div>
          <div>Title</div>
          <div>Runtime</div>
          <div>Actions</div>
        </div>

        {filteredEps.map(ep => (
          <div className="trow" key={ep.id}>
            <div>
              <span className="badge">S{ep.seasonNumber}E{ep.episodeNumber}</span>
            </div>
            <div style={{ fontWeight: 900 }}>{ep.title}</div>
            <div className="subtle">{ep.runtimeSeconds ? `${Math.floor(ep.runtimeSeconds / 60)}m` : "—"}</div>
            <div className="actions">
              <Link className="btn btnSecondary btnSmall" to={`/admin/episodes/${ep.id}/edit`}>Edit</Link>
              <button className="btn btnDanger btnSmall" onClick={() => del(ep.id)}>Delete</button>
            </div>
          </div>
        ))}

        {filteredEps.length === 0 && <div style={{ padding: 14 }} className="subtle">
          {selectedSeason === "all" ? "No episodes yet." : `No episodes in Season ${selectedSeason}.`}
        </div>}
      </div>
    </div>
  );
}

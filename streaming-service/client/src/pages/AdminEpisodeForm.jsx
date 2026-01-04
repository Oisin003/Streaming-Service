import React, { useEffect, useState } from "react";
import { api, fileUrl } from "../api.js";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function AdminEpisodeForm({ mode }) {
  const nav = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // showId (create) or episodeId (edit)

  const [err, setErr] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [posterProgress, setPosterProgress] = useState(0);

  // Get suggested values from navigation state
  const suggestedSeason = location.state?.suggestedSeason || 1;
  const suggestedEpisode = location.state?.suggestedEpisode || 1;

  const [form, setForm] = useState({
    showId: mode === "create" ? Number(id) : null,
    seasonNumber: suggestedSeason,
    episodeNumber: suggestedEpisode,
    title: "",
    description: "",
    posterPath: "",
    videoPath: "",
    runtimeSeconds: ""
  });

  // For runtime input
  const [runHours, setRunHours] = useState(0);
  const [runMinutes, setRunMinutes] = useState(0);
  const [runSeconds, setRunSeconds] = useState(0);

  // Update form.runtimeSeconds when any input changes
  useEffect(() => {
    const total = Number(runHours) * 3600 + Number(runMinutes) * 60 + Number(runSeconds);
    setForm(prev => ({ ...prev, runtimeSeconds: total ? total : "" }));
  }, [runHours, runMinutes, runSeconds]);

  useEffect(() => {
    if (mode === "edit") {
      api.getEpisode(id).then(ep => {
        setForm({
          showId: ep.showId,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title || "",
          description: ep.description || "",
          posterPath: ep.posterPath || "",
          videoPath: ep.videoPath || "",
          runtimeSeconds: ep.runtimeSeconds || ""
        });
        // If runtimeSeconds exists, split into h/m/s
        if (ep.runtimeSeconds) {
          const h = Math.floor(ep.runtimeSeconds / 3600);
          const m_ = Math.floor((ep.runtimeSeconds % 3600) / 60);
          const s = ep.runtimeSeconds % 60;
          setRunHours(h);
          setRunMinutes(m_);
          setRunSeconds(s);
        }
      }).catch(e => setErr(e.message));
    }
  }, [mode, id]);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function uploadVideo(file) {
    setUploadingVideo(true);
    setVideoProgress(0);
    setErr("");
    try {
      const res = await api.adminUploadVideo(file, (progress) => {
        setVideoProgress(progress);
      });
      update("videoPath", res.videoPath);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  }

  async function uploadPoster(file) {
    setUploadingPoster(true);
    setPosterProgress(0);
    setErr("");
    try {
      const res = await api.adminUploadPoster(file, (progress) => {
        setPosterProgress(progress);
      });
      update("posterPath", res.posterPath);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingPoster(false);
      setPosterProgress(0);
    }
  }

  async function save(e) {
    e.preventDefault();
    setErr("");

    const payload = {
      ...form,
      showId: Number(form.showId),
      seasonNumber: Number(form.seasonNumber),
      episodeNumber: Number(form.episodeNumber),
      runtimeSeconds: form.runtimeSeconds === "" ? null : Number(form.runtimeSeconds),
      posterPath: form.posterPath || null
    };

    try {
      if (mode === "create") {
        await api.adminCreateEpisode(payload);
        nav(`/admin/shows/${payload.showId}/episodes`);
      } else {
        await api.adminUpdateEpisode(id, payload);
        nav(`/admin/shows/${payload.showId}/episodes`);
      }
    } catch (e2) {
      setErr(e2.message);
    }
  }

  const poster = fileUrl(form.posterPath);

  return (
    <div className="panel formCard">
      <div className="panelBody">
        <div className="row">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            {mode === "create" ? "Create" : "Edit"} Episode
          </h1>
          <button className="btn btnGhost btnSmall" onClick={() => nav(-1)}>Back</button>
        </div>

        {err && <div className="error">{err}</div>}

        <form className="form" onSubmit={save} style={{ marginTop: 8 }}>
          <label>Show ID</label>
          <input 
            type="number"
            value={form.showId ?? ""} 
            onChange={e => update("showId", e.target.value)} 
            required 
            disabled={mode === "create"}
          />

          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Season Number</label>
              <input 
                type="number"
                min="1"
                value={form.seasonNumber} 
                onChange={e => update("seasonNumber", e.target.value)} 
                required 
                placeholder="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Episode Number</label>
              <input 
                type="number"
                min="1"
                value={form.episodeNumber} 
                onChange={e => update("episodeNumber", e.target.value)} 
                required 
                placeholder="1"
              />
            </div>
          </div>

          <label>Episode Title</label>
          <input 
            value={form.title} 
            onChange={e => update("title", e.target.value)} 
            required 
            placeholder="e.g., Pilot, The Beginning, etc."
          />

          <label>Description</label>
          <textarea 
            value={form.description} 
            onChange={e => update("description", e.target.value)} 
            placeholder="Brief description of this episode..."
          />

          <div className="hr" />

          <label>Episode Poster (optional - will use show poster if not provided)</label>
          <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadPoster(e.target.files[0])} />
          {uploadingPoster && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading poster… {posterProgress}%</div>
              <progress value={posterProgress} max="100" style={{ width: "100%", marginTop: 8 }} />
            </div>
          )}

          <label>Poster Path</label>
          <input 
            value={form.posterPath} 
            onChange={e => update("posterPath", e.target.value)} 
            placeholder="Auto-filled after upload"
          />

          {form.posterPath && (
            <div style={{
              height: 160,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: poster ? `url(${poster}) center/cover` : "rgba(255,255,255,0.06)",
              marginTop: 8
            }} />
          )}

          <div className="hr" />

          <label>Video File (required) *</label>
          <input 
            type="file" 
            accept="video/*" 
            onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])} 
          />
          {uploadingVideo && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading video… {videoProgress}%</div>
              <progress value={videoProgress} max="100" style={{ width: "100%", marginTop: 8 }} />
            </div>
          )}

          <label>Video Path</label>
          <input 
            value={form.videoPath} 
            onChange={e => update("videoPath", e.target.value)} 
            required 
            placeholder="Auto-filled after upload"
          />

          <label>Runtime</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="number"
              min="0"
              value={runHours}
              onChange={e => setRunHours(e.target.value)}
              style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
              aria-label="Hours"
            />
            <span>h</span>
            <input
              type="number"
              min="0"
              max="59"
              value={runMinutes}
              onChange={e => setRunMinutes(e.target.value)}
              style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
              aria-label="Minutes"
            />
            <span>m</span>
            <input
              type="number"
              min="0"
              max="59"
              value={runSeconds}
              onChange={e => setRunSeconds(e.target.value)}
              style={{ width: 50, padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}
              aria-label="Seconds"
            />
            <span>s</span>
            <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-subtle)' }}>
              Total: {form.runtimeSeconds || 0} seconds
            </span>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" type="submit" disabled={uploadingVideo || uploadingPoster}>
              {uploadingVideo || uploadingPoster ? "Uploading..." : "Save Episode"}
            </button>
            <button className="btn btnSecondary" type="button" onClick={() => nav(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

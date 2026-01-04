import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function AdminMoviePartForm({ mode }) {
  const nav = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // movieId (create) or partId (edit)

  const [err, setErr] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Get suggested values from navigation state
  const suggestedPart = location.state?.suggestedPart || 1;

  const [form, setForm] = useState({
    movieId: mode === "create" ? Number(id) : null,
    partNumber: suggestedPart,
    title: "",
    description: "",
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
      api.getMoviePart(id).then(part => {
        setForm({
          movieId: part.movieId,
          partNumber: part.partNumber,
          title: part.title || "",
          description: part.description || "",
          videoPath: part.videoPath || "",
          runtimeSeconds: part.runtimeSeconds || ""
        });
        // If runtimeSeconds exists, split into h/m/s
        if (part.runtimeSeconds) {
          const h = Math.floor(part.runtimeSeconds / 3600);
          const m_ = Math.floor((part.runtimeSeconds % 3600) / 60);
          const s = part.runtimeSeconds % 60;
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

  async function save(e) {
    e.preventDefault();
    setErr("");

    const payload = {
      ...form,
      movieId: Number(form.movieId),
      partNumber: Number(form.partNumber),
      runtimeSeconds: form.runtimeSeconds === "" ? null : Number(form.runtimeSeconds)
    };

    try {
      if (mode === "create") {
        await api.adminCreatePart(payload);
        nav(`/admin/movies/${payload.movieId}/parts`);
      } else {
        await api.adminUpdatePart(id, payload);
        nav(`/admin/movies/${payload.movieId}/parts`);
      }
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="panel formCard">
      <div className="panelBody">
        <div className="row">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            {mode === "create" ? "Create" : "Edit"} Movie Part
          </h1>
          <button className="btn btnGhost btnSmall" onClick={() => nav(-1)}>Back</button>
        </div>

        {err && <div className="error">{err}</div>}

        <form className="form" onSubmit={save} style={{ marginTop: 8 }}>
          <label>Movie ID</label>
          <input 
            type="number"
            value={form.movieId ?? ""} 
            onChange={e => update("movieId", e.target.value)} 
            required 
            disabled={mode === "create"}
          />

          <label>Part Number</label>
          <input 
            type="number"
            min="1"
            value={form.partNumber} 
            onChange={e => update("partNumber", e.target.value)} 
            required 
            placeholder="1"
          />

          <label>Part Title</label>
          <input 
            value={form.title} 
            onChange={e => update("title", e.target.value)} 
            required 
            placeholder="e.g., Part 1, Part One, The Beginning, etc."
          />

          <label>Description</label>
          <textarea 
            value={form.description} 
            onChange={e => update("description", e.target.value)} 
            placeholder="Brief description of this part..."
          />

          <div className="hr" />

          <label>Video File *</label>
          <input type="file" accept="video/*" onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          {uploadingVideo && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading video… {videoProgress}%</div>
              <progress value={videoProgress} max="100" style={{ width: "100%", marginTop: 8 }} />
            </div>
          )}

          <label>Video Path *</label>
          <input 
            value={form.videoPath} 
            onChange={e => update("videoPath", e.target.value)} 
            required 
            placeholder="Auto-filled after upload"
          />

          {form.videoPath && (
            <div className="success" style={{ marginTop: 8 }}>
              <i className="bi bi-check-circle"></i> Video file selected
            </div>
          )}

          <div className="hr" />

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

          <div className="actions">
            <button type="submit" className="btn btnPrimary">
              <i className="bi bi-check-circle"></i> {mode === "create" ? "Create Part" : "Update Part"}
            </button>
            <button type="button" className="btn btnGhost" onClick={() => nav(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

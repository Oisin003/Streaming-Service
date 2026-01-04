import React, { useEffect, useState } from "react";
import { api, fileUrl } from "../api.js";
import { useNavigate, useParams } from "react-router-dom";

export default function AdminMovieForm({ mode }) {
  const nav = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    title: "",
    description: "",
    year: "",
    type: "MOVIE",
    genre: "",
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

  const [err, setErr] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [posterProgress, setPosterProgress] = useState(0);

  useEffect(() => {
    if (mode === "edit") {
      api.getMovie(id).then(m => {
        setForm({
          title: m.title || "",
          description: m.description || "",
          year: m.year || "",
          type: m.type || "MOVIE",
          genre: m.genre || "",
          posterPath: m.posterPath || "",
          videoPath: m.videoPath || "",
          runtimeSeconds: m.runtimeSeconds || ""
        });
        // If runtimeSeconds exists, split into h/m/s
        if (m.runtimeSeconds) {
          const h = Math.floor(m.runtimeSeconds / 3600);
          const m_ = Math.floor((m.runtimeSeconds % 3600) / 60);
          const s = m.runtimeSeconds % 60;
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
      year: form.year === "" ? null : Number(form.year),
      genre: form.genre?.trim() || null,
      posterPath: form.posterPath || null,
      videoPath: form.videoPath || null,
      runtimeSeconds: form.runtimeSeconds === "" ? null : Number(form.runtimeSeconds)
    };

    try {
      if (mode === "create") await api.adminCreateMovie(payload);
      else await api.adminUpdateMovie(id, payload);

      nav("/admin/movies");
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
            {mode === "create" ? "Create" : "Edit"} Movie / Show
          </h1>
          <button className="btn btnGhost btnSmall" onClick={() => nav("/admin/movies")}>Back</button>
        </div>

        {err && <div className="error">{err}</div>}

        <form className="form" onSubmit={save} style={{ marginTop: 8 }}>
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
          <label>Type</label>
          <select value={form.type} onChange={e => update("type", e.target.value)}>
            <option value="MOVIE">MOVIE</option>
            <option value="SHOW">SHOW</option>
          </select>

          <label>Title</label>
          <input value={form.title} onChange={e => update("title", e.target.value)} required />

          <label>Genre (e.g. Action, Sci-Fi, Drama)</label>
          <input value={form.genre} onChange={e => update("genre", e.target.value)} placeholder="Action" />

          <label>Description</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} />

          <label>Year</label>
          <input value={form.year} onChange={e => update("year", e.target.value)} />

          <div className="hr" />

          <label>Poster (upload image)</label>
          <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadPoster(e.target.files[0])} />
          {uploadingPoster && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading poster… {posterProgress}%</div>
              <div style={{
                height: 4,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
                marginTop: 4
              }}>
                <div style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  width: `${posterProgress}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          )}
          <label>Poster Path</label>
          <input value={form.posterPath} onChange={e => update("posterPath", e.target.value)} />

          {poster ? (
            <img
              className="movie-poster"
              src={poster}
              alt={form.title}
              loading="lazy"
              style={{ margin: '16px 0', display: 'block' }}
            />
          ) : (
            <div className="movie-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff', fontSize: 48, letterSpacing: 2, margin: '16px 0' }}>
              <span role="img" aria-label="No poster">🎬</span>
            </div>
          )}

          <div className="hr" />

          <label>Video (upload)</label>
          <input type="file" accept="video/*" onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
          {uploadingVideo && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading video… {videoProgress}%</div>
              <div style={{
                height: 4,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
                marginTop: 4
              }}>
                <div style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  width: `${videoProgress}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          )}

          <label>Video Path</label>
          <input value={form.videoPath} onChange={e => update("videoPath", e.target.value)} placeholder="Set after upload" />

          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" type="submit">Save</button>
            <button className="btn btnSecondary" type="button" onClick={() => nav("/admin/movies")}>Cancel</button>
          </div>

          {form.type === "MOVIE" && !form.videoPath && (
            <div className="warn">Movies should have a videoPath (upload a file).</div>
          )}
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";

export default function AdminMovies() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  function refresh() {
    api.adminList().then(setItems).catch(e => setErr(e.message));
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(m => (m.title || "").toLowerCase().includes(s));
  }, [items, q]);

  async function del(id) {
    if (!confirm("Delete this item? (Episodes will also be removed for shows)")) return;
    setErr("");
    try {
      await api.adminDeleteMovie(id);
      refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <div className="row">
        <div className="rowLeft">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            <i className="bi bi-collection-play me-3"></i>
            Movies & Shows
          </h1>
          <div className="pill">{items.length} total</div>
        </div>
        <div className="rowRight">
          <div className="searchWrap">
            <div className="searchIcon">🔎</div>
            <input
              className="search"
              style={{ width: 260 }}
              placeholder="Filter by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Link className="btn btnPrimary btnSmall" to="/admin/movies/new">
            <i className="bi bi-plus-circle me-2"></i>
            New
          </Link>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="table">
        <div className="thead">
          <div>Title</div>
          <div>Type</div>
          <div>Genre</div>
          <div>Actions</div>
        </div>

        {filtered.map(m => (
          <div className="trow" key={m.id}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{m.title}</div>
              <div className="subtle" style={{ fontSize: 12, lineHeight: 1.4 }}>
                {m.year ? `${m.year} • ` : ""}{m.description?.slice(0, 80) || "No description"}
              </div>
            </div>
            <div><span className="badge">{m.type}</span></div>
            <div>{m.genre ? <span className="badge">{m.genre}</span> : <span className="subtle">—</span>}</div>
            <div className="actions">
              <Link className="btn btnSecondary btnSmall" to={`/admin/movies/${m.id}/edit`}>
                <i className="bi bi-pencil me-2"></i>
                Edit
              </Link>
              {m.type === "SHOW" && (
                <Link className="btn btnGhost btnSmall" to={`/admin/shows/${m.id}/episodes`}>
                  <i className="bi bi-list-ol me-2"></i>
                  Episodes
                </Link>
              )}
              {m.type === "MOVIE" && (
                <Link className="btn btnGhost btnSmall" to={`/admin/movies/${m.id}/parts`}>
                  <i className="bi bi-film me-2"></i>
                  Parts
                </Link>
              )}
              <button className="btn btnDanger btnSmall" onClick={() => del(m.id)}>
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center' }} className="subtle">
            <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.3 }}></i>
            No items found.
          </div>
        )}
      </div>
    </div>
  );
}

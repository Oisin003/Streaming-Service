import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { Link, useParams } from "react-router-dom";

export default function AdminMovieParts() {
  const { id } = useParams(); // movieId
  const [movie, setMovie] = useState(null);
  const [parts, setParts] = useState([]);
  const [err, setErr] = useState("");

  function refresh() {
    Promise.all([api.getMovie(id), api.adminListParts(id)])
      .then(([m, p]) => { 
        setMovie(m); 
        setParts(p);
      })
      .catch(e => setErr(e.message));
  }

  useEffect(() => { refresh(); }, [id]);

  async function del(partId) {
    if (!confirm("Delete this part?")) return;
    setErr("");
    try {
      await api.adminDeletePart(partId);
      refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  // Get the next part number
  const nextPartNumber = useMemo(() => {
    if (parts.length === 0) return 1;
    return Math.max(...parts.map(p => p.partNumber)) + 1;
  }, [parts]);

  return (
    <div>
      <div className="row">
        <div className="rowLeft">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            Movie Parts {movie ? `— ${movie.title}` : ""}
          </h1>
          <div className="pill">{parts.length} parts</div>
        </div>
        <div className="rowRight">
          <Link 
            className="btn btnPrimary btnSmall" 
            to={`/admin/movies/${id}/parts/new`}
            state={{ suggestedPart: nextPartNumber }}
          >
            <i className="bi bi-plus-circle"></i> New Part
          </Link>
          <Link className="btn btnGhost btnSmall" to="/admin/movies">Back</Link>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="table" style={{ marginTop: 16 }}>
        <div className="thead">
          <div>Part</div>
          <div>Title</div>
          <div>Runtime</div>
          <div>Actions</div>
        </div>

        {parts.map(part => (
          <div className="trow" key={part.id}>
            <div>
              <span className="badge">Part {part.partNumber}</span>
            </div>
            <div style={{ fontWeight: 900 }}>{part.title}</div>
            <div className="subtle">{part.runtimeSeconds ? `${Math.floor(part.runtimeSeconds / 60)}m` : "—"}</div>
            <div className="actions">
              <Link className="btn btnSecondary btnSmall" to={`/admin/parts/${part.id}/edit`}>
                <i className="bi bi-pencil"></i> Edit
              </Link>
              <button className="btn btnDanger btnSmall" onClick={() => del(part.id)}>
                <i className="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}

        {parts.length === 0 && <div style={{ padding: 14 }} className="subtle">
          <i className="bi bi-inbox"></i> No parts yet. Add the first part to create a multi-part movie.
        </div>}
      </div>
    </div>
  );
}

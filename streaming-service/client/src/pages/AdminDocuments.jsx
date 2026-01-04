import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../api.js";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [err, setErr] = useState("");

  function refresh() {
    api.adminListDocuments()
      .then(setDocuments)
      .catch(e => setErr(e.message));
  }

  useEffect(() => { refresh(); }, []);

  async function del(docId, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    setErr("");
    try {
      await api.adminDeleteDocument(docId);
      refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <div className="row">
        <div className="rowLeft">
          <h1 className="pageTitle" style={{ margin: 0 }}>Documents</h1>
          <div className="pill">{documents.length} documents</div>
        </div>
        <div className="rowRight">
          <Link className="btn btnPrimary btnSmall" to="/admin/documents/new">
            <i className="bi bi-plus-circle"></i> Add Document
          </Link>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      <div className="table" style={{ marginTop: 16 }}>
        <div className="thead">
          <div>Cover</div>
          <div>Title</div>
          <div>Author</div>
          <div>Type</div>
          <div>Pages</div>
          <div>Added</div>
          <div>Actions</div>
        </div>

        {documents.map(doc => (
          <div className="trow" key={doc.id}>
            <div>
              {doc.coverPath ? (
                <img 
                  src={fileUrl(doc.coverPath)} 
                  alt={doc.title}
                  style={{ width: 40, height: 60, objectFit: "cover", borderRadius: 4 }}
                />
              ) : (
                <div style={{ 
                  width: 40, 
                  height: 60, 
                  backgroundColor: "var(--border)", 
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <i className="bi bi-file-earmark-text" style={{ fontSize: 20, opacity: 0.3 }}></i>
                </div>
              )}
            </div>
            <div style={{ fontWeight: 900 }}>{doc.title}</div>
            <div className="subtle">{doc.author || "—"}</div>
            <div>
              <span className="badge">{doc.fileType}</span>
            </div>
            <div className="subtle">{doc.pageCount || "—"}</div>
            <div className="subtle">{new Date(doc.dateAdded).toLocaleDateString()}</div>
            <div className="actions">
              <Link className="btn btnSecondary btnSmall" to={`/audiobook/${doc.id}`}>
                <i className="bi bi-book"></i> Read
              </Link>
              <Link className="btn btnSecondary btnSmall" to={`/admin/documents/${doc.id}/edit`}>
                <i className="bi bi-pencil"></i> Edit
              </Link>
              <button className="btn btnDanger btnSmall" onClick={() => del(doc.id, doc.title)}>
                <i className="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div style={{ padding: 14 }} className="subtle">
            <i className="bi bi-inbox"></i> No documents yet. Add your first audiobook!
          </div>
        )}
      </div>
    </div>
  );
}

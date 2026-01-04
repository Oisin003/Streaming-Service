import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useNavigate, useParams } from "react-router-dom";

export default function AdminDocumentForm({ mode }) {
  const nav = useNavigate();
  const { id } = useParams();

  const [err, setErr] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [docProgress, setDocProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    coverPath: "",
    filePath: "",
    fileType: "",
    extractedText: "",
    pageCount: ""
  });

  useEffect(() => {
    if (mode === "edit") {
      api.getDocument(id).then(doc => {
        setForm({
          title: doc.title || "",
          author: doc.author || "",
          description: doc.description || "",
          coverPath: doc.coverPath || "",
          filePath: doc.filePath || "",
          fileType: doc.fileType || "",
          extractedText: doc.extractedText || "",
          pageCount: doc.pageCount || ""
        });
      }).catch(e => setErr(e.message));
    }
  }, [mode, id]);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function uploadDocument(file) {
    setUploadingDoc(true);
    setDocProgress(0);
    setErr("");
    try {
      const res = await api.adminUploadDocument(file, (progress) => {
        setDocProgress(progress);
      });
      update("filePath", res.filePath);
      update("fileType", res.fileType);
      update("extractedText", res.extractedText || "");
      update("pageCount", res.pageCount || "");
      
      // Auto-fill title if empty
      if (!form.title) {
        const fileName = file.name.replace(/\.(pdf|docx)$/i, "");
        update("title", fileName);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingDoc(false);
      setDocProgress(0);
    }
  }

  async function uploadCover(file) {
    setUploadingCover(true);
    setCoverProgress(0);
    setErr("");
    try {
      const res = await api.adminUploadCover(file, (progress) => {
        setCoverProgress(progress);
      });
      update("coverPath", res.coverPath);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  }

  async function save(e) {
    e.preventDefault();
    setErr("");

    const payload = {
      ...form,
      pageCount: form.pageCount === "" ? null : Number(form.pageCount)
    };

    try {
      if (mode === "create") {
        await api.adminCreateDocument(payload);
      } else {
        await api.adminUpdateDocument(id, payload);
      }
      nav("/admin/documents");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="panel formCard">
      <div className="panelBody">
        <div className="row">
          <h1 className="pageTitle" style={{ margin: 0 }}>
            {mode === "create" ? "Add" : "Edit"} Document
          </h1>
          <button className="btn btnGhost btnSmall" onClick={() => nav(-1)}>Back</button>
        </div>

        {err && <div className="error">{err}</div>}

        <form className="form" onSubmit={save} style={{ marginTop: 8 }}>
          <label>Title *</label>
          <input 
            value={form.title} 
            onChange={e => update("title", e.target.value)} 
            required 
            placeholder="Document title"
          />

          <label>Author</label>
          <input 
            value={form.author} 
            onChange={e => update("author", e.target.value)} 
            placeholder="Author name"
          />

          <label>Description</label>
          <textarea 
            value={form.description} 
            onChange={e => update("description", e.target.value)} 
            placeholder="Brief description..."
            rows={4}
          />

          <div className="hr" />

          <label>Document File * (PDF or DOCX)</label>
          <input 
            type="file" 
            accept=".pdf,.docx" 
            onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])} 
          />
          {uploadingDoc && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading and extracting text… {docProgress}%</div>
              <progress value={docProgress} max="100" style={{ width: "100%", marginTop: 8 }} />
            </div>
          )}

          <label>File Path *</label>
          <input 
            value={form.filePath} 
            onChange={e => update("filePath", e.target.value)} 
            required 
            placeholder="Auto-filled after upload"
            readOnly
          />

          {form.extractedText && (
            <>
              <label>Extracted Text Preview</label>
              <textarea 
                value={form.extractedText.substring(0, 500) + (form.extractedText.length > 500 ? "..." : "")}
                readOnly
                rows={6}
                style={{ fontSize: 12, opacity: 0.7 }}
              />
              <div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>
                Total characters: {form.extractedText.length.toLocaleString()}
              </div>
            </>
          )}

          <div className="hr" />

          <label>Cover Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])} 
          />
          {uploadingCover && (
            <div style={{ marginTop: 8 }}>
              <div className="subtle">Uploading cover… {coverProgress}%</div>
              <progress value={coverProgress} max="100" style={{ width: "100%", marginTop: 8 }} />
            </div>
          )}

          <label>Cover Path</label>
          <input 
            value={form.coverPath} 
            onChange={e => update("coverPath", e.target.value)} 
            placeholder="Auto-filled after upload"
          />

          <label>Page Count</label>
          <input 
            type="number"
            min="1"
            value={form.pageCount} 
            onChange={e => update("pageCount", e.target.value)} 
            placeholder="Auto-detected for PDFs"
          />

          <div className="hr" />

          <button type="submit" className="btn btnPrimary" disabled={uploadingDoc || uploadingCover}>
            <i className="bi bi-check-circle"></i> {mode === "create" ? "Create" : "Update"} Document
          </button>
        </form>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="pageTitle"><i className="bi bi-speedometer2"></i> Control Center</h1>
      <div className="subtle">
        Your streaming empire starts here. Upload, organize, and manage your entire content library.
      </div>

      <div className="railHead" style={{ marginTop: 18 }}>
        <h2 className="railTitle"><i className="bi bi-collection-play"></i> Content Library</h2>
        <div className="railHint">Unlimited movies, shows & episodes</div>
      </div>

      <div className="rail">
        <Link to="/admin/movies" className="tile">
          <div className="tilePoster" />
          <div className="tileBody">
            <div className="tileTitle"><i className="bi bi-film"></i> All Content</div>
            <div className="tileMeta">
              <span className="badge">Manage</span>
              <span className="subtle">Browse your library</span>
            </div>
          </div>
        </Link>

        <Link to="/admin/movies/new" className="tile">
          <div className="tilePoster" />
          <div className="tileBody">
            <div className="tileTitle"><i className="bi bi-plus-circle"></i> Add Content</div>
            <div className="tileMeta">
              <span className="badge">Upload</span>
              <span className="subtle">Movies & TV Shows</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="hr" />
      
      <div className="railHead" style={{ marginTop: 18 }}>
        <h2 className="railTitle"><i className="bi bi-book"></i> Audiobooks</h2>
        <div className="railHint">Text-to-speech powered reading</div>
      </div>

      <div className="rail">
        <Link to="/admin/documents" className="tile">
          <div className="tilePoster" />
          <div className="tileBody">
            <div className="tileTitle"><i className="bi bi-file-earmark-text"></i> All Documents</div>
            <div className="tileMeta">
              <span className="badge">Manage</span>
              <span className="subtle">PDF & DOCX files</span>
            </div>
          </div>
        </Link>

        <Link to="/admin/documents/new" className="tile">
          <div className="tilePoster" />
          <div className="tileBody">
            <div className="tileTitle"><i className="bi bi-plus-circle"></i> Add Document</div>
            <div className="tileMeta">
              <span className="badge">Upload</span>
              <span className="subtle">Upload PDF or Word</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="hr" />
      <div className="notice">
        <i className="bi bi-lightbulb"></i> <strong>Pro Tip:</strong> Add genres to your content for automatic Netflix-style category rows on the homepage!
      </div>
    </div>
  );
}

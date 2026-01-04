import React, { useState } from "react";
import { setAuth } from "../api.js";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    setErr("");
    setAuth(username, password);
    nav("/admin");
  }

  return (
    <div className="panel formCard">
      <div className="panelBody">
        <h1 className="pageTitle"><i className="bi bi-shield-lock"></i> Admin Portal</h1>
        <div className="subtle">
          🔑 Access your content dashboard. Default: <b>admin / admin</b>
          <br />
          <small>Change credentials in <code>server/.env</code> for production</small>
        </div>

        {err && <div className="error">{err}</div>}

        <form onSubmit={submit} className="form" style={{ marginTop: 10 }}>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />

          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" type="submit">Continue</button>
            <button className="btn btnGhost" type="button" onClick={() => nav("/")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../UserContext.jsx";
import { api } from "../api.js";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const result = await api.userLogin(form);
      login(result.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authContainer">
      <div className="authCard">
        <div className="authHeader">
          <h1><i className="bi bi-box-arrow-in-right me-3"></i>Sign In</h1>
          <p className="subtle">Welcome back to your streaming hub</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="formGroup">
            <label>
              <i className="bi bi-person me-2"></i>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="formControl"
              placeholder="Your username"
            />
          </div>

          <div className="formGroup">
            <label>
              <i className="bi bi-lock me-2"></i>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="formControl"
              placeholder="Your password"
            />
          </div>

          <button type="submit" className="btn btn-accent w-100" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i>
                Signing In...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-right-circle me-2"></i>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="authFooter">
          <p className="subtle">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent">
              Create One
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

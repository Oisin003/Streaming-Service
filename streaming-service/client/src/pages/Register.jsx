import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../UserContext.jsx";
import { api } from "../api.js";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const result = await api.userRegister({
        username: form.username,
        email: form.email,
        password: form.password
      });
      
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
          <h1><i className="bi bi-person-plus-fill me-3"></i>Create Account</h1>
          <p className="subtle">Join to track your favorite content</p>
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
              placeholder="Choose a username"
            />
          </div>

          <div className="formGroup">
            <label>
              <i className="bi bi-envelope me-2"></i>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="formControl"
              placeholder="your@email.com"
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
              placeholder="At least 6 characters"
            />
          </div>

          <div className="formGroup">
            <label>
              <i className="bi bi-lock-fill me-2"></i>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="formControl"
              placeholder="Repeat password"
            />
          </div>

          <button type="submit" className="btn btn-accent w-100" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="authFooter">
          <p className="subtle">
            Already have an account?{" "}
            <Link to="/login" className="text-accent">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // Import AuthContext
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";

import log from "loglevel";

log.setLevel("debug");

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, role, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    log.info("test");

    if (user && role) {
      if (role === "owner") {
        navigate("/ownerBase/ownerDashboard");
      } else if (role === "requester") {
        navigate("/requesterBase/requesterDashboard");
      }
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Redirect happens in useEffect
    } catch (err: any) {
      let errorMessage = "Login failed. Please try again.";

      if (err.code) {
        switch (err.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email.";
            break;
          case "auth/invalid-credential":
            errorMessage = "Incorrect email or password.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please wait and try again.";
            break;
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Login to your account</h3>
        <p className="mt-3">
          Don't have an account? <Link to="/getStarted">Sign up</Link>
        </p>
        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}
        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Email address
            </label>
            <input
              type="email"
              className={`${styles.formInput} form-control`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Password</label>
            <input
              type="password"
              className={`${styles.formInput} form-control`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="d-flex mt-4">
            <div className="me-auto">
              <button
                className={`${styles.primaryButton} btn`}
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="align-self-center">
              <Link to="">I forgot my password.</Link>
            </div>
          </div>
        </form>
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default Login;

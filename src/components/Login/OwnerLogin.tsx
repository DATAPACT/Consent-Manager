import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // Import AuthContext
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";

const OwnerLogin: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Local loading state
  const { login, user } = useAuth(); // Use AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    try {
      await login(email, password); // Attempt to log in
    } catch (error: any) {
      setError(error.message);
      setLoading(false); // Reset loading on error
    }
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/ownerBase/ownerDashboard"); // Redirect to the dashboard if logged in
    }
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Login as a data owner</h3>
        <p className="mt-3">
          Don't have an account? <Link to="/ownerRegister">Sign up</Link>
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

export default OwnerLogin;

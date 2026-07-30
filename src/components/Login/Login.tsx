import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // Import AuthContext
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";

import log from "loglevel";
import { useTranslation } from "react-i18next";

log.setLevel("debug");

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation

  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  useEffect(() => {
    if (user && role) {
      if (redirect) {
        navigate(redirect);
      }
      else if (role === "owner") {
        navigate("/ownerBase/ownerDashboard");
      } 
      else if (role === "requester") {
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
      let errorMessage = t("login_error_message_1");

      if (err.code) {
        switch (err.code) {
          case "auth/user-not-found":
            errorMessage = t("login_error_message_2");
            break;
          case "auth/invalid-credential":
            errorMessage = t("login_error_message_3");
            break;
          case "auth/too-many-requests":
            errorMessage = t("login_error_message_4");
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
        <h3>{t("login_to_your_account")}</h3>
        <p className="mt-3">
          {t("dont_have_an_account")} <Link to="/getStarted">{t("sign_up")}</Link>
        </p>
        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}
        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              {t("email_address")}
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
            <label className={`${styles.formLabel} form-label`}>{t("password")}</label>
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
                {loading ? `${t("signing_in")}...` : t("login")}
              </button>
            </div>

            <div className="align-self-center">
              <Link to="">{t("forgot_password")}</Link>
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

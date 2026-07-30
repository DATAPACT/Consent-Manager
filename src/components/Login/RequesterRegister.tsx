import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/api";
import { useAuth } from "../../AuthContext";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";
import { useTranslation } from "react-i18next";

const RequesterRegister: React.FC = () => {
  const { login } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [retypePassword, setRetypePassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Add loading state
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== retypePassword) {
      setError(t("passwords_do_not_match"));
      return;
    }

    setLoading(true); // Start loading
    setError(""); // Clear previous errors

    try {
      // Register user through Express API
      const result = await register({
        email,
        password,
        name,
        role: "requester",
        type: "consumer",
      });

      if (result.success) {
        // Log in after successful registration
        await login(email, password);
        navigate("/requesterBase/requesterDashboard");
      } else {
        setError(result.error || t("registration_failed"));
        setLoading(false); // Stop loading
      }
    } catch (error: any) {
      setError(error.message || t("registration_failed"));
      setLoading(false); // Stop loading
    }
  };

  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>{t("register_as_requester")}</h3>
        <p className="mt-3">
          {t("already_have_account")} <Link to="/login">{t("login")}</Link>
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>{t("name")}</label>
            <input
              type="text"
              value={name}
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              {t("email_address")}
            </label>
            <input
              type="email"
              value={email}
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>{t("password")}</label>
            <input
              type="password"
              value={password}
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword1"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              {t("retype_password")}
            </label>
            <input
              type="password"
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword2"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="exampleCheck1"
              required
              disabled={loading}
            />
            <label className="form-check-label">
              {t("terms_and_conditions_notice")}{" "}
              <Link className="text-decoration-none" to="/">
                {t("terms_and_conditions")}
              </Link>{" "}
              {t("and")}{" "}
              <Link className="text-decoration-none" to="/">
                {t("privacy_policy")}
              </Link>
              .
            </label>
          </div>

          <div className="mb-3 mt-4">
            <button
              type="submit"
              className={`${styles.primaryButton} btn`}
              disabled={loading}
            >
              {loading ? `${t("registering")}...` : t("register")}
            </button>
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

export default RequesterRegister;

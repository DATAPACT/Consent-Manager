import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { register } from "../../services/api";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";

const OwnerRegister: React.FC = () => {
  const { login } = useAuth();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [retypePassword, setRetypePassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Add loading state
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true); // Start loading
    setError(""); // Clear previous errors

    try {
      // 1. Try Southampton API FIRST
      // Try LOCALLY FIRST
      // const masterPassword = "5hnd..jk4ne!kwjs?wnsmmf";
      // const response = await fetch(
      //   `http://negotiation-api:8001/negotiation-api/user/register?master_password_input=${masterPassword}`,
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       username_email: email,
      //       password: password,
      //       name: name,
      //       type: "provider",
      //     }),
      //   }
      // );

      // if (!response.ok) {
      //   const errData = await response.json();
      //   console.error("API registration failed:", errData);
      //   setError(
      //     "API registration failed: " + (errData?.detail || "Unknown error")
      //   );
      //   // setLoading(false); // Stop loading
      //   // return; JS NOTE: This is commented while I'm developing. Ideally there should be an external API.
      // }

      // 2. Only create Firebase user if Southampton succeeded
      const result = await register({
        email,
        password,
        name,
        role: "owner",
      });

      if (result.success) {
        // 3. Log in and redirect
        await login(email, password);
        navigate("/ownerBase/ownerDashboard");
      } else {
        setError(result.error || "Registration failed");
        setLoading(false); // Stop loading
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false); // Stop loading
    }
  };

  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Register as a data owner</h3>
        <p className="mt-3">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Name</label>
            <input
              type="text"
              value={name}
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading} // Disable during loading
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading} // Disable during loading
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Password</label>
            <input
              type="password"
              value={password}
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword1"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading} // Disable during loading
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Re-type password
            </label>
            <input
              type="password"
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword2"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              required
              disabled={loading} // Disable during loading
            />
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="exampleCheck1"
              required
              disabled={loading} // Disable during loading
            />
            <label className="form-check-label">
              I have read and agree to the{" "}
              <Link className="text-decoration-none" to="/">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link className="text-decoration-none" to="/">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <div className="mb-3 mt-4">
            <button
              type="submit"
              className={`${styles.primaryButton} btn`}
              disabled={loading} // Disable button during loading
            >
              {loading ? "Registering..." : "Register"}
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

export default OwnerRegister;

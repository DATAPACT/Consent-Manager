import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // Import Firebase utils
import { useAuth } from "../../AuthContext"; // Import the AuthContext
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import styles from "../../css/Login.module.css";

const RequesterRegister: React.FC = () => {
  const { login } = useAuth(); // Access the login function from the context
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [retypePassword, setRetypePassword] = useState<string>(""); // State for re-type password
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "requesters", user.uid), {
        name,
        email,
        role: "requester",
        createdAt: new Date(),
        ontologies: ["default"],
      });

      await login(email, password);
      navigate("/requesterBase/requesterDashboard");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Register as a data requester</h3>
        <p className="mt-3">
          Already have an account? <Link to="/requesterLogin">Login</Link>
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
              onChange={(e) => setName(e.target.value)}
              required
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
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Password</label>
            <input
              type="password"
              value={password}
              className={`${styles.formInput} form-control`}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Re-type password
            </label>
            <input
              type="password"
              value={retypePassword} // Set value for re-type password field
              className={`${styles.formInput} form-control`}
              onChange={(e) => setRetypePassword(e.target.value)} // Handle re-type password change
              required
            />
          </div>
          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" required />
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
          {/* Show error message */}
          <div className="mb-3 mt-4">
            <button type="submit" className={`${styles.primaryButton} btn`}>
              Register
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

// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // Import Firebase utils
import { useState } from "react";
import { useAuth } from "../../AuthContext"; // Import the AuthContext

// css
import styles from "../../css/Login.module.css";

const RequesterRegister: React.FC = () => {
  const { login } = useAuth(); // Access the login function from the context
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Create user data in Firestore under "requesters" collection
      await setDoc(doc(db, "requesters", user.uid), {
        name,
        email,
        role: "requester",
        createdAt: new Date(),
      });

      // After user is created, log them in to update the user context
      await login(email, password);

      // Redirect to Dashboard
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
            />
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Re-type password
            </label>
            <input
              type="password"
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword1"
            />
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="exampleCheck1"
              required
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
            <button type="submit" className={`${styles.primaryButton} btn`}>
              Register
            </button>
          </div>
        </form>
        {error && <p className="text-danger">{error}</p>}
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default RequesterRegister;

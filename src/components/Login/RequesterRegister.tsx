// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Login.module.css";

function RequesterRegister() {
  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Register as a data requester</h3>
        <p className="mt-3">
          Already have an account? <Link to="/ownerLogin">Login</Link>
        </p>
        <form className="mt-4">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Name</label>
            <input
              type="email"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Email address
            </label>
            <input
              type="email"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
            />
          </div>
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>Password</label>
            <input
              type="password"
              className={`${styles.formInput} form-control`}
              id="exampleInputPassword1"
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
            <Link
              className={`${styles.primaryButton} btn`}
              to="/ownerBase/ownerDashboard"
            >
              Continue
            </Link>
          </div>
        </form>
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
}

export default RequesterRegister;

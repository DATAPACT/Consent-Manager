// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Login.module.css";

function OwnerLogin() {
  return (
    <>
      <Navbar />
      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Login as a data owner</h3>
        <p className="mt-3">
          Don't have an account? <Link to="/ownerRegister">Sign up</Link>
        </p>
        <form className="mt-4">
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

          <div className="d-flex mt-4">
            <div className="me-auto">
              <Link
                className={`${styles.primaryButton} btn`}
                to="/ownerBase/ownerDashboard"
              >
                Log in
              </Link>
            </div>

            <div className="align-self-center">
              <Link to="/">I forgot my password.</Link>
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
}

export default OwnerLogin;

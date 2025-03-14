// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Login.module.css";

function RequesterLogin() {
  return (
    <>
      <Navbar />

      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Login as a data requester</h3>
        <p className="mt-3">
          Don't have an account? <Link to="/">Sign up</Link>
        </p>
        <form className="mt-4">
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="exampleInputPassword1"
            />
          </div>

          <div className="d-flex mt-4">
            <div className="me-auto">
              <button type="submit" className="btn btn-primary">
                Log in
              </button>
            </div>

            <div className="align-self-center">
              <Link to="/">I forgot my password.</Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default RequesterLogin;

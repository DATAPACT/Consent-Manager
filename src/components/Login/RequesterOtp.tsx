// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Login.module.css";

function RequesterOtp() {
  return (
    <>
      <Navbar />

      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>Verify your account</h3>
        <p className="mt-3">
          We have sent a verification code to <strong>example@gmail.com</strong>
          . Enter the OTP below to verify your account. <br />
          <br /> The code is valid for 10 minutes.
        </p>
        <form className="mt-4">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Verification code
            </label>
            <p className="text-muted">For example: 1H7X3H</p>
            <input
              type="text"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
            />
          </div>

          <div className="d-flex mt-4">
            <div className="me-auto">
              <Link
                className={`${styles.primaryButton} btn`}
                to="/requesterBase/requesterDashboard"
              >
                Verify
              </Link>
            </div>

            <div className="align-self-center">
              <Link to="/">Resend code</Link>
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

export default RequesterOtp;

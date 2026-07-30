// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Login.module.css";
import { useTranslation } from "react-i18next";

function OwnerOtp() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar />

      <div className={`${styles.loginBox} container w-25 p-5 shadow rounded`}>
        <h3>{t("verify_your_account")}</h3>
        <p className="mt-3">
          {t("sent_verification_code_1")} <strong>example@gmail.com</strong>
          . {t("sent_verification_code_2")} <br />
          <br /> {t("sent_verification_code_3")}
        </p>
        <form className="mt-4">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              {t("verification_code")}
            </label>
            <p className="text-muted">{t("verification_code_example")}</p>
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
                {t("verify")}
              </Link>
            </div>

            <div className="align-self-center">
              <Link to="/">{t("resend_code")}</Link>
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

export default OwnerOtp;

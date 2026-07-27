// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Home.module.css";

import demo from "../../images/demo.png";
import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section
        className={`${styles.dashboard} text-center container w-50 py-5 mt-5`}
      >
        <h1 className="fw-bold">{t("home_header_1")}</h1>
        <p className="mt-3">
          {t("home_text_1")}
        </p>
        <div className="mt-4">
          <Link className={`${styles.primaryButton} btn`} to="/getStarted">
            {t("get_started")}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`${styles.dashboardInner} container w-50 text-center`}
      >
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card h-100 shadow border-0 p-2">
              <div className="card-body">
                <h5 className="card-title fw-bold">{t("home_header_2")}</h5>
                <p className="card-text">
                  {t("home_text_2")}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow border-0 p-2">
              <div className="card-body">
                <h5 className="card-title fw-bold">{t("home_header_3")}</h5>
                <p className="card-text">
                  {t("home_text_3")}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow border-0 p-2">
              <div className="card-body">
                <h5 className="card-title fw-bold">{t("home_header_4")}</h5>
                <p className="card-text">
                  {t("home_text_4")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="bg-light py-5 mt-3">
        <div className={`${styles.dashboardInner} container w-50 text-center`}>
          <h2 className="fw-bold mb-3">{t("home_header_5")}</h2>
          <p>
            {t("home_text_5")}
          </p>
        </div>
      </section>

      {/* Product Preview Section */}
      <section
        className={`${styles.dashboardInner} container w-50 text-center py-5`}
      >
        <h2 className="fw-bold mb-4">{t("home_header_6")}</h2>
        <div className="shadow rounded p-4 bg-white">
          <img
            src={demo}
            alt="UPCAST Dashboard Preview"
            className="img-fluid rounded"
          />
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="container text-center py-5">
        <h2 className="fw-bold mb-3">{t("home_header_7")}</h2>
        <p className="mb-4">
          {t("home_text_7")}
        </p>
        <Link className={`${styles.primaryButton} btn`} to="/getStarted">
          {t("get_started")}
        </Link>
      </section>
    </>
  );
}

export default Home;

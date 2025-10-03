// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Home.module.css";

import demo from "../../images/demo.png";

function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section
        className={`${styles.dashboard} text-center container w-50 py-5 mt-5`}
      >
        <h1 className="fw-bold">Manage User Consent with Confidence</h1>
        <p className="mt-3">
          UPCAST Consent Manager helps you collect, store, and control user
          privacy preferences across all your websites and apps—while staying
          compliant with global data laws.
        </p>
        <div className="mt-4">
          <Link className={`${styles.primaryButton} btn`} to="/getStarted">
            Get started
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
                <h5 className="card-title fw-bold">Fast Integration</h5>
                <p className="card-text">
                  Drop-in scripts and APIs make setup quick and painless.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow border-0 p-2">
              <div className="card-body">
                <h5 className="card-title fw-bold">Centralized Dashboard</h5>
                <p className="card-text">
                  View and manage all user consents in one secure platform.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow border-0 p-2">
              <div className="card-body">
                <h5 className="card-title fw-bold">Customizable UI</h5>
                <p className="card-text">
                  Match consent banners and forms to your brand’s look and feel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="bg-light py-5 mt-3">
        <div className={`${styles.dashboardInner} container w-50 text-center`}>
          <h2 className="fw-bold mb-3">Built for Compliance</h2>
          <p>
            Stay compliant with GDPR, CCPA, and other global data privacy laws.
            UPCAST provides consent logs, version history, and audit trails out
            of the box.
          </p>
        </div>
      </section>

      {/* Product Preview Section */}
      <section
        className={`${styles.dashboardInner} container w-50 text-center py-5`}
      >
        <h2 className="fw-bold mb-4">See It in Action</h2>
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
        <h2 className="fw-bold mb-3">Ready to Get Started?</h2>
        <p className="mb-4">
          Try the beta version now and experience how simple user consent
          management can be.
        </p>
        <Link className={`${styles.primaryButton} btn`} to="/getStarted">
          Get Started
        </Link>
      </section>
    </>
  );
}

export default Home;

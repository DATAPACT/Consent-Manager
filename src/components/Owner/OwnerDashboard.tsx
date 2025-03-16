// css
import styles from "../../css/Dashboard.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function OwnerDashboard() {
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <h3>Dashboard</h3>
        <p>
          Review pending, approved, and revoked requests to ensure compliance
          and security.
        </p>
        <hr />
        <div className="row row-cols-1 row-cols-md-3 g-4">
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Pending requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-warning">2</h3>
                <small className="text-muted">pending requests.</small>
                <p className="card-text mt-2">
                  Review and manage incoming requests. You can approve, deny, or
                  revoke permissions based on user consent preferences.
                </p>
                <Link className={`${styles.primaryButton} btn`} to="/">
                  Manage
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Approved requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-success">3</h3>
                <small className="text-muted">approved requests.</small>
                <p className="card-text mt-2">
                  Requests you have been granted. You can review, modify, or
                  revoke permissions at any time to maintain control over data
                  access.
                </p>
                <Link className={`${styles.primaryButton} btn`} to="/">
                  View
                </Link>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card h-100">
              <div className="card-body">
                <h4 className="card-title">Expired requests</h4>
                <small className="text-muted">You have</small>
                <h3 className="mt-2 text-danger">3</h3>
                <small className="text-muted">expired requests.</small>
                <p className="card-text mt-2">
                  Requests you have been granted. You can review, modify, or
                  revoke permissions at any time to maintain control over data
                  access.
                </p>
                <Link className={`${styles.primaryButton} btn`} to="/">
                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="alert alert-primary mt-5" role="alert">
          You might have pending, approved, and potentially expired data access
          requests. Review and take action to ensure permissions align with user
          consent. Approve, deny, or revoke access as needed to maintain data
          security and compliance.
        </div>
      </div>
      <Footer />
    </>
  );
}

export default OwnerDashboard;

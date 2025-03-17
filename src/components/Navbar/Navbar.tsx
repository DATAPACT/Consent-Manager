// css
import styles from "../../css/Navbar.module.css";

// libraries
import { Link } from "react-router-dom";

// components
import logo from "../../assets/logo.png";

function Navbar() {
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid w-75">
          <Link
            className="navbar-brand"
            to="/"
            style={{
              fontWeight: "500",
            }}
          >
            <img
              src={logo}
              alt="Logo"
              width="30"
              height="24"
              className="d-inline-block align-text-top me-2"
            />
            Consent Manager
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="#">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Why us
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Who is it for
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Documentation
                </a>
              </li>
            </ul>

            {/* Sign-in Dropdown */}
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item dropdown">
                <a
                  className="nav-link"
                  role="button"
                  id="signinDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Sign In
                </a>
                <ul
                  className={`${styles.signinbox} dropdown-menu dropdown-menu-end`}
                  aria-labelledby="signinDropdown"
                >
                  <li className="p-4">
                    <small className="text-muted">
                      <strong>SIGN IN</strong>
                    </small>
                    <hr />
                    <Link
                      className="text-decoration-none text-dark"
                      to="/requesterLogin"
                    >
                      <div className="p-3 border rounded">
                        <h6>Data requester</h6>
                        <p>
                          Request access to user data based on provided consent.
                        </p>
                      </div>
                    </Link>
                    <Link
                      className="text-decoration-none text-dark"
                      to="/ownerLogin"
                    >
                      <div className="p-3 border rounded mt-3">
                        <h6>Data owner</h6>
                        <p>Grant, deny, or revoke consents for data access.</p>
                      </div>
                    </Link>
                    <p className="mt-4">
                      Don't have an account?{" "}
                      <Link to="/getStarted">Start here</Link>
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;

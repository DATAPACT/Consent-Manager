// css
import styles from "../../css/Navbar.module.css";

// libraries
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
type Role = "requester" | "owner" | null;

function Navbar() {
  const [role, setRole] = useState<Role>(null);
  const navigate = useNavigate();

  const handleSignIn = () => {
    if (role === "requester") {
      navigate("/requesterLogin");
    } else if (role === "owner") {
      navigate("/ownerLogin");
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
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
                <a className="nav-link active" aria-current="page" href="#">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Link
                </a>
              </li>
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Dropdown
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      Action
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Another action
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Something else here
                    </a>
                  </li>
                </ul>
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

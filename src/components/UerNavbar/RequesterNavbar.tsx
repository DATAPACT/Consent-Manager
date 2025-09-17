// css
import styles from "../../css/Navbar.module.css";

// libraries
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // Use AuthContext

// components
import logo from "../../assets/logo.png";

const RequesterNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { userData, logout, user } = useAuth(); // Get user and logout function from context

  const handleLogout = async () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className={`${styles.userNavbar} container-fluid w-50`}>
          <Link
            className="navbar-brand"
            to="/requesterBase/requesterDashboard"
            style={{ fontWeight: "500" }}
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
            <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

            {/* Sign-out Button */}
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {/* Show username if logged in */}
                  {userData && <strong>{userData.name || "Requester"}</strong>}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link
                      className="dropdown-item"
                      to={`/requesterBase/requesterProfile/${user?.uid}`}
                    >
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default RequesterNavbar;

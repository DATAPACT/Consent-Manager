// css
import styles from "../../css/OwnerPendingRequestsDetails.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function OwnerApprovedRequests() {
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Approved requests</h3>
        <p>
          Manage and organize your ontologies for seamless integration and use.
        </p>

        <hr />
        {/* no approved requests */}
        {/* <div className="text-center mt-5">
          <h4>No approved requests</h4>
          <p className="mt-3">
            Once you approve a request, it will appear here.
          </p>
        </div> */}
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Timestamp</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4">Request 1</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <Link
                  to="/ownerBase/ownerApprovedRequestsDetails"
                  className={`${styles.primaryButton} btn`}
                >
                  View
                </Link>
                <button
                  className={`${styles.dangerButton} btn ms-3`}
                  data-bs-toggle="modal"
                  data-bs-target="#revokeRequestModal"
                >
                  Revoke
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Request 2</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <Link
                  to="/ownerBase/ownerApprovedRequestsDetails"
                  className={`${styles.primaryButton} btn`}
                >
                  View
                </Link>
                <button
                  className={`${styles.dangerButton} btn ms-3`}
                  data-bs-toggle="modal"
                  data-bs-target="#revokeRequestModal"
                >
                  Revoke
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Request 3</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <Link
                  to="/ownerBase/ownerApprovedRequestsDetails"
                  className={`${styles.primaryButton} btn`}
                >
                  View
                </Link>
                <button
                  className={`${styles.dangerButton} btn ms-3`}
                  data-bs-toggle="modal"
                  data-bs-target="#revokeRequestModal"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* revoke modal */}
      <div
        className="modal fade"
        id="revokeRequestModal"
        aria-labelledby="revokeRequestLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="revokeRequestLabel">
                Revoke request
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to revoke this request? Once revoked, the
                changes will be final. If you're unsure, please contact the
                requester before proceeding.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <Link
                to="/ownerBase/ownerPendingRequests"
                className={`${styles.dangerButton} btn`}
                onClick={() => {
                  document.body.classList.remove("modal-open"); // Removes Bootstrap's modal-open class
                  document.querySelector(".modal-backdrop")?.remove(); // Removes the backdrop element
                }}
              >
                Revoke
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default OwnerApprovedRequests;

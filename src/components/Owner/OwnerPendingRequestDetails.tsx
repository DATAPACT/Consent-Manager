// css
import styles from "../../css/OwnerPendingRequestsDetails.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function OwnerPendingRequestsDetails() {
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/ownerBase/ownerPendingRequests"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Request 1</h3>

        <h5 className="mt-4">Sender</h5>
        <p>Senders name</p>

        <h5 className="mt-4">Date requested</h5>
        <p>Thursday 21 May 2025</p>

        <div className="d-flex flex-row mt-4">
          <div>
            <h5>Start date</h5>
            <p>Thursday 21 May 2025</p>
          </div>
          <div className="ms-5">
            <h5>End date</h5>
            <p>Thursday 21 May 2025</p>
          </div>
        </div>

        <h5 className="mt-3">More info</h5>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequuntur
          accusamus neque exercitationem amet earum temporibus praesentium
          dolorum error, quia odio velit. Et unde dignissimos doloribus
          exercitationem consectetur! Quo, reprehenderit modi!
        </p>

        <h5 className="mt-3">More info</h5>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequuntur
          accusamus neque exercitationem amet earum temporibus praesentium
          dolorum error, quia odio velit. Et unde dignissimos doloribus
          exercitationem consectetur! Quo, reprehenderit modi!
        </p>

        <div className="d-flex mt-5">
          <div>
            <button
              className={`${styles.primaryButton} btn`}
              data-bs-toggle="modal"
              data-bs-target="#approveRequestModal"
            >
              Approve
            </button>
          </div>
          <div className="ms-3">
            <Link
              className={`${styles.secondaryButton} btn`}
              to="/ownerBase/ownerPendingRequestModify"
            >
              Modify
            </Link>
          </div>
          <div className="ms-auto">
            <button
              className={`${styles.dangerButton} btn`}
              data-bs-toggle="modal"
              data-bs-target="#rejectRequestModal"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* approve modal */}
      <div
        className="modal fade"
        id="approveRequestModal"
        aria-labelledby="approveRequestLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="approveRequestLabel">
                Approve request
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve this request?</p>
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
                className={`${styles.primaryButton} btn`}
                onClick={() => {
                  document.body.classList.remove("modal-open"); // Removes Bootstrap's modal-open class
                  document.querySelector(".modal-backdrop")?.remove(); // Removes the backdrop element
                }}
              >
                Approve
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* reject modal */}
      <div
        className="modal fade"
        id="rejectRequestModal"
        aria-labelledby="rejectRequestLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="rejectRequestLabel">
                Reject request
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
                Are you sure you want to reject this request? If you're
                uncertain, consider modifying the request by suggesting
                modifications instead.
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
                Reject
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default OwnerPendingRequestsDetails;

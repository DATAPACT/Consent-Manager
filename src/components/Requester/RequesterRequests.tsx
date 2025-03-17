// css
import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function RequesterRequests() {
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterDashboard"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <div className="d-flex mb-3">
          <div className="me-auto">
            <h3 className="mt-4">Requests</h3>
            <p>
              Manage and organize your ontologies for seamless integration and
              use.
            </p>
          </div>
          <div className="align-self-center">
            <Link
              className={`${styles.primaryButton} btn`}
              to="/requesterBase/createRequest"
            >
              Create request
            </Link>
          </div>
        </div>

        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              id="nav-home-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-home"
              type="button"
              role="tab"
              aria-controls="nav-home"
              aria-selected="true"
            >
              Drafts
            </button>
            <button
              className="nav-link"
              id="nav-profile-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-profile"
              type="button"
              role="tab"
              aria-controls="nav-profile"
              aria-selected="false"
            >
              Pending
            </button>
            <button
              className="nav-link"
              id="nav-contact-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-contact"
              type="button"
              role="tab"
              aria-controls="nav-contact"
              aria-selected="false"
            >
              Approved
            </button>
          </div>
        </nav>
        <div className="tab-content" id="nav-tabContent">
          <div
            className="tab-pane fade show active"
            id="nav-home"
            role="tabpanel"
            aria-labelledby="nav-home-tab"
          >
            <table className="table mt-4">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col" className="text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">Request 1</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/editDraftRequest"
                    >
                      <i className="fa-solid fa-pen-to-square fa-lg"></i>
                    </Link>
                    <button
                      className="btn btn-sm text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteRequestModal"
                    >
                      <i className="fa-solid fa-trash fa-lg"></i>
                    </button>
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/sendDraftRequest"
                    >
                      <i className="fa-solid fa-file-import fa-lg"></i>
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 2</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/editDraftRequest"
                    >
                      <i className="fa-solid fa-pen-to-square fa-lg"></i>
                    </Link>
                    <button
                      className="btn btn-sm text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteRequestModal"
                    >
                      <i className="fa-solid fa-trash fa-lg"></i>
                    </button>
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/sendDraftRequest"
                    >
                      <i className="fa-solid fa-file-import fa-lg"></i>
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 3</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/editDraftRequest"
                    >
                      <i className="fa-solid fa-pen-to-square fa-lg"></i>
                    </Link>
                    <button
                      className="btn btn-sm text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#deleteRequestModal"
                    >
                      <i className="fa-solid fa-trash fa-lg"></i>
                    </button>
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/sendDraftRequest"
                    >
                      <i className="fa-solid fa-file-import fa-lg"></i>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="tab-pane fade"
            id="nav-profile"
            role="tabpanel"
            aria-labelledby="nav-profile-tab"
          >
            <table className="table mt-4">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col" className="text-center">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">Request 1</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/requesterPendingRequestsDetails"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 2</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/requesterPendingRequestsDetails"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 3</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <Link
                      className="btn btn-sm text-dark"
                      to="/requesterBase/requesterPendingRequestsDetails"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="tab-pane fade"
            id="nav-contact"
            role="tabpanel"
            aria-labelledby="nav-contact-tab"
          >
            <table className="table mt-4">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col" className="text-center">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">Request 1</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <button className="btn btn-sm text-dark">
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 2</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <button className="btn btn-sm text-dark">
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">Request 3</td>
                  <td className="py-4">Thursday 21 October 2025</td>
                  <td className="py-4 text-center">
                    <button className="btn btn-sm text-dark">
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* deelte request modal */}
      <div
        className="modal fade"
        id="deleteRequestModal"
        aria-labelledby="deleteRequestLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteRequestLabel">
                Are you sure?
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this request?</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className={`${styles.dangerButton} btn`}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default RequesterRequests;

// css
import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function Ontologies() {
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
            <h3 className="mt-4">Ontologies</h3>
            <p>
              Manage and organize your ontologies for seamless integration and
              use.
            </p>
          </div>
          <div className="align-self-center">
            <button
              className={`${styles.primaryButton} btn`}
              data-bs-toggle="modal"
              data-bs-target="#uploadOntologyModal"
            >
              Upload ontology
            </button>
          </div>
        </div>

        <hr />
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
              <td className="py-4">Ontology 1</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editOntologyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Ontology 2</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editOntologyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
            <tr>
              <td className="py-4">Ontology 3</td>
              <td className="py-4">Thursday 21 October 2025</td>
              <td className="py-4">
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#editontOlogyModal"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  className="btn btn-sm text-dark"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteOntologyModal"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* upload ontology modal */}
      <div
        className="modal fade"
        id="uploadOntologyModal"
        aria-labelledby="uploadOntologyLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="uploadOntologyLabel">
                Upload ontology
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
                Upload your ontology file in TXT, XML, or TTL format. Supported
                file types ensure compatibility with our system.
              </p>
              <form>
                <div className="mb-3">
                  <label className="form-label">Ontology name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Ontology file</label>
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control"
                      id="inputGroupFile01"
                      required
                    />
                  </div>
                  <div id="emailHelp" className="form-text mt-2">
                    Accepted files: .txt, .xml, .ttl
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn rounded-pill`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className={`${styles.primaryButton} btn rounded-pill`}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* deelte ontology modal */}
      <div
        className="modal fade"
        id="deleteOntologyModal"
        aria-labelledby="deleteOntologyLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteOntologyLabel">
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
              <p>
                Are you sure you want to delete this ontology? This action
                cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn rounded-pill`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className={`${styles.dangerButton} btn rounded-pill`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* edit ontology modal */}
      <div
        className="modal fade"
        id="editOntologyModal"
        aria-labelledby="editOntologyLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editOntologyLabel">
                Edit ontology
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
                Upload your ontology file in TXT, XML, or TTL format. Supported
                file types ensure compatibility with our system.
              </p>
              <form>
                <div className="mb-3">
                  <label className="form-label">Ontology name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    defaultValue={"Ontology 1"}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Ontology file</label>
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control"
                      id="inputGroupFile01"
                      required
                    />
                  </div>
                  <div id="emailHelp" className="form-text mt-2">
                    Accepted files: .txt, .xml, .ttl
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className={`${styles.secondaryButton} btn rounded-pill`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className={`${styles.primaryButton} btn rounded-pill`}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Ontologies;

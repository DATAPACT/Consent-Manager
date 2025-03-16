// css
import styles from "../../css/CreateRequest.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function CreateRequest() {
  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <Link
          className="text-decoration-none"
          to="/requesterBase/requesterRequests"
          role="button"
        >
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>

        <h3 className="mt-4">Create request</h3>
        <p>
          Create and submit a new request by specifying the necessary details,
          including relevant parameters and requirements.
        </p>

        <hr />

        <form className="w-50">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Request name
            </label>

            <input
              type="text"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              required
            />
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Choose one ore more ontologies
            </label>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckDefault"
              />
              <label className="form-check-label">Ontology 1</label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckChecked"
              />
              <label className="form-check-label">Ontology 2</label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="flexCheckChecked"
              />
              <label className="form-check-label">Ontology 3</label>
            </div>
            <div id="emailHelp" className="form-text mt-3">
              * Choosing an ontology is an optional step.
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                Start date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                aria-label="First name"
              />
            </div>
            <div className="col">
              <label className={`${styles.formLabel} form-label`}>
                End date
              </label>
              <input
                type="date"
                className={`${styles.formInput} form-control`}
                aria-label="Last name"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Phylli's editor goes here...
            </label>

            <input
              type="text"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              required
            />
          </div>
          <button className={`${styles.primaryButton} btn mt-3`}>
            Create request
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default CreateRequest;

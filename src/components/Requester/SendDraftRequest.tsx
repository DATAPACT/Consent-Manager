// css
import styles from "../../css/Ontology.module.css";

// components
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

function SendDraftRequest() {
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

        <h3 className="mt-4">Send request</h3>
        <p>Submit requests to data wwners for review and action</p>

        <hr />

        <form className="w-50">
          <div className="mb-3">
            <label className={`${styles.formLabel} form-label`}>
              Recipient's email
            </label>
            <input
              type="email"
              className={`${styles.formInput} form-control`}
              id="exampleInputEmail1"
              aria-describedby="emailHelp"
              required
            />
          </div>
        </form>

        <h5 className="mt-4">Sending a request</h5>
        <p>
          The recipient's email is required. If they don't have an account in
          the system, they will be notified by email. However, they must create
          an account to view your request and take action.
        </p>

        <h5 className="mt-4">What happens next?</h5>
        <p>
          Once the request is sent, the recipient will be notified. Please note
          that it may take some time for them to get back to you with a
          decision. If the matter is urgent or requires immediate attention,
          contact them directly.
        </p>

        <div className="mt-4">
          <button className={`${styles.primaryButton} btn`}>
            Send request
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default SendDraftRequest;

// components
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Home.module.css";

function GetStarted() {
  return (
    <>
      <Navbar />

      <div className={`${styles.dashboard} container w-50`}>
        <Link className="text-decoration-none" to="/" role="button">
          <i className="fa-solid fa-arrow-left"></i>&nbsp;&nbsp;&nbsp;Back
        </Link>
        <h3 className="mt-4">Starting with UPCAST Consent Manger</h3>
        <p className="mt-4">
          Let's start by choosing your role. You can register as a Data Owner to
          manage and respond to requests for your data, or as a Data Requester
          to submit requests for access. Select the option that best fits your
          needs.
        </p>

        <h5 className="mt-5">What is a data owner</h5>
        <p>
          A Data Owner is someone who has control over specific data and is
          responsible for managing access requests. They can review, approve, or
          deny requests from Data Requesters and ensure data is shared securely
          and appropriately.
        </p>

        <Link
          className={`${styles.primaryButton} btn mt-4`}
          to="/ownerRegister"
        >
          Continue as a data owner
        </Link>

        <h5 className="mt-5">What is a data requester</h5>
        <p>
          A Data Requester is someone who needs access to specific data and
          submits requests to Data Owners. They can provide details on why they
          need the data and follow up on request statuses.
        </p>

        <Link
          className={`${styles.primaryButton} btn mt-4`}
          to="/requesterRegister"
        >
          Continue as a data requester
        </Link>

        <div className="alert alert-primary mt-5" role="alert">
          <div className="d-flex flex-row">
            <div>
              <i className="fa-solid fa-circle-info fa-lg"></i>
            </div>
            <div className="ms-3">
              Before you proceed, ensure you select the correct role. Choosing
              the wrong option may limit your ability to perform the necessary
              actions.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default GetStarted;

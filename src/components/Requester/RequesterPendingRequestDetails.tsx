// css
import styles from "../../css/OwnerPendingRequestsDetails.module.css";

// libraries
import { Link } from "react-router-dom";

function RequesterPendingRequestsDetails() {
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
      </div>
    </>
  );
}

export default RequesterPendingRequestsDetails;

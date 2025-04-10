import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <>
      <div className="container text-center mt-5">
        <h5>Error 401</h5>
        <p>You don't have access to this page.</p>
        <Link to="../">Go back</Link>
      </div>
    </>
  );
}

export default Unauthorized;

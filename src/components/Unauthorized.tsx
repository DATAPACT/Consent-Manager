import styles from "../css/Dashboard.module.css";

function Unauthorized() {
  return (
    <>
      <div className="container text-center" style={{ marginTop: "13%" }}>
        <h1 style={{ fontSize: "100px" }}>401</h1>
        <h4>Forbidden</h4>
        <p>Access to this resource is denied.</p>
        <button
          className={`${styles.primaryButton} btn mt-2`}
          onClick={() => {
            window.history.back();
            setTimeout(() => window.location.reload(), 100);
          }}
        >
          Go back
        </button>
      </div>
    </>
  );
}

export default Unauthorized;

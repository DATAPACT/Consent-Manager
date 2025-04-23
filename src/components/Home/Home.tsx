// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Link } from "react-router-dom";

// css
import styles from "../../css/Home.module.css";

function Home() {
  return (
    <>
      <Navbar />

      <div className={`${styles.dashboard} container w-50 text-center`}>
        <h1 className="display-5 fw-bold">Take Control of User Consent</h1>
        <p>
          Manage privacy preferences easily. UPCAST Consent Manager helps you
          collect, store, and manage user consent across websites and apps. Stay
          compliant with GDPR, CCPA, and other data laws without slowing down
          your site.
        </p>
        <Link className={`${styles.primaryButton} btn`} to="/getStarted">
          Get started
        </Link>
      </div>
    </>
  );
}

export default Home;

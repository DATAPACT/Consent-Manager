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
        <h1>UPCAST Consent Manager</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vitae quis,
          temporibus enim ipsum reprehenderit optio sit ex accusantium
          voluptatibus voluptatem dolore laboriosam libero ipsa labore, aliquam
          nihil repellendus, fugiat asperiores!
        </p>
        <Link className={`${styles.primaryButton} btn`} to="/getStarted">
          Get started
        </Link>
      </div>
    </>
  );
}

export default Home;

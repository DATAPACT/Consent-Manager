// components
import Footer from "../Footer/Footer";
import OwnerNavbar from "../UerNavbar/OwnerNavbar";

// libraries
import { Link, Outlet } from "react-router-dom";

function OwnerBase() {
  return (
    <>
      <OwnerNavbar />
      <Link to="/userDetails">user details</Link>
      <Outlet />
      <Footer />
    </>
  );
}

export default OwnerBase;

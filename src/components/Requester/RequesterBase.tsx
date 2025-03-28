// components
import Footer from "../Footer/Footer";
import RequesterNavbar from "../UerNavbar/RequesterNavbar";

// libraries
import { Outlet } from "react-router-dom";

function RequesterBase() {
  return (
    <>
      <RequesterNavbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default RequesterBase;

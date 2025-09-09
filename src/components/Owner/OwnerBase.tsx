// components
import Footer from "../Footer/Footer";
import OwnerNavbar from "../UerNavbar/OwnerNavbar";

// libraries
import { Outlet } from "react-router-dom";

function OwnerBase() {
  return (
    <>
      <OwnerNavbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default OwnerBase;

// components
import RequesterNavbar from "../UerNavbar/RequesterNavbar";

// libraries
import { Outlet } from "react-router-dom";

function RequesterBase() {
  return (
    <>
      <RequesterNavbar />
      <Outlet />
    </>
  );
}

export default RequesterBase;

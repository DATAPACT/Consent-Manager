// components
import OwnerNavbar from "../UerNavbar/OwnerNavbar";

// libraries
import { Outlet } from "react-router-dom";

function OwnerBase() {
  return (
    <>
      <OwnerNavbar />
      <Outlet />
    </>
  );
}

export default OwnerBase;

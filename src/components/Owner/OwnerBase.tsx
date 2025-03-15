// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Outlet } from "react-router-dom";

function OwnerBase() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default OwnerBase;

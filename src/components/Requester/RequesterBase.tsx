// components
import Navbar from "../Navbar/Navbar";

// libraries
import { Outlet } from "react-router-dom";

function RequesterBase() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default RequesterBase;

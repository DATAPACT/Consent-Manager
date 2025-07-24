// components
import Footer from "../Footer/Footer";
import OwnerNavbar from "../UerNavbar/OwnerNavbar";

// libraries
import {  Outlet } from "react-router-dom";

// context
import { useIframe } from "../../IframeContext";

function OwnerBase() {
  const { isIframeMode } = useIframe();

  return (
    <>
      {!isIframeMode && <OwnerNavbar />}
      <Outlet />
      {!isIframeMode && <Footer />}
    </>
  );
}

export default OwnerBase;

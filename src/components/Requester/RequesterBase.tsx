// components
import Footer from "../Footer/Footer";
import RequesterNavbar from "../UerNavbar/RequesterNavbar";

// libraries
import { Outlet } from "react-router-dom";
import { useIframe } from "../../IframeContext";

function RequesterBase() {
  const { isIframeMode } = useIframe();

  return (
    <>
      {!isIframeMode && <RequesterNavbar />}
      <Outlet />
      {!isIframeMode && <Footer />}
    </>
  );
}

export default RequesterBase;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// css
import "./css/index.css";

// components
import Home from "./components/Home/Home";
import OwnerLogin from "./components/Login/OwnerLogin";
import RequesterLogin from "./components/Login/RequesterLogin";
import OwnerBase from "./components/Owner/ownerBase";
import OwnerDashboard from "./components/Owner/OwnerDashboard";
import RequesterBase from "./components/Requester/RequesterBase";
import RequesterDashboard from "./components/Requester/RequesterDashboard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ownerLogin" element={<OwnerLogin />} />
        <Route path="/requesterLogin" element={<RequesterLogin />} />
        {/* owner */}
        <Route path="/ownerBase" element={<OwnerBase />}>
          <Route path="ownerDashboard" element={<OwnerDashboard />} />
        </Route>
        {/* requester */}
        <Route path="/requesterBase" element={<RequesterBase />}>
          <Route path="requesterDashboard" element={<RequesterDashboard />} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// css
import "./css/index.css";

// components
import Home from "./components/Home/Home";
import OwnerLogin from "./components/Login/OwnerLogin";
import RequesterLogin from "./components/Login/RequesterLogin";
import OwnerBase from "./components/Owner/OwnerBase";
import OwnerDashboard from "./components/Owner/OwnerDashboard";
import RequesterBase from "./components/Requester/RequesterBase";
import RequesterDashboard from "./components/Requester/RequesterDashboard";
import Ontologies from "./components/Requester/Ontologies";
import RequesterRequests from "./components/Requester/RequesterRequests";
import CreateRequest from "./components/Requester/CreateRequest";
import OwnerRegister from "./components/Login/OwnerRegister";
import RequesterRegister from "./components/Login/RequesterRegister";
import RequesterOtp from "./components/Login/RequesterOtp";
import OwnerOtp from "./components/Login/OwnerOtp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ownerLogin" element={<OwnerLogin />} />
        <Route path="/ownerRegister" element={<OwnerRegister />} />
        <Route path="/requesterLogin" element={<RequesterLogin />} />
        <Route path="/requesterRegister" element={<RequesterRegister />} />
        <Route path="/requesterOtp" element={<RequesterOtp />} />
        <Route path="/ownerOtp" element={<OwnerOtp />} />

        {/* owner */}
        <Route path="/ownerBase" element={<OwnerBase />}>
          <Route path="ownerDashboard" element={<OwnerDashboard />} />
        </Route>

        {/* requester */}
        <Route path="/requesterBase" element={<RequesterBase />}>
          <Route path="requesterDashboard" element={<RequesterDashboard />} />
          <Route path="ontologies" element={<Ontologies />} />
          <Route path="requesterRequests" element={<RequesterRequests />} />
          <Route path="createRequest" element={<CreateRequest />} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>
);

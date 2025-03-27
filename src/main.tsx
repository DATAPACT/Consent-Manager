import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// css
import "./css/index.css";

// components
import Home from "./components/Home/Home";
import GetStarted from "./components/Home/GetStarted";
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
import OwnerPendingRequests from "./components/Owner/OwnerPendingRequests";
import OwnerPendingRequestsDetails from "./components/Owner/OwnerPendingRequestDetails";
import OwnerPendingRequestModify from "./components/Owner/OwnerPendingRequestModify";
import OwnerApprovedRequests from "./components/Owner/OwnerApprovedRequests";
import OwnerApprovedRequestsDetails from "./components/Owner/OwnerApprovedRequestDetails";
import SendDraftRequest from "./components/Requester/SendDraftRequest";
import RequesterPendingRequestsDetails from "./components/Requester/RequesterPendingRequestDetails";
import EditDraftRequest from "./components/Requester/EditDraftRequest";
import PrivateRoute from "./PrivateRoute";
import UploadOntology from "./components/Requester/UploadOntology";
import Unauthorized from "./components/Unauthorized";

// Context
import { AuthProvider } from "./AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/getStarted" element={<GetStarted />} />
          <Route path="/ownerLogin" element={<OwnerLogin />} />
          <Route path="/ownerRegister" element={<OwnerRegister />} />
          <Route path="/requesterLogin" element={<RequesterLogin />} />
          <Route path="/requesterRegister" element={<RequesterRegister />} />
          <Route path="/requesterOtp" element={<RequesterOtp />} />
          <Route path="/ownerOtp" element={<OwnerOtp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* owner */}
          <Route
            path="/ownerBase"
            element={
              <PrivateRoute requiredRole="owner" element={<OwnerBase />} />
            }
          >
            <Route path="ownerDashboard" element={<OwnerDashboard />} />
            <Route
              path="ownerPendingRequests"
              element={<OwnerPendingRequests />}
            />
            <Route
              path="ownerPendingRequestsDetails"
              element={<OwnerPendingRequestsDetails />}
            />
            <Route
              path="ownerPendingRequestModify"
              element={<OwnerPendingRequestModify />}
            />
            <Route
              path="ownerApprovedRequests"
              element={<OwnerApprovedRequests />}
            />
            <Route
              path="ownerApprovedRequestsDetails"
              element={<OwnerApprovedRequestsDetails />}
            />
          </Route>

          {/* requester */}
          <Route
            path="/requesterBase"
            element={
              <PrivateRoute
                requiredRole="requester"
                element={<RequesterBase />}
              />
            }
          >
            <Route path="requesterDashboard" element={<RequesterDashboard />} />
            <Route path="ontologies" element={<Ontologies />} />
            <Route path="requesterRequests" element={<RequesterRequests />} />
            <Route path="createRequest" element={<CreateRequest />} />
            <Route path="sendDraftRequest/:id" element={<SendDraftRequest />} />
            <Route
              path="requesterPendingRequestsDetails"
              element={<RequesterPendingRequestsDetails />}
            />
            <Route
              path="editDraftRequest/:id" // Dynamic route to capture 'id' for editing draft requests
              element={<EditDraftRequest />}
            />
            <Route path="uploadOntology" element={<UploadOntology />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>
);

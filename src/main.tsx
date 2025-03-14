import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// css
import "./css/index.css";

// components
import Home from "./components/Home/Home";
import OwnerLogin from "./components/Login/OwnerLogin";
import RequesterLogin from "./components/Login/RequesterLogin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ownerLogin" element={<OwnerLogin />} />
        <Route path="/requesterLogin" element={<RequesterLogin />} />
      </Routes>
    </Router>
  </StrictMode>
);

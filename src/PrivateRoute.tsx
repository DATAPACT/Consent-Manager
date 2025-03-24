// PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "./firebase";

interface PrivateRouteProps {
  element: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  return auth.currentUser ? <>{element}</> : <Navigate to="/" />;
};

export default PrivateRoute;

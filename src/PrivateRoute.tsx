// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Unauthorized from "./components/Unauthorized";
import { JSX } from "react";

interface PrivateRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Unauthorized />;
  }

  return children;
};

export default PrivateRoute;

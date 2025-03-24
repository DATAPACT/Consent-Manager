import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  element: React.ReactNode;
  requiredRole: "owner" | "requester"; // Add the required role for the route
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  element,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  // Return a loading spinner or null if the app is still loading
  if (loading) {
    return <div>Loading...</div>; // Or a more fancy loading spinner if you prefer
  }

  // If no user, redirect to the login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If the user's role doesn't match the required role, redirect to unauthorized page
  if (user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If the user is authenticated and has the right role, allow access to the route
  return <>{element}</>;
};

export default PrivateRoute;

import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  element: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { user, loading } = useAuth();

  // Return a loading spinner or null if the app is still loading
  if (loading) {
    return <div>Loading...</div>; // Or a more fancy loading spinner if you prefer
  }

  // If no user, redirect to the login page
  return user ? element : <Navigate to="/" replace />;
};

export default PrivateRoute;

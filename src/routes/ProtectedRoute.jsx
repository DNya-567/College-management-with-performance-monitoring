// Route guard component for RBAC checks on the frontend.
// Must NOT handle API logic, manage auth state, or define routes.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Spinner from "../components/ui/Spinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner text="Authenticating..." />;

  if (location.pathname === "/login") return children;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

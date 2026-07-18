import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, isLoggedIn, currentUser, roles }) {
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  if (Array.isArray(roles) && !roles.includes(currentUser?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute;

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ProfileGuard({ children }) {
  const { isLoggedIn, profileCompleted, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!profileCompleted) return <Navigate to="/profile/setup" replace />;
  return children;
}

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AuthGuard from './components/guards/AuthGuard';
import AdminGuard from './components/guards/AdminGuard';
import ProfileGuard from './components/guards/ProfileGuard';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnnouncementDetailPage from './pages/AnnouncementDetailPage';
import RecommendationsPage from './pages/RecommendationsPage';
import FavoritesPage from './pages/FavoritesPage';
import MyPage from './pages/MyPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminReviewListPage from './pages/AdminReviewListPage';
import AdminReviewDetailPage from './pages/AdminReviewDetailPage';
import AdminAnnouncementNewPage from './pages/AdminAnnouncementNewPage';
import AdminImportPage from './pages/AdminImportPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Navigate to="/announcements" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />

        {/* Auth required */}
        <Route path="/profile/setup" element={<AuthGuard><ProfileSetupPage /></AuthGuard>} />
        <Route path="/recommendations" element={<AuthGuard><ProfileGuard><RecommendationsPage /></ProfileGuard></AuthGuard>} />
        <Route path="/favorites" element={<AuthGuard><FavoritesPage /></AuthGuard>} />
        <Route path="/mypage" element={<AuthGuard><MyPage /></AuthGuard>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
        <Route path="/admin/review" element={<AdminGuard><AdminReviewListPage /></AdminGuard>} />
        <Route path="/admin/review/:id" element={<AdminGuard><AdminReviewDetailPage /></AdminGuard>} />
        <Route path="/admin/announcements/new" element={<AdminGuard><AdminAnnouncementNewPage /></AdminGuard>} />
        <Route path="/admin/import" element={<AdminGuard><AdminImportPage /></AdminGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/announcements" replace />} />
      </Route>
    </Routes>
  );
}

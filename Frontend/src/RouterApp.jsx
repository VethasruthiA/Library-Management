import React, { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, ShieldX } from 'lucide-react';
import UserManagementPage from './App.jsx';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { LoginPage, RegisterPage } from './AuthPages.jsx';
import { AdminDashboard, SeatDirectory, StudentDashboard, StudentProfile } from './WorkspacePages.jsx';

function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  return <Navigate to={!isAuthenticated ? '/login' : role === 'ADMIN' ? '/admin' : '/student'} replace />;
}

function RequireAuth({ children, roles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(role)) return <Navigate to="/access-denied" replace />;
  return children;
}

function AccessDenied() {
  const navigate = useNavigate();
  return <main className="access-denied-screen"><div className="access-denied-card"><span className="access-denied-icon"><ShieldX size={26} /></span><span className="auth-kicker">PERMISSION REQUIRED</span><h1>Access denied</h1><p>Your account doesn’t have permission to view this page. If you think this is a mistake, contact your library administrator.</p><div className="access-denied-actions"><button className="button button-outline" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Go back</button><Link className="button button-primary" to="/student"><BookOpen size={15} /> Student dashboard</Link></div></div></main>;
}

function AuthExpiryListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleExpired = () => navigate('/login', { replace: true, state: { message: 'Your session expired. Please sign in again.' } });
    const handleForbidden = () => navigate('/access-denied', { replace: true });
    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:forbidden', handleForbidden);
    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [navigate]);
  return null;
}

function NotFound() {
  return <main className="access-denied-screen"><div className="access-denied-card"><span className="access-denied-icon"><AlertCircle size={25} /></span><span className="auth-kicker">404 · NOT FOUND</span><h1>This page wandered off.</h1><p>That address isn’t part of the library portal.</p><Link className="button button-primary" to="/"><BookOpen size={15} /> Back to the library</Link></div></main>;
}

function RouteTree() {
  return <><AuthExpiryListener /><Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/access-denied" element={<AccessDenied />} />
    <Route path="/student" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
    <Route path="/student/seats" element={<RequireAuth><SeatDirectory /></RequireAuth>} />
    <Route path="/student/profile" element={<RequireAuth><StudentProfile /></RequireAuth>} />
    <Route path="/admin" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />
    <Route path="/admin/users" element={<RequireAuth roles={['ADMIN']}><UserManagementPage /></RequireAuth>} />
    <Route path="/admin/seats" element={<RequireAuth roles={['ADMIN']}><SeatDirectory admin /></RequireAuth>} />
    <Route path="*" element={<NotFound />} />
  </Routes></>;
}

export default function RouterApp() {
  return <AuthProvider><BrowserRouter><RouteTree /></BrowserRouter></AuthProvider>;
}

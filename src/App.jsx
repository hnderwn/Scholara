import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import Login from './pages/Login';
import Dashboard from './pages/siswa/Dashboard';
import Exam from './pages/siswa/Exam';
import Result from './pages/siswa/Result';
import Dictionary from './pages/siswa/Dictionary';
import AdminDashboard from './pages/admin/AdminDashboard';
import Questions from './pages/admin/Questions';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';
import Packages from './pages/admin/Packages';
import ResultsCenter from './pages/admin/Results';
import AuditLogs from './pages/admin/AuditLogs';
import AdminLearning from './pages/admin/Learning';
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute: Checking access', { user: !!user, profile: !!profile, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    return profile?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/siswa/dashboard" replace />;
  }

  return children;
};

// Role-based routing component
const RoleBasedRoute = ({ path, element, requiredRole }) => {
  return <Route path={path} element={<ProtectedRoute requiredRole={requiredRole}>{element}</ProtectedRoute>} />;
};

const HomeLoader = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        navigate(profile.role === 'admin' ? '/admin/dashboard' : '/siswa/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<HomeLoader />} />

            {/* Student routes */}
            <Route
              path="/siswa/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route
                      path="dashboard"
                      element={
                        <StudentLayout>
                          <Dashboard />
                        </StudentLayout>
                      }
                    />
                    <Route
                      path="exam"
                      element={
                        <StudentLayout showNav={false}>
                          <Exam />
                        </StudentLayout>
                      }
                    />
                    <Route
                      path="result"
                      element={
                        <StudentLayout>
                          <Result />
                        </StudentLayout>
                      }
                    />
                    <Route
                      path="dictionary"
                      element={
                        <StudentLayout>
                          <Dictionary />
                        </StudentLayout>
                      }
                    />
                    <Route path="*" element={<Navigate to="/siswa/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="questions" element={<Questions />} />
                      <Route path="packages" element={<Packages />} />
                      <Route path="users" element={<Users />} />
                      <Route path="results" element={<ResultsCenter />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="learning" element={<AdminLearning />} />
                      <Route path="audit-logs" element={<AuditLogs />} />
                      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WikiEditorPage from './pages/WikiEditorPage';
import WikiViewPage from './pages/WikiViewPage';
import SearchPage from './pages/SearchPage';
import AskAIPage from './pages/AskAIPage';
import AdminPage from './pages/AdminPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AgentWorkflowPage from './pages/AgentWorkflowPage';
import ApprovalsPage from './pages/ApprovalsPage';
import SherpaPage from './pages/SherpaPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/index.css';

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/:slug" element={<WikiViewPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route
            path="/ask"
            element={
              <ProtectedRoute allowedRoles={['viewer', 'editor', 'admin']}>
                <AskAIPage />
              </ProtectedRoute>
            }
          />

          {/* Editor Routes */}
          <Route
            path="/editor"
            element={
              <ProtectedRoute allowedRoles={['editor', 'admin']}>
                <WikiEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute allowedRoles={['editor', 'admin']}>
                <WikiEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Knowledge Base & Agent Routes */}
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute allowedRoles={['editor', 'admin']}>
                <KnowledgeBasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute allowedRoles={['viewer', 'editor', 'admin']}>
                <AgentWorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['editor', 'admin']}>
                <ApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sherpa"
            element={
              <ProtectedRoute allowedRoles={['viewer', 'editor', 'admin']}>
                <SherpaPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ConceptExplainer from './pages/ConceptExplainer';
import DocumentSummarizer from './pages/DocumentSummarizer';
import ProjectGenerator from './pages/ProjectGenerator';
import ExamPrep from './pages/ExamPrep';
import MockTest from './pages/MockTest';
import FocusArea from './pages/FocusArea';
import TestResult from './pages/TestResult';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/concept-explainer" element={<ProtectedRoute><ConceptExplainer /></ProtectedRoute>} />
        <Route path="/concept-explainer/:sessionId" element={<ProtectedRoute><ConceptExplainer /></ProtectedRoute>} />
        <Route path="/document-summarizer" element={<ProtectedRoute><DocumentSummarizer /></ProtectedRoute>} />
        <Route path="/project-generator" element={<ProtectedRoute><ProjectGenerator /></ProtectedRoute>} />
        <Route path="/exam-prep" element={<ProtectedRoute><ExamPrep /></ProtectedRoute>} />
        <Route path="/mock-test" element={<ProtectedRoute><MockTest /></ProtectedRoute>} />
        <Route path="/focus-area" element={<ProtectedRoute><FocusArea /></ProtectedRoute>} />
        <Route path="/test-result/:testId" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

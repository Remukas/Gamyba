import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ComponentsProvider } from '@/context/ComponentsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import LoginForm from '@/components/LoginForm';
import MainLayout from '@/components/MainLayout';
import ProductionHierarchy from '@/components/ProductionHierarchy';
import ComponentManagement from '@/pages/ComponentManagement';
import ProductionPlanning from '@/pages/ProductionPlanning';
import ComponentTracking from '@/pages/ComponentTracking';
import Analytics from '@/pages/Analytics';
import QualityControl from '@/pages/QualityControl';
import MaintenanceSchedule from '@/pages/MaintenanceSchedule';
import AdminPanel from '@/pages/AdminPanel';
import AIChat from '@/pages/AIChat';
import ProtectedRoute from '@/components/ProtectedRoute';

const AppContent = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <ComponentsProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProductionHierarchy />} />
          <Route 
            path="components" 
            element={
              <ProtectedRoute requiredPermission="manage_components">
                <ComponentManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="planning" 
            element={
              <ProtectedRoute requiredPermission="manage_production">
                <ProductionPlanning />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="tracking" 
            element={
              <ProtectedRoute requiredPermission="view_tracking">
                <ComponentTracking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <ProtectedRoute requiredPermission="view_analytics">
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="quality" 
            element={
              <ProtectedRoute requiredPermission="view_quality">
                <QualityControl />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="maintenance" 
            element={
              <ProtectedRoute requiredPermission="view_analytics">
                <MaintenanceSchedule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route path="ai-chat" element={<AIChat />} />
        </Route>
      </Routes>
      <Toaster />
    </ComponentsProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
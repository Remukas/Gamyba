import React from 'react';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission = null, requiredRole = null }) => {
  const { currentUser, hasPermission } = useAuth();

  if (!currentUser) {
    return null; // Autentifikacija bus tvarkoma App komponente
  }

  // Tikrinti rolę
  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Prieiga Uždrausta</h2>
          <p className="text-gray-600">Jūs neturite teisių peržiūrėti šį puslapį.</p>
          <p className="text-sm text-gray-500 mt-2">Reikalinga rolė: {requiredRole}</p>
        </div>
      </div>
    );
  }

  // Tikrinti leidimą
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nepakanka Teisių</h2>
          <p className="text-gray-600">Jūs neturite reikalingų teisių šiai funkcijai.</p>
          <p className="text-sm text-gray-500 mt-2">Reikalingas leidimas: {requiredPermission}</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
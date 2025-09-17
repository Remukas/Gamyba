import React from 'react';
    import { Helmet } from 'react-helmet';
    import { Routes, Route } from 'react-router-dom';
    import ProductionHierarchy from '@/components/ProductionHierarchy';
    import ComponentManagement from '@/pages/ComponentManagement';
    import ProductionPlanning from '@/pages/ProductionPlanning';
    import ComponentTracking from '@/pages/ComponentTracking';
    import MainLayout from '@/components/MainLayout';
    import { Toaster } from '@/components/ui/toaster';
    import { ComponentsProvider } from '@/context/ComponentsContext';

    function App() {
      return (
        <>
          <Helmet>
            <title>Gamybos Valdymas</title>
            <meta name="description" content="Išplėstinis gamybos ir atsargų valdymo įrankis." />
          </Helmet>
          <ComponentsProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<ProductionHierarchy />} />
                <Route path="components" element={<ComponentManagement />} />
                <Route path="planning" element={<ProductionPlanning />} />
                <Route path="tracking" element={<ComponentTracking />} />
              </Route>
            </Routes>
          </ComponentsProvider>
        </>
      );
    }

    export default App;
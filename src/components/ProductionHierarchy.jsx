import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComponents } from '@/context/ComponentsContext';
import { 
  BarChart3, 
  TrendingUp,
  Package, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Download,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ProductionHierarchy = () => {
  const { componentsInventory, subassemblies, categories } = useComponents();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const analytics = useMemo(() => {
    const totalComponents = componentsInventory.length;
    const lowStockComponents = componentsInventory.filter(c => c.stock < 10).length;
    const totalSubassemblies = Object.values(subassemblies).flat().length;
    const completedSubassemblies = Object.values(subassemblies).flat().filter(s => s.status === 'completed').length;
    
    const totalInventoryValue = componentsInventory.reduce((sum, c) => sum + (c.stock * 10), 0);
    const averageLeadTime = componentsInventory.reduce((sum, c) => sum + c.leadTimeDays, 0) / totalComponents || 0;
    
    return {
      totalComponents,
      lowStockComponents,
      totalSubassemblies,
      completedSubassemblies,
      totalInventoryValue,
      averageLeadTime: Math.round(averageLeadTime),
      completionRate: totalSubassemblies > 0 ? Math.round((completedSubassemblies / totalSubassemblies) * 100) : 0
    };
  }, [componentsInventory, subassemblies]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      const newLocked = !prev;
      toast({
        title: newLocked ? "Subasembliai užrakinti" : "Subasembliai atrakinti",
        description: newLocked ? "Dabar negalite stumdyti subasemblių" : "Dabar galite laisvai stumdyti subasemblius"
      });
      return newLocked;
    });
  }, [toast]);

  const exportData = () => {
    const data = {
      analytics,
      timestamp: new Date().toISOString(),
      components: componentsInventory,
      subassemblies: Object.values(subassemblies).flat()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex">
      {/* Sidebar Toggle Button */}
      <Button
        onClick={toggleSidebar}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-0"
        size="icon"
      >
        {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-0' : 'w-80'} overflow-hidden bg-white/80 backdrop-blur-sm border-r shadow-lg`}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Gamybos Valdymas</h2>
          <p className="text-gray-600">Produktų ir subasemblių valdymas</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-full"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              🏭 Gamybos Medis
            </h1>
            <p className="text-gray-600 text-lg">Produktų ir subasemblių valdymas</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              onClick={toggleLock}
              className={`${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg`}
            >
              {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
              {isLocked ? 'Užrakinta' : 'Atrakinta'}
            </Button>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Pagalba
            </Button>
            <Button
              onClick={exportData}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Eksportuoti
            </Button>
          </div>
        </div>

        {/* Lock Status */}
        {isLocked && (
          <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            🔒 Subasembliai užrakinti
          </div>
        )}

        {/* Tutorial Dialog */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold mb-4">🏭 Gamybos Medžio Instrukcijos</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-600">Šoninės Panelės Valdymas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Spauskite rodyklės mygtuką kairėje, kad susklapti/išskleisti šoninę panelę</li>
                    <li>Susklapus panelę matysite pilną gamybos medžio vaizdą</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600">Subasemblių Užrakinimas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Spauskite spynos mygtuką viršuje, kad užrakinti/atrakinti subasemblius</li>
                    <li>Užrakinus negalėsite stumdyti subasemblių</li>
                    <li>Užrakinti subasembliai pažymėti raudonu tašku</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Ryšiai Tarp Subasemblių:</h4>
                  <p>Mėlyni ryšiai su šešėliais rodo sąsajas tarp subasemblių - dabar aiškiau matomi.</p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowTutorial(false)}>
                  Supratau
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Main Canvas Area - This is where the production tree would be rendered */}
        <div className="bg-white/50 rounded-xl p-8 min-h-96 border-2 border-dashed border-gray-300">
          <p className="text-center text-gray-500">Gamybos medžio vizualizacija bus čia</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Viso Komponentų</p>
                    <p className="text-3xl font-bold">{analytics.totalComponents}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Mažos Atsargos</p>
                    <p className="text-3xl font-bold">{analytics.lowStockComponents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Užbaigimo Tempas</p>
                    <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Atsargų Vertė</p>
                    <p className="text-3xl font-bold">€{analytics.totalInventoryValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Gamybos Efektyvumas
                </CardTitle>
                <CardDescription>Pagrindiniai veiklos rodikliai</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Subasemblių Skaičius</span>
                  <Badge variant="outline">{analytics.totalSubassemblies}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Užbaigta</span>
                  <Badge className="bg-green-100 text-green-800">{analytics.completedSubassemblies}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Vidutinis Gavimo Laikas</span>
                  <Badge variant="outline">{analytics.averageLeadTime} d.</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Kategorijų Analizė
                </CardTitle>
                <CardDescription>Produktų linijų palyginimas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category, index) => {
                  const categorySubassemblies = subassemblies[category.id] || [];
                  return (
                    <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="outline">{categorySubassemblies.length} vnt.</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Critical Components */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Kritiniai Komponentai
              </CardTitle>
              <CardDescription>Komponentai su mažomis atsargomis (&lt; 10 vnt.)</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.lowStockComponents > 0 ? (
                <div className="space-y-3">
                  {componentsInventory
                    .filter(c => c.stock < 10)
                    .map(component => (
                      <div key={component.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <span className="font-medium text-red-900">{component.name}</span>
                          <p className="text-sm text-red-600">Gavimo laikas: {component.leadTimeDays} d.</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {component.stock} vnt.
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-medium">Visi komponentai turi pakankamas atsargas!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
};

export default ProductionHierarchy;
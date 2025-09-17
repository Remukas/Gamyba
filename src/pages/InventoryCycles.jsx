import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useComponents } from '@/context/ComponentsContext';
import { 
  Calendar, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Settings,
  Download,
  HelpCircle,
  RefreshCw,
  Target,
  TrendingUp,
  Plus,
  FileText,
  Award,
  TrendingDown,
  Minus
} from 'lucide-react';

const InventoryCycles = () => {
  const { componentsInventory } = useComponents();
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Supabase duomenų būsenos
  const [cycleSettings, setCycleSettings] = useState({
    defaultCycleMonths: 3,
    startDate: new Date().toISOString().split('T')[0],
    criticalComponents: [],
    customCycles: {}
  });
  
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [componentOverrides, setComponentOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Naujo įrašo forma
  const [newRecord, setNewRecord] = useState({
    componentId: '',
    actualStock: '',
    notes: '',
    inspector: 'Dabartinis vartotojas'
  });

  // Užkrauti duomenis iš Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Užkrauti nustatymus
      const settings = await inventoryCyclesAPI.getSettings();
      setCycleSettings({
        defaultCycleMonths: settings.default_cycle_months || 3,
        startDate: settings.start_date || new Date().toISOString().split('T')[0],
        criticalComponents: [],
        customCycles: {}
      });
      
      // Užkrauti įrašus
      const records = await inventoryCyclesAPI.getRecords();
      const formattedRecords = records.map(record => ({
        id: record.id,
        componentId: record.component_id,
        date: record.check_date,
        expectedStock: record.expected_stock,
        actualStock: record.actual_stock,
        difference: record.difference,
        notes: record.notes,
        inspector: record.inspector,
        week: record.week_number
      }));
      setInventoryRecords(formattedRecords);
      
      // Užkrauti komponentų perrašymus
      const overrides = await inventoryCyclesAPI.getComponentOverrides();
      setComponentOverrides(overrides);
      
      // Atnaujinti nustatymus su perrašymais
      const customCycles = {};
      const criticalComponents = [];
      
      overrides.forEach(override => {
        customCycles[override.component_id] = override.cycle_months;
        if (override.is_critical) {
          criticalComponents.push(override.component_id);
        }
      });
      
      setCycleSettings(prev => ({
        ...prev,
        customCycles,
        criticalComponents
      }));
      
    } catch (error) {
      console.error('Klaida kraunant duomenis:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko užkrauti duomenų iš duomenų bazės.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generuoti inventorizacijos grafiką metams
  const yearlySchedule = useMemo(() => {
    const schedule = [];
    const startDate = new Date(cycleSettings.startDate);
    const currentYear = startDate.getFullYear();
    
    for (let week = 1; week <= 52; week++) {
      const weekStart = new Date(currentYear, 0, 1 + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekComponents = [];
      
      componentsInventory.forEach(component => {
        const customCycle = cycleSettings.customCycles[component.id];
        const cycleMonths = customCycle || cycleSettings.defaultCycleMonths;
        
        const componentStartWeek = (component.id.charCodeAt(component.id.length - 1) % 52) + 1;
        const cycleWeeks = Math.round(cycleMonths * 4.33);
        
        if ((week - componentStartWeek) % cycleWeeks === 0 && week >= componentStartWeek) {
          weekComponents.push({
            ...component,
            cycleMonths,
            isCritical: cycleSettings.criticalComponents.includes(component.id)
          });
        }
      });
      
      schedule.push({
        week,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        components: weekComponents,
        totalComponents: weekComponents.length
      });
    }
    
    return schedule;
  }, [componentsInventory, cycleSettings]);

  // Analitikos skaičiavimai
  const analytics = useMemo(() => {
    const totalRecords = inventoryRecords.length;
    const accurateRecords = inventoryRecords.filter(r => r.difference === 0).length;
    const discrepancies = inventoryRecords.filter(r => r.difference !== 0).length;
    const shortages = inventoryRecords.filter(r => r.difference < 0).length;
    const surpluses = inventoryRecords.filter(r => r.difference > 0).length;
    
    const accuracyRate = totalRecords > 0 ? Math.round((accurateRecords / totalRecords) * 100) : 0;
    
    // Probleminiai komponentai
    const componentIssues = {};
    inventoryRecords.forEach(record => {
      if (record.difference !== 0) {
        if (!componentIssues[record.componentId]) {
          componentIssues[record.componentId] = {
            componentId: record.componentId,
            totalChecks: 0,
            discrepancies: 0,
            totalDifference: 0,
            lastCheck: record.date
          };
        }
        componentIssues[record.componentId].discrepancies++;
        componentIssues[record.componentId].totalDifference += Math.abs(record.difference);
      }
    });

    // Visų komponentų statistika
    inventoryRecords.forEach(record => {
      if (!componentIssues[record.componentId]) {
        componentIssues[record.componentId] = {
          componentId: record.componentId,
          totalChecks: 0,
          discrepancies: 0,
          totalDifference: 0,
          lastCheck: record.date
        };
      }
      componentIssues[record.componentId].totalChecks++;
    });

    const topProblematicComponents = Object.values(componentIssues)
      .map(issue => {
        const component = componentsInventory.find(c => c.id === issue.componentId);
        const errorRate = issue.totalChecks > 0 ? Math.round((issue.discrepancies / issue.totalChecks) * 100) : 0;
        
        return {
          ...issue,
          componentName: component?.name || 'Nežinomas komponentas',
          errorRate,
          avgDifference: issue.discrepancies > 0 ? Math.round(issue.totalDifference / issue.discrepancies) : 0
        };
      })
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10);

    // Mėnesinės tendencijos
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const monthRecords = inventoryRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === date.getFullYear() && 
               recordDate.getMonth() === date.getMonth();
      });
      
      const monthAccurate = monthRecords.filter(r => r.difference === 0).length;
      const monthTotal = monthRecords.length;
      const monthAccuracy = monthTotal > 0 ? Math.round((monthAccurate / monthTotal) * 100) : 0;
      const monthShortages = monthRecords.filter(r => r.difference < 0).length;
      const monthSurpluses = monthRecords.filter(r => r.difference > 0).length;
      
      monthlyTrends.push({
        month: date.toLocaleDateString('lt-LT', { month: 'short', year: 'numeric' }),
        accuracy: monthAccuracy,
        total: monthTotal,
        shortages: monthShortages,
        surpluses: monthSurpluses
      });
    }
    
    return {
      totalRecords,
      accurateRecords,
      discrepancies,
      shortages,
      surpluses,
      accuracyRate,
      topProblematicComponents,
      monthlyTrends
    };
  }, [inventoryRecords, componentsInventory]);

  // Statistikos
  const cycleStats = useMemo(() => {
    const totalComponents = componentsInventory.length;
    const criticalComponents = cycleSettings.criticalComponents.length;
    const completedThisMonth = inventoryRecords.filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    }).length;
    
    const upcomingWeek = yearlySchedule.find(week => {
      const weekStart = new Date(week.weekStart);
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      return weekStart >= now && weekStart <= weekFromNow;
    });
    
    const upcomingComponents = upcomingWeek ? upcomingWeek.totalComponents : 0;
    
    return {
      totalComponents,
      criticalComponents,
      completedThisMonth,
      upcomingComponents,
      averagePerWeek: Math.round(totalComponents / 52 * cycleSettings.defaultCycleMonths)
    };
  }, [componentsInventory, cycleSettings, inventoryRecords, yearlySchedule]);

  // Pridėti inventorizacijos įrašą
  const handleAddRecord = async () => {
    if (!newRecord.componentId || newRecord.actualStock === '') {
      toast({
        title: "Klaida",
        description: "Pasirinkite komponentą ir įveskite tikrą likutį.",
        variant: "destructive"
      });
      return;
    }

    const component = componentsInventory.find(c => c.id === newRecord.componentId);
    if (!component) return;

    const actualStock = parseInt(newRecord.actualStock) || 0;
    const expectedStock = component.stock;
    const difference = actualStock - expectedStock;

    try {
      const recordData = {
        componentId: newRecord.componentId,
        date: new Date().toISOString().split('T')[0],
        expectedStock,
        actualStock,
        notes: newRecord.notes,
        inspector: newRecord.inspector
      };

      await inventoryCyclesAPI.addRecord(recordData);
      
      // Atnaujinti lokalų sąrašą
      const newLocalRecord = {
        id: Date.now(),
        ...recordData,
        difference,
        week: `W${Math.ceil((new Date().getDate() + new Date().getDay()) / 7).toString().padStart(2, '0')}`
      };
      
      setInventoryRecords(prev => [newLocalRecord, ...prev]);
      setNewRecord({
        componentId: '',
        actualStock: '',
        notes: '',
        inspector: 'Dabartinis vartotojas'
      });

      toast({
        title: "Inventorizacija užregistruota!",
        description: `${component.name}: ${difference === 0 ? 'tikslus skaičius' : difference > 0 ? `+${difference} perteklius` : `${difference} trūkumas`}`
      });
    } catch (error) {
      console.error('Klaida išsaugant įrašą:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti inventorizacijos įrašo.",
        variant: "destructive"
      });
    }
  };

  // Atnaujinti komponento ciklą
  const updateComponentCycle = async (componentId, months) => {
    try {
      await inventoryCyclesAPI.saveComponentCycle(componentId, months);
      
      setCycleSettings(prev => ({
        ...prev,
        customCycles: {
          ...prev.customCycles,
          [componentId]: months
        }
      }));
      
      toast({
        title: "Ciklas atnaujintas!",
        description: `Komponento inventorizacijos ciklas pakeistas į ${months} mėn.`
      });
    } catch (error) {
      console.error('Klaida atnaujinant ciklą:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti komponento ciklo.",
        variant: "destructive"
      });
    }
  };

  // Pažymėti komponentą kaip kritinį
  const toggleCriticalComponent = async (componentId) => {
    const isCritical = cycleSettings.criticalComponents.includes(componentId);
    const newCriticalStatus = !isCritical;
    
    try {
      const currentCycle = cycleSettings.customCycles[componentId] || cycleSettings.defaultCycleMonths;
      await inventoryCyclesAPI.saveComponentCycle(componentId, currentCycle, newCriticalStatus);
      
      setCycleSettings(prev => ({
        ...prev,
        criticalComponents: newCriticalStatus
          ? [...prev.criticalComponents, componentId]
          : prev.criticalComponents.filter(id => id !== componentId)
      }));
      
      toast({
        title: newCriticalStatus ? "Komponentas pažymėtas kaip kritinis!" : "Komponentas nebėra kritinis",
        description: `Komponento statusas pakeistas.`
      });
    } catch (error) {
      console.error('Klaida keičiant kritinį statusą:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko pakeisti komponento statuso.",
        variant: "destructive"
      });
    }
  };

  // Eksportuoti duomenis
  const exportData = () => {
    const data = {
      schedule: yearlySchedule,
      settings: cycleSettings,
      records: inventoryRecords,
      analytics: analytics,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-analytics-${new Date().getFullYear()}.json`;
    a.click();
    
    toast({
      title: "Duomenys eksportuoti",
      description: "Inventorizacijos duomenys ir analitika eksportuoti."
    });
  };

  // Gauti savaitės spalvą pagal komponentų kiekį
  const getWeekColor = (totalComponents) => {
    if (totalComponents === 0) return 'bg-gray-100';
    if (totalComponents <= 2) return 'bg-green-100 border-green-300';
    if (totalComponents <= 5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  // Gauti tendencijos ikoną
  const getTrendIcon = (errorRate) => {
    if (errorRate === 0) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (errorRate <= 20) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kraunami duomenys iš duomenų bazės...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              📅 Inventorizacijos Ciklai
            </h1>
            <p className="text-gray-600 text-lg">Automatinis komponentų inventorizacijos planavimas ir analitika</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
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
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Eksportuoti
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Viso Komponentų</p>
                    <p className="text-3xl font-bold">{cycleStats.totalComponents}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Kritiniai</p>
                    <p className="text-3xl font-bold">{cycleStats.criticalComponents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Šį Mėnesį</p>
                    <p className="text-3xl font-bold">{cycleStats.completedThisMonth}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Kitą Savaitę</p>
                    <p className="text-3xl font-bold">{cycleStats.upcomingComponents}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Tikslumas</p>
                    <p className="text-3xl font-bold">{analytics.accuracyRate}%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tutorial Dialog */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold mb-4">📅 Inventorizacijos Ciklų Instrukcijos</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-600">Kaip Veikia Sistema:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Kiekvienas komponentas turi inventorizacijos ciklą (pvz. kas 3 mėn.)</li>
                    <li>Sistema automatiškai paskirsto komponentus per 52 savaites</li>
                    <li>Kritiniai komponentai gali turėti trumpesnį ciklą</li>
                    <li>Spalvų kodas: žalia (mažai), geltona (vidutiniškai), raudona (daug)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Inventorizacijos Registravimas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Pasirinkite komponentą iš sąrašo</li>
                    <li>Įveskite tikrą suskaičiuotą kiekį</li>
                    <li>Sistema automatiškai apskaičiuos skirtumą</li>
                    <li>Pridėkite pastabas apie neatitikimus</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600">Analitikos Grafikai:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Tikslumas % - kiek inventorizacijų buvo tikslios</li>
                    <li>Top probleminiai komponentai - dažniausiai klysta</li>
                    <li>Mėnesinės tendencijos - ar gerėja tikslumas</li>
                    <li>Trūkumų vs perteklių analizė</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowTutorial(false)}>Supratau</Button>
              </div>
            </motion.div>
          </div>
        )}

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Grafikas
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registruoti
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analitika
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Nustatymai
            </TabsTrigger>
          </TabsList>

          {/* Metinis Grafikas */}
          <TabsContent value="schedule">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Metinis Inventorizacijos Grafikas
                </CardTitle>
                <CardDescription>
                  52 savaitės su automatiškai paskirstytais komponentais inventorizacijai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-13 gap-2 mb-6">
                  {yearlySchedule.map(week => (
                    <motion.div
                      key={week.week}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: week.week * 0.01 }}
                      className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getWeekColor(week.totalComponents)}`}
                      title={`Savaitė ${week.week}: ${week.totalComponents} komponentų`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-bold text-gray-700">W{week.week.toString().padStart(2, '0')}</div>
                        <div className="text-lg font-bold text-gray-900">{week.totalComponents}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(week.weekStart).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Legenda */}
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded border"></div>
                    <span>0 komponentų</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border-green-300 rounded border"></div>
                    <span>1-2 komponentai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border-yellow-300 rounded border"></div>
                    <span>3-5 komponentai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border-red-300 rounded border"></div>
                    <span>6+ komponentų</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventorizacijos Registravimas */}
          <TabsContent value="register">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    Registruoti Inventorizaciją
                  </CardTitle>
                  <CardDescription>Įrašykite faktinį komponentų kiekį ir neatitikimus</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="componentSelect">Komponentas *</Label>
                    <Select value={newRecord.componentId} onValueChange={(value) => setNewRecord({...newRecord, componentId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pasirinkite komponentą..." />
                      </SelectTrigger>
                      <SelectContent>
                        {componentsInventory.map(component => (
                          <SelectItem key={component.id} value={component.id}>
                            {component.name} (Sistemoje: {component.stock} vnt.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newRecord.componentId && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm">
                        <strong>Sistemoje:</strong> {componentsInventory.find(c => c.id === newRecord.componentId)?.stock || 0} vnt.
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="actualStock">Tikras likutis *</Label>
                    <Input
                      id="actualStock"
                      type="number"
                      min="0"
                      value={newRecord.actualStock}
                      onChange={(e) => setNewRecord({...newRecord, actualStock: e.target.value})}
                      placeholder="Suskaičiuotas kiekis"
                    />
                  </div>

                  {newRecord.componentId && newRecord.actualStock && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <strong>Skirtumas:</strong> 
                        <span className={`ml-2 font-bold ${
                          parseInt(newRecord.actualStock) - (componentsInventory.find(c => c.id === newRecord.componentId)?.stock || 0) === 0 
                            ? 'text-green-600' 
                            : parseInt(newRecord.actualStock) - (componentsInventory.find(c => c.id === newRecord.componentId)?.stock || 0) > 0 
                              ? 'text-blue-600' 
                              : 'text-red-600'
                        }`}>
                          {parseInt(newRecord.actualStock) - (componentsInventory.find(c => c.id === newRecord.componentId)?.stock || 0) > 0 && '+'}
                          {parseInt(newRecord.actualStock) - (componentsInventory.find(c => c.id === newRecord.componentId)?.stock || 0)} vnt.
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="inspector">Inspektorius</Label>
                    <Input
                      id="inspector"
                      value={newRecord.inspector}
                      onChange={(e) => setNewRecord({...newRecord, inspector: e.target.value})}
                      placeholder="Vardas Pavardė"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Pastabos</Label>
                    <Textarea
                      id="notes"
                      value={newRecord.notes}
                      onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                      placeholder="Neatitikimų priežastys, pastebėjimai..."
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleAddRecord} className="w-full bg-gradient-to-r from-green-600 to-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Registruoti Inventorizaciją
                  </Button>
                </CardContent>
              </Card>

              {/* Paskutiniai įrašai */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Paskutiniai Įrašai
                  </CardTitle>
                  <CardDescription>Neseniai atliktos inventorizacijos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {inventoryRecords.slice(0, 10).map(record => {
                      const component = componentsInventory.find(c => c.id === record.componentId);
                      return (
                        <div key={record.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{component?.name || 'Nežinomas'}</h4>
                              <p className="text-xs text-gray-600">{record.inspector} • {record.date}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`${
                                record.difference === 0 ? 'bg-green-100 text-green-800' :
                                record.difference > 0 ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {record.difference === 0 ? 'Tikslus' : 
                                 record.difference > 0 ? `+${record.difference}` : 
                                 record.difference}
                              </Badge>
                            </div>
                          </div>
                          {record.notes && (
                            <p className="text-xs text-gray-600 bg-white p-2 rounded">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analitikos Grafikai */}
          <TabsContent value="analytics">
            <div className="space-y-8">
              {/* Analitikos statistikos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Tikslumas</p>
                        <p className="text-3xl font-bold">{analytics.accuracyRate}%</p>
                      </div>
                      <Award className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm">Neatitikimai</p>
                        <p className="text-3xl font-bold">{analytics.discrepancies}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Trūkumai</p>
                        <p className="text-3xl font-bold">{analytics.shortages}</p>
                      </div>
                      <Minus className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Pertekliai</p>
                        <p className="text-3xl font-bold">{analytics.surpluses}</p>
                      </div>
                      <Plus className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Probleminiai Komponentai */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-600" />
                    Top Probleminiai Komponentai
                  </CardTitle>
                  <CardDescription>Komponentai su dažniausiais neatitikimais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProblematicComponents.length > 0 ? (
                      analytics.topProblematicComponents.map((comp, index) => (
                        <div key={comp.componentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{comp.componentName}</h4>
                              <p className="text-sm text-gray-600">
                                {comp.discrepancies}/{comp.totalChecks} neatitikimų • 
                                Vid. skirtumas: {comp.avgDifference} vnt.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getTrendIcon(comp.errorRate)}
                            <Badge className={`${
                              comp.errorRate === 0 ? 'bg-green-100 text-green-800' :
                              comp.errorRate <= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {comp.errorRate}% klaidų
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
                        <p>Nėra probleminių komponentų!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mėnesinės Tendencijos */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Mėnesinės Tendencijos
                  </CardTitle>
                  <CardDescription>Inventorizacijos tikslumo kitimas per 6 mėnesius</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {analytics.monthlyTrends.map((month, index) => (
                      <div key={index} className="text-center">
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700">{month.month}</div>
                          <div className="text-2xl font-bold text-purple-600">{month.accuracy}%</div>
                        </div>
                        
                        {/* Vizualus stulpelis */}
                        <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden">
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-500"
                            style={{ height: `${month.accuracy}%` }}
                          ></div>
                          <div className="absolute inset-0 flex flex-col justify-end p-2 text-xs text-white">
                            <div>✓ {month.total}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-red-600">Trūk:</span>
                            <span className="font-bold">{month.shortages}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Pert:</span>
                            <span className="font-bold">{month.surpluses}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nustatymai */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Bendri Nustatymai
                  </CardTitle>
                  <CardDescription>Numatytieji inventorizacijos parametrai</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="defaultCycle">Numatytasis ciklas (mėnesiais)</Label>
                    <Select 
                      value={cycleSettings.defaultCycleMonths.toString()} 
                      onValueChange={(value) => setCycleSettings(prev => ({...prev, defaultCycleMonths: parseInt(value)}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Kas mėnesį</SelectItem>
                        <SelectItem value="2">Kas 2 mėnesius</SelectItem>
                        <SelectItem value="3">Kas 3 mėnesius</SelectItem>
                        <SelectItem value="6">Kas 6 mėnesius</SelectItem>
                        <SelectItem value="12">Kas metus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Pradžios data</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={cycleSettings.startDate}
                      onChange={(e) => setCycleSettings(prev => ({...prev, startDate: e.target.value}))}
                    />
                  </div>

                  <Button 
                    onClick={() => {
                      setCycleSettings(prev => ({...prev, startDate: new Date().toISOString().split('T')[0]}));
                      toast({ title: "Nustatymai atnaujinti!", description: "Pradžios data nustatyta į šiandien." });
                    }}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atnaujinti Grafiką
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-600" />
                    Komponentų Valdymas
                  </CardTitle>
                  <CardDescription>Individualūs ciklai ir kritiniai komponentai</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {componentsInventory.map(component => {
                      const isCritical = cycleSettings.criticalComponents.includes(component.id);
                      const customCycle = cycleSettings.customCycles[component.id];
                      const componentStats = analytics.topProblematicComponents.find(c => c.componentId === component.id);
                      
                      return (
                        <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{component.name}</div>
                            <div className="text-sm text-gray-600">
                              Likutis: {component.stock} vnt. • Gavimas: {component.leadTimeDays}d
                              {componentStats && (
                                <span className="text-red-600 ml-2">
                                  • {componentStats.errorRate}% klaidų
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={(customCycle || cycleSettings.defaultCycleMonths).toString()}
                              onValueChange={(value) => updateComponentCycle(component.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1m</SelectItem>
                                <SelectItem value="2">2m</SelectItem>
                                <SelectItem value="3">3m</SelectItem>
                                <SelectItem value="6">6m</SelectItem>
                                <SelectItem value="12">12m</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant={isCritical ? "destructive" : "outline"}
                              onClick={() => toggleCriticalComponent(component.id)}
                            >
                              {isCritical ? "Kritinis" : "Normalus"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default InventoryCycles;
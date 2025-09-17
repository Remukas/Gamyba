import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  TrendingUp
} from 'lucide-react';

const InventoryCycles = () => {
  const { componentsInventory } = useComponents();
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Inventorizacijos ciklų nustatymai
  const [cycleSettings, setCycleSettings] = useState(() => {
    const saved = localStorage.getItem('inventory-cycle-settings');
    return saved ? JSON.parse(saved) : {
      defaultCycleMonths: 3, // Kas 3 mėnesius
      startDate: new Date().toISOString().split('T')[0],
      criticalComponents: [], // Komponentai, kuriems reikia dažnesnės inventorizacijos
      customCycles: {} // Individualūs ciklai komponentams
    };
  });

  // Inventorizacijos įrašai
  const [inventoryRecords, setInventoryRecords] = useState(() => {
    const saved = localStorage.getItem('inventory-records');
    return saved ? JSON.parse(saved) : [];
  });

  // Išsaugoti nustatymus
  useEffect(() => {
    localStorage.setItem('inventory-cycle-settings', JSON.stringify(cycleSettings));
  }, [cycleSettings]);

  useEffect(() => {
    localStorage.setItem('inventory-records', JSON.stringify(inventoryRecords));
  }, [inventoryRecords]);

  // Generuoti inventorizacijos grafiką metams
  const yearlySchedule = useMemo(() => {
    const schedule = [];
    const startDate = new Date(cycleSettings.startDate);
    const currentYear = startDate.getFullYear();
    
    // Generuoti 52 savaites
    for (let week = 1; week <= 52; week++) {
      const weekStart = new Date(currentYear, 0, 1 + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekComponents = [];
      
      componentsInventory.forEach(component => {
        const customCycle = cycleSettings.customCycles[component.id];
        const cycleMonths = customCycle || cycleSettings.defaultCycleMonths;
        
        // Apskaičiuoti, ar šią savaitę reikia inventorizuoti šį komponentą
        const componentStartWeek = (component.id.charCodeAt(component.id.length - 1) % 52) + 1;
        const cycleWeeks = Math.round(cycleMonths * 4.33); // ~4.33 savaitės per mėnesį
        
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

  // Atnaujinti komponento ciklą
  const updateComponentCycle = (componentId, months) => {
    setCycleSettings(prev => ({
      ...prev,
      customCycles: {
        ...prev.customCycles,
        [componentId]: months
      }
    }));
  };

  // Pažymėti komponentą kaip kritinį
  const toggleCriticalComponent = (componentId) => {
    setCycleSettings(prev => ({
      ...prev,
      criticalComponents: prev.criticalComponents.includes(componentId)
        ? prev.criticalComponents.filter(id => id !== componentId)
        : [...prev.criticalComponents, componentId]
    }));
  };

  // Užregistruoti inventorizaciją
  const recordInventory = (componentId, actualStock, notes = '') => {
    const record = {
      id: Date.now(),
      componentId,
      date: new Date().toISOString().split('T')[0],
      actualStock,
      notes,
      inspector: 'Dabartinis vartotojas' // Galima pakeisti į tikrą vartotoją
    };
    
    setInventoryRecords(prev => [record, ...prev]);
    
    toast({
      title: "Inventorizacija užregistruota!",
      description: `Komponento inventorizacija sėkmingai įrašyta.`
    });
  };

  // Eksportuoti grafiką
  const exportSchedule = () => {
    const data = {
      schedule: yearlySchedule,
      settings: cycleSettings,
      stats: cycleStats,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-schedule-${new Date().getFullYear()}.json`;
    a.click();
    
    toast({
      title: "Grafikas eksportuotas",
      description: "Inventorizacijos grafikas sėkmingai eksportuotas."
    });
  };

  // Gauti savaitės spalvą pagal komponentų kiekį
  const getWeekColor = (totalComponents) => {
    if (totalComponents === 0) return 'bg-gray-100';
    if (totalComponents <= 2) return 'bg-green-100 border-green-300';
    if (totalComponents <= 5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

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
            <p className="text-gray-600 text-lg">Automatinis komponentų inventorizacijos planavimas</p>
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
              onClick={exportSchedule}
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
                    <p className="text-purple-100 text-sm">Vid./Savaitė</p>
                    <p className="text-3xl font-bold">{cycleStats.averagePerWeek}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
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
                  <h4 className="font-semibold text-green-600">Nustatymai:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Numatytasis ciklas - kas kiek mėnesių tikrinti</li>
                    <li>Pradžios data - nuo kada pradėti skaičiuoti</li>
                    <li>Kritiniai komponentai - dažnesnė inventorizacija</li>
                    <li>Individualūs ciklai - skirtingi terminai komponentams</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600">Grafikas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>52 savaitės per metus</li>
                    <li>Kiekviena savaitė rodo komponentų skaičių</li>
                    <li>Galima matyti apkrovą ir planuoti darbuotojus</li>
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
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Grafikas
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Nustatymai
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Įrašai
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
                      
                      return (
                        <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{component.name}</div>
                            <div className="text-sm text-gray-600">
                              Likutis: {component.stock} vnt. • Gavimas: {component.leadTimeDays}d
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

          {/* Inventorizacijos Įrašai */}
          <TabsContent value="records">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Inventorizacijos Įrašai
                </CardTitle>
                <CardDescription>Visi atlikti inventorizacijos patikrinimai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {inventoryRecords.length > 0 ? (
                    inventoryRecords.map(record => {
                      const component = componentsInventory.find(c => c.id === record.componentId);
                      return (
                        <div key={record.id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{component?.name || 'Nežinomas komponentas'}</h3>
                              <p className="text-sm text-gray-600">Inspektorius: {record.inspector}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">{record.date}</div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {record.actualStock} vnt.
                              </Badge>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
                              {record.notes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Inventorizacijos įrašų nėra</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default InventoryCycles;

export default InventoryCycles
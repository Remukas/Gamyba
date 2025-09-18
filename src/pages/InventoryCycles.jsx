import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComponents } from '@/context/ComponentsContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Package,
  RefreshCw,
  HelpCircle,
  BarChart3,
  TrendingUp,
  FileText,
  Eye
} from 'lucide-react';
import InventoryCheckDialog from '@/components/InventoryCheckDialog';
import InventoryHistoryDialog from '@/components/InventoryHistoryDialog';

const InventoryCycles = () => {
  const { componentsInventory } = useComponents();
  const { toast } = useToast();
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInventoryCheck, setShowInventoryCheck] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Simuluoti inventorizacijos įrašus
  const [inventoryRecords, setInventoryRecords] = useState([
    {
      id: 1,
      week_number: 'W02',
      component_name: 'Variklio korpusas',
      expected_stock: 50,
      actual_stock: 48,
      difference: -2,
      inspector: 'Jonas Petraitis',
      check_date: '2024-01-08',
      notes: 'Rasti 2 defektiniai vienetai'
    },
    {
      id: 2,
      week_number: 'W02',
      component_name: 'Cilindro galvutė',
      expected_stock: 40,
      actual_stock: 42,
      difference: 2,
      inspector: 'Jonas Petraitis',
      check_date: '2024-01-08',
      notes: 'Rasti papildomi vienetai sandėlyje'
    },
    {
      id: 3,
      week_number: 'W01',
      component_name: 'Stūmoklis',
      expected_stock: 100,
      actual_stock: 95,
      difference: -5,
      inspector: 'Marija Kazlauskienė',
      check_date: '2024-01-01',
      notes: 'Trūksta 5 vienetų, galimas vagystės atvejis'
    }
  ]);

  const getCurrentWeek = () => {
    // 2025-01-18 yra W03 savaitė
    const now = new Date('2025-01-18'); // Simuliuojame dabartinę datą
    const yearStart = new Date(2025, 0, 6); // 2025-01-06 yra pirmadienio W02 pradžia
    const diff = now - yearStart;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.max(1, Math.ceil(diff / oneWeek) + 1); // +1 nes pradedame nuo W02
  };

  const currentWeek = getCurrentWeek();

  const weeks = useMemo(() => {
    const weeksList = [];
    for (let week = 1; week <= 12; week++) {
      const weekStr = `W${week.toString().padStart(2, '0')}`;
      const weekRecords = inventoryRecords.filter(record => record.week_number === weekStr);
      const isCompleted = weekRecords.length > 0;
      const isOverdue = week < currentWeek && !isCompleted;
      const isCurrent = week === currentWeek;
      
      weeksList.push({
        week: weekStr,
        weekNumber: week,
        isCompleted,
        isOverdue,
        isCurrent,
        recordsCount: weekRecords.length,
        discrepancies: weekRecords.filter(r => r.difference !== 0).length
      });
    }
    return weeksList;
  }, [inventoryRecords, currentWeek]);

  const stats = useMemo(() => {
    const completedWeeks = weeks.filter(w => w.isCompleted).length;
    const overdueWeeks = weeks.filter(w => w.isOverdue).length;
    const totalDiscrepancies = inventoryRecords.reduce((sum, record) => sum + Math.abs(record.difference), 0);
    const totalComponents = componentsInventory.length;
    
    // Komponentų su dažnais neatitikimais analizė
    const componentDiscrepancies = {};
    inventoryRecords.forEach(record => {
      if (record.difference !== 0) {
        componentDiscrepancies[record.component_name] = (componentDiscrepancies[record.component_name] || 0) + 1;
      }
    });
    
    const problematicComponents = Object.entries(componentDiscrepancies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      completedWeeks,
      overdueWeeks,
      totalDiscrepancies,
      totalComponents,
      problematicComponents
    };
  }, [weeks, inventoryRecords, componentsInventory]);

  const handleWeekClick = (week) => {
    if (week.isCompleted) {
      // Rodyti istorijos langą su tos savaitės duomenimis
      setSelectedWeek(week);
      setShowHistory(true);
    } else {
      // Pradėti naują inventorizaciją
      setSelectedWeek(week);
      setShowInventoryCheck(true);
    }
  };

  const handleInventoryComplete = (weekData, records) => {
    // Pridėti naujus įrašus
    const newRecords = records.map(record => ({
      id: Date.now() + Math.random(),
      week_number: weekData.week,
      component_name: record.componentName,
      expected_stock: record.expectedStock,
      actual_stock: record.actualStock,
      difference: record.actualStock - record.expectedStock,
      inspector: record.inspector,
      check_date: new Date().toISOString().split('T')[0],
      notes: record.notes || ''
    }));

    setInventoryRecords(prev => [...newRecords, ...prev]);
    
    toast({
      title: "Inventorizacija užbaigta!",
      description: `${weekData.week} savaitės inventorizacija sėkmingai įrašyta. Rasta ${records.filter(r => r.actualStock !== r.expectedStock).length} neatitikimų.`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              🔄 Inventorizacijos Ciklai
            </h1>
            <p className="text-gray-600 text-lg">Savaitinė komponentų inventorizacija ir neatitikimų sekimas</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              onClick={() => setShowHistory(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Visa Istorija
            </Button>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Pagalba
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Užbaigta Savaičių</p>
                    <p className="text-3xl font-bold">{stats.completedWeeks}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Vėluoja</p>
                    <p className="text-3xl font-bold">{stats.overdueWeeks}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Neatitikimai</p>
                    <p className="text-3xl font-bold">{stats.totalDiscrepancies}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Viso Komponentų</p>
                    <p className="text-3xl font-bold">{stats.totalComponents}</p>
                  </div>
                  <Package className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Savaitinis Inventorizacijos Grafikas
              </CardTitle>
              <CardDescription>
                Spauskite ant savaitės: žalia - peržiūrėti rezultatus, pilka - pradėti inventorizaciją, raudona - vėluoja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {weeks.map(week => (
                  <Button
                    key={week.week}
                    onClick={() => handleWeekClick(week)}
                    variant="outline"
                    className={`h-20 p-2 flex flex-col items-center justify-center text-xs font-semibold transition-all relative ${
                      week.isCompleted 
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                        : week.isOverdue
                        ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                        : week.isCurrent
                        ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 ring-2 ring-blue-400'
                        : 'hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-lg">{week.week}</span>
                    {week.isCompleted && (
                      <>
                        <CheckCircle className="h-4 w-4 mt-1" />
                        {week.discrepancies > 0 && (
                          <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0">
                            {week.discrepancies}
                          </Badge>
                        )}
                      </>
                    )}
                    {week.isOverdue && <Clock className="h-4 w-4 mt-1" />}
                    {week.isCurrent && !week.isCompleted && (
                      <span className="text-xs mt-1 font-medium">Dabartinė</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Problematic Components */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  Problematiški Komponentai
                </CardTitle>
                <CardDescription>Komponentai su dažniausiais neatitikimais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.problematicComponents.length > 0 ? (
                    stats.problematicComponents.map(([componentName, count], index) => (
                      <div key={componentName} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <span className="font-medium text-red-900">{componentName}</span>
                          <p className="text-sm text-red-600">Neatitikimų skaičius</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {count} kartų
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3" />
                      <p className="font-medium">Nėra problematiškų komponentų!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Records */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                      Paskutiniai Įrašai
                    </CardTitle>
                    <CardDescription>Naujausi inventorizacijos rezultatai</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visa Istorija
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {inventoryRecords.slice(0, 5).map(record => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{record.component_name}</span>
                        <div className="text-sm text-gray-600">
                          {record.week_number} • {record.inspector}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={record.difference === 0 ? 'bg-green-100 text-green-800' : record.difference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                          {record.difference > 0 ? '+' : ''}{record.difference}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {record.expected_stock} → {record.actual_stock}
                        </div>
                      </div>
                    </div>
                  ))}
                  {inventoryRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Inventorizacijos įrašų dar nėra</p>
                    </div>
                  )}
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
              <h3 className="text-xl font-semibold mb-4">🔄 Inventorizacijos Ciklų Instrukcijos</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-600">Kaip Atlikti Inventorizaciją:</h4>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Spauskite ant pilkos savaitės, kad pradėtumėte</li>
                    <li>Atsidars komponentų sąrašas su numatytais likučiais</li>
                    <li>Įveskite faktiškai rastus kiekius</li>
                    <li>Pridėkite pastabas prie neatitikimų</li>
                    <li>Išsaugokite rezultatus</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Spalvų Reikšmės:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><span className="text-green-600">Žalia</span> - inventorizacija užbaigta</li>
                    <li><span className="text-blue-600">Mėlyna</span> - dabartinė savaitė</li>
                    <li><span className="text-red-600">Raudona</span> - inventorizacija vėluoja</li>
                    <li><span className="text-gray-600">Pilka</span> - dar neatlikta</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600">Neatitikimų Analizė:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sistema automatiškai seka komponentus su dažnais neatitikimais</li>
                    <li>Raudoni skaičiukai rodo neatitikimų kiekį savaitėje</li>
                    <li>Galite peržiūrėti visą istoriją ir tendencijas</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowTutorial(false)}>Supratau</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Inventory Check Dialog */}
        <InventoryCheckDialog
          open={showInventoryCheck}
          onOpenChange={setShowInventoryCheck}
          week={selectedWeek}
          components={componentsInventory}
          onComplete={handleInventoryComplete}
        />

        {/* History Dialog */}
        <InventoryHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          records={inventoryRecords}
          selectedWeek={selectedWeek}
          components={componentsInventory}
        />
      </motion.div>
    </div>
  );
};

export default InventoryCycles;
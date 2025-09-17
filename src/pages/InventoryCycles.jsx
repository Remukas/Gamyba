import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';

const InventoryCycles = () => {
  const { componentsInventory } = useComponents();
  const { toast } = useToast();
  
  const [showTutorial, setShowTutorial] = useState(false);

  const inventoryRecords = [
    {
      id: 1,
      component_name: 'Variklio korpusas',
      expected_stock: 50,
      actual_stock: 48,
      difference: -2,
      week_number: 'W03',
      inspector: 'Jonas Petraitis'
    },
    {
      id: 2,
      component_name: 'Cilindro galvutė',
      expected_stock: 40,
      actual_stock: 42,
      difference: 2,
      week_number: 'W02',
      inspector: 'Marija Kazlauskienė'
    }
  ];

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  const currentWeek = getCurrentWeek();

  const weeks = [];
  for (let week = 1; week <= 12; week++) {
    const weekStr = `W${week.toString().padStart(2, '0')}`;
    const isCompleted = inventoryRecords.some(record => record.week_number === weekStr);
    const isOverdue = week < currentWeek && !isCompleted;
    
    weeks.push({
      week: weekStr,
      weekNumber: week,
      isCompleted,
      isOverdue
    });
  }

  const stats = {
    completedWeeks: weeks.filter(w => w.isCompleted).length,
    overdueWeeks: weeks.filter(w => w.isOverdue).length,
    totalDiscrepancies: inventoryRecords.reduce((sum, record) => sum + Math.abs(record.difference), 0),
    totalComponents: componentsInventory.length
  };

  const handleWeekClick = (week) => {
    toast({
      title: "Inventorizacija",
      description: `Pasirinkta ${week.week} savaitė. Funkcionalumas bus pridėtas vėliau.`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              🔄 Inventorizacijos Ciklai
            </h1>
            <p className="text-gray-600 text-lg">Savaitinė komponentų inventorizacija ir neatitikimų sekimas</p>
          </div>
          <Button
            onClick={() => setShowTutorial(true)}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm hover:bg-white mt-4 md:mt-0"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Pagalba
          </Button>
        </div>

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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Savaitinis Inventorizacijos Grafikas
              </CardTitle>
              <CardDescription>
                Spauskite ant savaitės, kad pradėtumėte inventorizaciją. Žalia - užbaigta, raudona - vėluoja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {weeks.map(week => (
                  <Button
                    key={week.week}
                    onClick={() => handleWeekClick(week)}
                    variant="outline"
                    className={`h-16 p-2 flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                      week.isCompleted 
                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                        : week.isOverdue
                        ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-bold">{week.week}</span>
                    {week.isCompleted && <CheckCircle className="h-3 w-3 mt-1" />}
                    {week.isOverdue && <Clock className="h-3 w-3 mt-1" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Paskutiniai Inventorizacijos Įrašai
              </CardTitle>
              <CardDescription>Naujausi inventorizacijos rezultatai ir neatitikimai</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {inventoryRecords.length > 0 ? (
                  inventoryRecords.map(record => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{record.component_name}</span>
                        <div className="text-sm text-gray-600">
                          {record.week_number} • {record.inspector}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={record.difference === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {record.difference > 0 ? '+' : ''}{record.difference}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {record.expected_stock} → {record.actual_stock}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Inventorizacijos įrašų dar nėra</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                  <h4 className="font-semibold text-blue-600">Pagrindinės Funkcijos:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Savaitinis inventorizacijos grafikas</li>
                    <li>Komponentų neatitikimų sekimas</li>
                    <li>Automatinis likučių atnaujinimas</li>
                    <li>Inventorizacijos istorija</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Spalvų Reikšmės:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><span className="text-green-600">Žalia</span> - inventorizacija užbaigta</li>
                    <li><span className="text-red-600">Raudona</span> - inventorizacija vėluoja</li>
                    <li><span className="text-gray-600">Pilka</span> - dar neatlikta</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowTutorial(false)}>Supratau</Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InventoryCycles;
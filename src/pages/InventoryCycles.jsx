import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useComponents } from '@/context/ComponentsContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Package,
  FileSpreadsheet,
  User,
  Settings,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryCycles = () => {
  const { componentsInventory, updateComponent } = useComponents();
  const { toast } = useToast();
  
  // State
  const [settings, setSettings] = useState({
    defaultCycleMonths: 3,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showWeekDialog, setShowWeekDialog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inspector, setInspector] = useState('');
  const [notes, setNotes] = useState('');

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);

  // Generate weeks for current year
  const weeks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const weeks = [];
    const currentWeek = getCurrentWeek();
    
    for (let week = 1; week <= 52; week++) {
      const weekStr = `W${week.toString().padStart(2, '0')}`;
      const isCompleted = inventoryRecords.some(record => record.week_number === weekStr);
      const isOverdue = week < currentWeek && !isCompleted;
      
      weeks.push({
        week: weekStr,
        weekNumber: week,
        isCompleted,
        isOverdue,
        year: currentYear
      });
    }
    
    return weeks;
  }, [inventoryRecords, getCurrentWeek]);

  const handleWeekClick = (week) => {
    setSelectedWeek(week);
    setShowWeekDialog(true);
    setUploadedFile(null);
    setInspector('');
    setNotes('');

  const downloadExcelTemplate = () => {
    if (!selectedWeek) return;

    // Sukurti Excel failą su komponentų sąrašu
    const worksheetData = [
      ['Komponentas', 'Dabartinis Likutis', 'Faktinis Likutis (užpildyti tik neatitikimus)', 'Pastabos'],
      ...componentsInventory.map(comp => [
        comp.name,
        comp.stock || 0,
        '', // Tuščias laukas faktiniam likučiui
        '' // Tuščias laukas pastaboms
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Nustatyti stulpelių plotį
    worksheet['!cols'] = [
      { width: 30 }, // Komponentas
      { width: 15 }, // Dabartinis likutis
      { width: 25 }, // Faktinis likutis
      { width: 30 }  // Pastabos
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventorizacija');

    // Atsisiųsti failą
    XLSX.writeFile(workbook, `Inventorizacija_${selectedWeek.week}_${new Date().getFullYear()}.xlsx`);
    
    toast({
      title: "Excel failas atsisiųstas!",
      description: `Inventorizacijos šablonas ${selectedWeek.week} savaitei paruoštas.`
    });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Praleisti antraštės eilutę ir apdoroti duomenis
        const processedData = jsonData.slice(1)
          .filter(row => row[2] !== undefined && row[2] !== '') // Tik su užpildytu faktiniu likučiu
          .map(row => ({
            componentName: row[0],
            expectedStock: parseInt(row[1]) || 0,
            actualStock: parseInt(row[2]) || 0,
            notes: row[3] || ''
          }))
          .filter(item => item.componentName);

        setUploadedFile(processedData);
        
        toast({
          title: "Failas įkeltas!",
          description: `Rasta ${processedData.length} komponentų su neatitikimais.`
        });
      } catch (error) {
        toast({
          title: "Klaida",
          description: "Nepavyko nuskaityti Excel failo.",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);

  const completeInventory = async () => {
    if (!uploadedFile || !inspector.trim()) {
      toast({
        title: "Klaida",
        description: "Įkelkite failą ir įveskite inspektorių.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Sukurti inventorizacijos įrašus
      const newRecords = uploadedFile.map(item => ({
        id: `record-${Date.now()}-${Math.random()}`,
        component_name: item.componentName,
        expected_stock: item.expectedStock,
        actual_stock: item.actualStock,
        difference: item.actualStock - item.expectedStock,
        notes: item.notes,
        inspector: inspector.trim(),
        check_date: new Date().toISOString().split('T')[0],
        week_number: selectedWeek.week,
        created_at: new Date().toISOString()
      }));

      // Atnaujinti komponentų likučius sistemoje
      uploadedFile.forEach(item => {
        const component = componentsInventory.find(c => c.name === item.componentName);
        if (component) {
          updateComponent(component.id, { stock: item.actualStock });
        }
      });

      // Pridėti įrašus į istoriją
      setInventoryRecords(prev => [...prev, ...newRecords]);

      toast({
        title: "Inventorizacija užbaigta!",
        description: `${selectedWeek.week} savaitės inventorizacija sėkmingai užregistruota.`
      });

      setShowWeekDialog(false);
      setSelectedWeek(null);
      setUploadedFile(null);
      setInspector('');
      setNotes('');
    } catch (error) {
      toast({
        title: "Klaida",
        description: "Nepavyko užbaigti inventorizacijos.",
        variant: "destructive"
      });
    }

  const stats = useMemo(() => {
    const completedWeeks = weeks.filter(w => w.isCompleted).length;
    const overdueWeeks = weeks.filter(w => w.isOverdue).length;
    const totalDiscrepancies = inventoryRecords.reduce((sum, record) => sum + Math.abs(record.difference), 0);
    const componentsWithIssues = new Set(inventoryRecords.filter(r => r.difference !== 0).map(r => r.component_name)).size;

    return {
      completedWeeks,
      overdueWeeks,
      totalDiscrepancies,
      componentsWithIssues,
      totalComponents: componentsInventory.length
    };
  }, [weeks, inventoryRecords, componentsInventory]);

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
              onClick={() => setShowTutorial(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Pagalba
            </Button>
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Nustatymai
            </Button>
          </div>
        </div>

        {/* Stats */}
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
                Spauskite ant savaitės, kad pradėtumėte inventorizaciją. Žalia - užbaigta, raudona - vėluoja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-13 gap-3">
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

        {/* Recent Records */}
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
                  inventoryRecords.slice(0, 10).map(record => (
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

        {/* Week Dialog */}
        <Dialog open={showWeekDialog} onOpenChange={setShowWeekDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Inventorizacija - {selectedWeek?.week} savaitė
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Step 1: Download Template */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Atsisiųskite Excel šabloną
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Šablone bus visi komponentai su dabartiniais likučiais.
                </p>
                <div className="ml-8">
                  <Button onClick={downloadExcelTemplate} className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Atsisiųsti Excel Šabloną
                  </Button>
                </div>
              </div>

              {/* Step 2: Fill and Upload */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Užpildykite ir įkelkite failą
                </h3>
                <div className="ml-8 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Svarbu:</strong> Užpildykite tik tuos komponentus, kuriuose radote neatitikimus. 
                      Neužpildyti komponentai bus laikomi teisingais.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="file-upload">Įkelti užpildytą Excel failą</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>

                  {uploadedFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        Rasta {uploadedFile.length} komponentų su neatitikimais:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {uploadedFile.map((item, index) => (
                          <div key={index} className="text-xs text-blue-700 flex justify-between">
                            <span>{item.componentName}</span>
                            <span>{item.expectedStock} → {item.actualStock} ({item.actualStock - item.expectedStock > 0 ? '+' : ''}{item.actualStock - item.expectedStock})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Complete */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Užbaikite inventorizaciją
                </h3>
                <div className="ml-8 space-y-3">
                  <div>
                    <Label htmlFor="inspector">Kas atliko inventorizaciją *</Label>
                    <Input
                      id="inspector"
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                      placeholder="Vardas Pavardė"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Bendros pastabos</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Papildomos pastabos apie inventorizaciją..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWeekDialog(false)}>
                Atšaukti
              </Button>
              <Button 
                onClick={completeInventory}
                disabled={!uploadedFile || !inspector.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Užbaigti Inventorizaciją
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    <li>Spauskite ant savaitės (pvz. W01)</li>
                    <li>Atsisiųskite Excel šabloną su komponentų sąrašu</li>
                    <li>Fiziškai suskaičiuokite komponentus sandėlyje</li>
                    <li>Excel faile užpildykite TIK tuos komponentus, kur radote neatitikimus</li>
                    <li>Įkelkite failą atgal į sistemą</li>
                    <li>Įveskite, kas atliko inventorizaciją</li>
                    <li>Spauskite "Užbaigti Inventorizaciją"</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Svarbūs Principai:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Užpildykite tik komponentus su neatitikimais</li>
                    <li>Neužpildyti komponentai = teisingi likučiai</li>
                    <li>Sistema automatiškai atnaujins likučius</li>
                    <li>Visa istorija bus išsaugota</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600">Spalvų Reikšmės:</h4>
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
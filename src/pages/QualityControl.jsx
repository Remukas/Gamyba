import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera,
  FileText,
  TrendingUp,
  Award,
  HelpCircle,
  Plus
} from 'lucide-react';

const QualityControl = () => {
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);
  const [qualityChecks, setQualityChecks] = useState([
    {
      id: 1,
      productName: 'Cart SA-10000170',
      inspector: 'Jonas Petraitis',
      date: '2024-01-15',
      status: 'passed',
      score: 95,
      defects: [],
      notes: 'Visos specifikacijos atitinka reikalavimus'
    },
    {
      id: 2,
      productName: 'Control unit SA-10000111',
      inspector: 'Marija Kazlauskienė',
      date: '2024-01-14',
      status: 'failed',
      score: 72,
      defects: ['Paviršiaus defektai', 'Matmenų neatitikimas'],
      notes: 'Reikalingas pakartotinas apdorojimas'
    }
  ]);

  const [newCheck, setNewCheck] = useState({
    productName: '',
    inspector: '',
    status: 'pending',
    score: 100,
    defects: '',
    notes: ''
  });

  const qualityStats = useMemo(() => {
    const total = qualityChecks.length;
    const passed = qualityChecks.filter(c => c.status === 'passed').length;
    const failed = qualityChecks.filter(c => c.status === 'failed').length;
    const pending = qualityChecks.filter(c => c.status === 'pending').length;
    const avgScore = total > 0 ? Math.round(qualityChecks.reduce((sum, c) => sum + c.score, 0) / total) : 0;
    
    return { total, passed, failed, pending, avgScore, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
  }, [qualityChecks]);

  const handleAddCheck = () => {
    if (!newCheck.productName || !newCheck.inspector) {
      toast({
        title: "Klaida",
        description: "Užpildykite visus privalomas laukus.",
        variant: "destructive"
      });
      return;
    }

    const check = {
      id: Date.now(),
      ...newCheck,
      date: new Date().toISOString().split('T')[0],
      defects: newCheck.defects ? newCheck.defects.split(',').map(d => d.trim()) : []
    };

    setQualityChecks(prev => [check, ...prev]);
    setNewCheck({
      productName: '',
      inspector: '',
      status: 'pending',
      score: 100,
      defects: '',
      notes: ''
    });

    toast({
      title: "Kokybės patikrinimas pridėtas!",
      description: `Patikrinimas produktui "${check.productName}" sėkmingai užregistruotas.`
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
              🛡️ Kokybės Kontrolė
            </h1>
            <p className="text-gray-600 text-lg">Produktų kokybės valdymas ir defektų sekimas</p>
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

        {/* Quality Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Viso Patikrinimų</p>
                    <p className="text-3xl font-bold">{qualityStats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Praėjo</p>
                    <p className="text-3xl font-bold">{qualityStats.passed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Nepraėjo</p>
                    <p className="text-3xl font-bold">{qualityStats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Išlaikymo %</p>
                    <p className="text-3xl font-bold">{qualityStats.passRate}%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Vidutinis Balas</p>
                    <p className="text-3xl font-bold">{qualityStats.avgScore}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Quality Check */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Naujas Patikrinimas
                </CardTitle>
                <CardDescription>Registruokite kokybės patikrinimą</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productName">Produkto pavadinimas *</Label>
                  <Input
                    id="productName"
                    value={newCheck.productName}
                    onChange={(e) => setNewCheck({...newCheck, productName: e.target.value})}
                    placeholder="pvz. Cart SA-10000170"
                  />
                </div>

                <div>
                  <Label htmlFor="inspector">Inspektorius *</Label>
                  <Input
                    id="inspector"
                    value={newCheck.inspector}
                    onChange={(e) => setNewCheck({...newCheck, inspector: e.target.value})}
                    placeholder="Vardas Pavardė"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statusas</Label>
                  <Select value={newCheck.status} onValueChange={(value) => setNewCheck({...newCheck, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Laukiama</SelectItem>
                      <SelectItem value="passed">Praėjo</SelectItem>
                      <SelectItem value="failed">Nepraėjo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="score">Balas (0-100)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={newCheck.score}
                    onChange={(e) => setNewCheck({...newCheck, score: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label htmlFor="defects">Defektai (atskirti kableliais)</Label>
                  <Input
                    id="defects"
                    value={newCheck.defects}
                    onChange={(e) => setNewCheck({...newCheck, defects: e.target.value})}
                    placeholder="pvz. Paviršiaus defektai, Matmenų neatitikimas"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Pastabos</Label>
                  <Textarea
                    id="notes"
                    value={newCheck.notes}
                    onChange={(e) => setNewCheck({...newCheck, notes: e.target.value})}
                    placeholder="Papildomi komentarai..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddCheck} className="w-full bg-gradient-to-r from-green-600 to-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Pridėti Patikrinimą
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quality Checks List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Kokybės Patikrinimai
                </CardTitle>
                <CardDescription>Visi registruoti kokybės patikrinimai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {qualityChecks.map(check => (
                    <motion.div
                      key={check.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{check.productName}</h3>
                          <p className="text-sm text-gray-600">Inspektorius: {check.inspector}</p>
                          <p className="text-sm text-gray-600">Data: {check.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(check.status)}>
                            {getStatusIcon(check.status)}
                            <span className="ml-1 capitalize">{check.status}</span>
                          </Badge>
                          <p className="text-lg font-bold mt-1">Balas: {check.score}/100</p>
                        </div>
                      </div>

                      {check.defects.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-700 mb-1">Defektai:</p>
                          <div className="flex flex-wrap gap-1">
                            {check.defects.map((defect, index) => (
                              <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                                {defect}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {check.notes && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-800">{check.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-1" />
                          Nuotraukos
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Ataskaita
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default QualityControl;
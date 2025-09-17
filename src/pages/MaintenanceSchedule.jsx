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
  Settings, 
  Wrench, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  User,
  Plus,
  HelpCircle,
  Zap,
  Activity
} from 'lucide-react';

const MaintenanceSchedule = () => {
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState([
    {
      id: 1,
      equipmentName: 'CNC Staklės #1',
      taskType: 'Prevencinė priežiūra',
      priority: 'high',
      status: 'scheduled',
      assignedTo: 'Petras Jonaitis',
      scheduledDate: '2024-01-20',
      estimatedHours: 4,
      description: 'Mėnesinis techninės priežiūros patikrinimas',
      lastMaintenance: '2023-12-20'
    },
    {
      id: 2,
      equipmentName: 'Konvejeris A',
      taskType: 'Gedimo šalinimas',
      priority: 'critical',
      status: 'in_progress',
      assignedTo: 'Marija Kazlauskienė',
      scheduledDate: '2024-01-16',
      estimatedHours: 2,
      description: 'Variklio keitimas',
      lastMaintenance: '2024-01-10'
    },
    {
      id: 3,
      equipmentName: 'Robotas R-100',
      taskType: 'Kalibravimas',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'Jonas Petraitis',
      scheduledDate: '2024-01-15',
      estimatedHours: 3,
      description: 'Pozicionavimo tikslumo kalibravimas',
      lastMaintenance: '2024-01-15'
    }
  ]);

  const [newTask, setNewTask] = useState({
    equipmentName: '',
    taskType: 'Prevencinė priežiūra',
    priority: 'medium',
    assignedTo: '',
    scheduledDate: '',
    estimatedHours: 1,
    description: ''
  });

  const maintenanceStats = useMemo(() => {
    const total = maintenanceTasks.length;
    const scheduled = maintenanceTasks.filter(t => t.status === 'scheduled').length;
    const inProgress = maintenanceTasks.filter(t => t.status === 'in_progress').length;
    const completed = maintenanceTasks.filter(t => t.status === 'completed').length;
    const critical = maintenanceTasks.filter(t => t.priority === 'critical').length;
    const totalHours = maintenanceTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    
    return { total, scheduled, inProgress, completed, critical, totalHours };
  }, [maintenanceTasks]);

  const handleAddTask = () => {
    if (!newTask.equipmentName || !newTask.assignedTo || !newTask.scheduledDate) {
      toast({
        title: "Klaida",
        description: "Užpildykite visus privalomas laukus.",
        variant: "destructive"
      });
      return;
    }

    const task = {
      id: Date.now(),
      ...newTask,
      status: 'scheduled',
      lastMaintenance: null
    };

    setMaintenanceTasks(prev => [task, ...prev]);
    setNewTask({
      equipmentName: '',
      taskType: 'Prevencinė priežiūra',
      priority: 'medium',
      assignedTo: '',
      scheduledDate: '',
      estimatedHours: 1,
      description: ''
    });

    toast({
      title: "Priežiūros užduotis pridėta!",
      description: `Užduotis "${task.equipmentName}" sėkmingai suplanuota.`
    });
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setMaintenanceTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            lastMaintenance: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : task.lastMaintenance
          }
        : task
    ));

    const task = maintenanceTasks.find(t => t.id === taskId);
    toast({
      title: "Statusas atnaujintas!",
      description: `"${task.equipmentName}" statusas pakeistas į ${newStatus}.`
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'in_progress': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              🔧 Priežiūros Grafikas
            </h1>
            <p className="text-gray-600 text-lg">Įrangos priežiūros planavimas ir valdymas</p>
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

        {/* Maintenance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Viso Užduočių</p>
                    <p className="text-3xl font-bold">{maintenanceStats.total}</p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Suplanuota</p>
                    <p className="text-3xl font-bold">{maintenanceStats.scheduled}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Vykdoma</p>
                    <p className="text-3xl font-bold">{maintenanceStats.inProgress}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Užbaigta</p>
                    <p className="text-3xl font-bold">{maintenanceStats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Kritinės</p>
                    <p className="text-3xl font-bold">{maintenanceStats.critical}</p>
                  </div>
                  <Zap className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Viso Valandų</p>
                    <p className="text-3xl font-bold">{maintenanceStats.totalHours}</p>
                  </div>
                  <Clock className="h-8 w-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Maintenance Task */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-orange-600" />
                  Nauja Priežiūros Užduotis
                </CardTitle>
                <CardDescription>Suplanuokite įrangos priežiūrą</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="equipmentName">Įrangos pavadinimas *</Label>
                  <Input
                    id="equipmentName"
                    value={newTask.equipmentName}
                    onChange={(e) => setNewTask({...newTask, equipmentName: e.target.value})}
                    placeholder="pvz. CNC Staklės #1"
                  />
                </div>

                <div>
                  <Label htmlFor="taskType">Užduoties tipas</Label>
                  <Select value={newTask.taskType} onValueChange={(value) => setNewTask({...newTask, taskType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prevencinė priežiūra">Prevencinė priežiūra</SelectItem>
                      <SelectItem value="Gedimo šalinimas">Gedimo šalinimas</SelectItem>
                      <SelectItem value="Kalibravimas">Kalibravimas</SelectItem>
                      <SelectItem value="Valymas">Valymas</SelectItem>
                      <SelectItem value="Patikrinimas">Patikrinimas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioritetas</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Žemas</SelectItem>
                      <SelectItem value="medium">Vidutinis</SelectItem>
                      <SelectItem value="high">Aukštas</SelectItem>
                      <SelectItem value="critical">Kritinis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedTo">Atsakingas technikas *</Label>
                  <Input
                    id="assignedTo"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    placeholder="Vardas Pavardė"
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledDate">Suplanuota data *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={newTask.scheduledDate}
                    onChange={(e) => setNewTask({...newTask, scheduledDate: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedHours">Numatomas laikas (val.)</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value) || 1})}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Aprašymas</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Detalus užduoties aprašymas..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddTask} className="w-full bg-gradient-to-r from-orange-600 to-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Pridėti Užduotį
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maintenance Tasks List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Priežiūros Užduotys
                </CardTitle>
                <CardDescription>Visos suplanuotos ir vykdomos priežiūros užduotys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {maintenanceTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{task.equipmentName}</h3>
                          <p className="text-sm text-gray-600">{task.taskType}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{task.assignedTo}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {task.scheduledDate} ({task.estimatedHours}h)
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                        </Badge>
                        {task.lastMaintenance && (
                          <p className="text-xs text-gray-500">
                            Paskutinė priežiūra: {task.lastMaintenance}
                          </p>
                        )}
                      </div>

                      {task.description && (
                        <div className="bg-blue-50 p-3 rounded-md mb-3">
                          <p className="text-sm text-blue-800">{task.description}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        {task.status === 'scheduled' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          >
                            Pradėti
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                          >
                            Užbaigti
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Redaguoti
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

export default MaintenanceSchedule;
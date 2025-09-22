import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Shield, 
  Settings, 
  Activity, 
  Database, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Crown,
  Briefcase,
  Clock,
  BarChart3,
  Server,
  Download
} from 'lucide-react';

const AdminPanel = () => {
  const { currentUser, users, addUser, updateUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'operator',
    department: '',
    permissions: []
  });

  const rolePermissions = {
    admin: ['all'],
    manager: ['view_analytics', 'manage_production', 'view_quality', 'manage_components', 'view_users'],
    operator: ['view_production', 'update_components', 'view_tracking'],
    quality: ['view_quality', 'manage_quality', 'view_analytics']
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    operator: 'bg-green-100 text-green-800',
    quality: 'bg-purple-100 text-purple-800'
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.email || !newUser.name) {
      toast({
        title: "Klaida",
        description: "Visi privalomi laukai turi būti užpildyti.",
        variant: "destructive"
      });
      return;
    }

    if (users.some(u => u.username === newUser.username)) {
      toast({
        title: "Klaida",
        description: "Vartotojas tokiu vardu jau egzistuoja.",
        variant: "destructive"
      });
      return;
    }

    const userData = {
      ...newUser,
      permissions: rolePermissions[newUser.role] || []
    };

    addUser(userData);
    setNewUser({
      username: '',
      password: '',
      email: '',
      name: '',
      role: 'operator',
      department: '',
      permissions: []
    });
    setShowAddUser(false);
    
    toast({
      title: "Vartotojas pridėtas!",
      description: `Vartotojas ${userData.name} sėkmingai pridėtas į sistemą.`
    });
  };

  const handleToggleUserStatus = (userId) => {
    const user = users.find(u => u.id === userId);
    updateUser(userId, { isActive: !user.isActive });
    
    toast({
      title: user.isActive ? "Vartotojas išjungtas" : "Vartotojas įjungtas",
      description: `Vartotojo ${user.name} būsena pakeista.`
    });
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u.id === userId);
    deleteUser(userId);
    
    toast({
      title: "Vartotojas pašalintas",
      description: `Vartotojas ${user.name} pašalintas iš sistemos.`
    });
  };

  const systemStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    recentLogins: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
  };

  const exportSystemData = () => {
    const data = {
      users: users.map(u => ({ ...u, password: '[HIDDEN]' })),
      exportDate: new Date().toISOString(),
      exportedBy: currentUser.name
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: "Duomenys eksportuoti",
      description: "Sistemos duomenys sėkmingai eksportuoti."
    });
  };

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
            Administravimo Panelė
          </h1>
          <p className="text-gray-600 mt-2">Sistemos valdymas ir vartotojų administravimas</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Crown className="h-3 w-3 mr-1" />
            Administratorius
          </Badge>
        </div>
      </motion.div>

      {/* Sistemos statistika */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Viso Vartotojų</p>
                  <p className="text-3xl font-bold">{systemStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Aktyvūs</p>
                  <p className="text-3xl font-bold">{systemStats.activeUsers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Administratoriai</p>
                  <p className="text-3xl font-bold">{systemStats.adminUsers}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Šiandien Prisijungė</p>
                  <p className="text-3xl font-bold">{systemStats.recentLogins}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vartotojai
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Leidimai
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Žurnalai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Vartotojų Valdymas
                  </CardTitle>
                  <CardDescription>Valdykite sistemos vartotojus ir jų teises</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddUser(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pridėti Vartotoją
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vartotojas</TableHead>
                      <TableHead>Rolė</TableHead>
                      <TableHead>Padalinys</TableHead>
                      <TableHead>Paskutinis prisijungimas</TableHead>
                      <TableHead>Būsena</TableHead>
                      <TableHead className="text-right">Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role]}>
                            {user.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                            {user.role === 'manager' && <Briefcase className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          {user.lastLogin ? (
                            <div className="flex items-center text-sm">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              {new Date(user.lastLogin).toLocaleDateString('lt-LT')}
                            </div>
                          ) : (
                            <span className="text-gray-400">Niekada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Aktyvus</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Neaktyvus</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            {user.id !== currentUser.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ar tikrai norite ištrinti vartotoją?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Šis veiksmas negrįžtamas. Vartotojas "{user.name}" bus visam laikui pašalintas iš sistemos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                      Ištrinti
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Leidimų Sistema
              </CardTitle>
              <CardDescription>Valdykite vartotojų teises ir prieigos lygius</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-2 capitalize">{role}</h3>
                    <div className="space-y-1">
                      {permissions.map(permission => (
                        <Badge key={permission} variant="outline" className="mr-1 mb-1">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Sistemos Nustatymai
              </CardTitle>
              <CardDescription>Bendri sistemos parametrai ir konfigūracija</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Duomenų Valdymas</h3>
                  <Button 
                    onClick={exportSystemData}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Eksportuoti Sistemos Duomenis
                  </Button>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Sistemos Informacija</h3>
                  <div className="text-sm space-y-2">
                    <div>Versija: 1.0.0</div>
                    <div>Paskutinis atnaujinimas: {new Date().toLocaleDateString('lt-LT')}</div>
                    <div>Duomenų bazė: LocalStorage</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Sistemos Žurnalai
              </CardTitle>
              <CardDescription>Sistemos veiklos ir vartotojų prisijungimų žurnalai</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.filter(u => u.lastLogin).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">Prisijungė kaip {user.role}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(user.lastLogin).toLocaleString('lt-LT')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pridėti vartotoją modalas */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Pridėti Naują Vartotoją</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Vartotojo vardas *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="pvz. jonas.petraitis"
                />
              </div>
              <div>
                <Label htmlFor="password">Slaptažodis *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Saugus slaptažodis"
                />
              </div>
              <div>
                <Label htmlFor="name">Pilnas vardas *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Jonas Petraitis"
                />
              </div>
              <div>
                <Label htmlFor="email">El. paštas *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="jonas@gamyba.lt"
                />
              </div>
              <div>
                <Label htmlFor="department">Padalinys</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  placeholder="Gamyba"
                />
              </div>
              <div>
                <Label htmlFor="role">Rolė</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operatorius</SelectItem>
                    <SelectItem value="quality">Kokybės kontrolierius</SelectItem>
                    <SelectItem value="manager">Vadovas</SelectItem>
                    <SelectItem value="admin">Administratorius</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowAddUser(false)} variant="outline" className="flex-1">
                Atšaukti
              </Button>
              <Button onClick={handleAddUser} className="flex-1">
                Pridėti
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
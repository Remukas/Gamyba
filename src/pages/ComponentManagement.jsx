import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Package, Save, Search, Warehouse, X } from 'lucide-react';
import { useComponents } from '@/context/ComponentsContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const ComponentManagement = () => {
  const {
    componentsInventory,
    addComponent,
    updateComponent,
    deleteComponent,
    subassemblies,
    setSubassemblies,
    categories
  } = useComponents();
  const {
    toast
  } = useToast();
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentStock, setNewComponentStock] = useState('');
  const [newComponentLeadTime, setNewComponentLeadTime] = useState('');
  const [newSubassemblyName, setNewSubassemblyName] = useState('');
  const [newSubassemblyQuantity, setNewSubassemblyQuantity] = useState('');
  const [newSubassemblyCategory, setNewSubassemblyCategory] = useState('');
  const [editingComponentId, setEditingComponentId] = useState(null);
  const [editingComponentValues, setEditingComponentValues] = useState({
    name: '',
    stock: '',
    leadTimeDays: ''
  });
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [editingSubassemblyId, setEditingSubassemblyId] = useState(null);
  const [editingSubassemblyValues, setEditingSubassemblyValues] = useState({
    name: '',
    quantity: ''
  });
  const [subassemblySearchTerm, setSubassemblySearchTerm] = useState('');
  const allSubassembliesList = useMemo(() => {
    return Object.values(subassemblies).flat();
  }, [subassemblies]);
  const handleAddComponent = () => {
    if (!newComponentName || newComponentStock === '' || newComponentLeadTime === '') {
      toast({
        title: 'Klaida',
        description: 'Visi laukai turi būti užpildyti.',
        variant: 'destructive'
      });
      return;
    }
    addComponent({
      name: newComponentName,
      stock: parseInt(newComponentStock, 10),
      leadTimeDays: parseInt(newComponentLeadTime, 10)
    });
    toast({
      title: 'Pavyko!',
      description: `Komponentas "${newComponentName}" sėkmingai pridėtas.`
    });
    setNewComponentName('');
    setNewComponentStock('');
    setNewComponentLeadTime('');
  };
  const handleEditComponentClick = component => {
    setEditingComponentId(component.id);
    setEditingComponentValues({
      name: component.name,
      stock: component.stock,
      leadTimeDays: component.leadTimeDays
    });
  };
  const handleSaveComponentClick = id => {
    if (!editingComponentValues.name || editingComponentValues.stock === '' || editingComponentValues.leadTimeDays === '') {
      toast({
        title: 'Klaida',
        description: 'Visi laukai turi būti užpildyti.',
        variant: 'destructive'
      });
      return;
    }
    updateComponent(id, {
      name: editingComponentValues.name,
      stock: parseInt(editingComponentValues.stock, 10),
      leadTimeDays: parseInt(editingComponentValues.leadTimeDays, 10)
    });
    toast({
      title: 'Pavyko!',
      description: 'Komponentas atnaujintas.'
    });
    setEditingComponentId(null);
  };
  const handleCancelEditComponent = () => {
    setEditingComponentId(null);
  };
  const handleDeleteComponent = (id, name) => {
    deleteComponent(id);
    toast({
      title: 'Pavyko!',
      description: `Komponentas "${name}" ištrintas.`
    });
  };
  const handleComponentInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setEditingComponentValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const filteredComponents = componentsInventory.filter(component => component.name.toLowerCase().includes(componentSearchTerm.toLowerCase()));
  
  const handleAddSubassembly = () => {
    if (!newSubassemblyName || newSubassemblyQuantity === '' || !newSubassemblyCategory) {
      toast({
        title: 'Klaida',
        description: 'Visi laukai turi būti užpildyti.',
        variant: 'destructive'
      });
      return;
    }
    
    const newSubassembly = {
      id: `${newSubassemblyCategory}-${Date.now()}`,
      name: newSubassemblyName,
      quantity: parseInt(newSubassemblyQuantity, 10),
      status: 'pending',
      position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      children: [],
      components: [],
      category: newSubassemblyCategory,
      comments: []
    };
    
    setSubassemblies(prev => ({
      ...prev,
      [newSubassemblyCategory]: [...(prev[newSubassemblyCategory] || []), newSubassembly]
    }));
    
    toast({
      title: 'Pavyko!',
      description: `Subasemblis "${newSubassemblyName}" sėkmingai pridėtas.`
    });
    
    setNewSubassemblyName('');
    setNewSubassemblyQuantity('');
    setNewSubassemblyCategory('');
  };
  
  const handleEditSubassemblyClick = subassembly => {
    setEditingSubassemblyId(subassembly.id);
    setEditingSubassemblyValues({
      name: subassembly.name,
      quantity: subassembly.quantity
    });
  };
  const handleSaveSubassemblyClick = id => {
    if (!editingSubassemblyValues.name || editingSubassemblyValues.quantity === '') {
      toast({
        title: 'Klaida',
        description: 'Pavadinimas ir kiekis turi būti užpildyti.',
        variant: 'destructive'
      });
      return;
    }
    const updatedSubassemblies = {
      ...subassemblies
    };
    let found = false;
    for (const category in updatedSubassemblies) {
      const index = updatedSubassemblies[category].findIndex(sa => sa.id === id);
      if (index !== -1) {
        updatedSubassemblies[category][index] = {
          ...updatedSubassemblies[category][index],
          name: editingSubassemblyValues.name,
          quantity: parseInt(editingSubassemblyValues.quantity, 10)
        };
        found = true;
        break;
      }
    }
    if (found) {
      setSubassemblies(updatedSubassemblies);
      toast({
        title: 'Pavyko!',
        description: 'Subasemblis atnaujintas.'
      });
      setEditingSubassemblyId(null);
    }
  };
  const handleCancelEditSubassembly = () => {
    setEditingSubassemblyId(null);
  };
  const handleDeleteSubassembly = (id, name) => {
    const updatedSubassemblies = {
      ...subassemblies
    };
    let found = false;
    for (const category in updatedSubassemblies) {
      const initialLength = updatedSubassemblies[category].length;
      updatedSubassemblies[category] = updatedSubassemblies[category].filter(sa => sa.id !== id);
      if (updatedSubassemblies[category].length < initialLength) {
        found = true;
        // Nenaikiname tuščios kategorijos, kad vartotojas galėtų pridėti naujų SA į ją vėliau.
        break;
      }
    }
    if (found) {
      setSubassemblies(updatedSubassemblies);
      toast({
        title: 'Pavyko!',
        description: `Subasemblis "${name}" ištrintas.`
      });
    } else {
      toast({
        title: 'Klaida',
        description: `Nepavyko rasti subasemblio "${name}".`,
        variant: "destructive"
      });
    }
  };
  const handleSubassemblyInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setEditingSubassemblyValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const filteredSubassemblies = allSubassembliesList.filter(sa => sa.name.toLowerCase().includes(subassemblySearchTerm.toLowerCase()));
  return <>
                <Helmet>
                    <title>Atsargų Valdymas | Gamybos Valdymas</title>
                    <meta name="description" content="Valdykite, pridėkite ir šalinkite gamybos komponentus ir subasemblius." />
                </Helmet>
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }}>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-2">Komponentu ir Subasemblių Valdymas</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Čia galite peržiūrėti, pridėti, redaguoti ir šalinti visus sistemoje esančius komponentus ir subasemblius.
                        </p>
                    </motion.div>

                    <Tabs defaultValue="components">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="components"><Package className="mr-2 h-4 w-4" /> Komponentai</TabsTrigger>
                            <TabsTrigger value="subassemblies"><Warehouse className="mr-2 h-4 w-4" /> Subasembliai</TabsTrigger>
                        </TabsList>
                        <TabsContent value="components">
                            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }}>
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Plus className="h-6 w-6 text-blue-500" />
                                            Pridėti Naują Komponentą
                                        </CardTitle>
                                        <CardDescription>Įveskite naujo komponento duomenis.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                            <Input placeholder="Komponento pavadinimas" value={newComponentName} onChange={e => setNewComponentName(e.target.value)} />
                                            <Input type="number" min="0" placeholder="Likutis (vnt.)" value={newComponentStock} onChange={e => setNewComponentStock(e.target.value)} />
                                            <Input type="number" min="0" placeholder="Gavimo laikas (d.)" value={newComponentLeadTime} onChange={e => setNewComponentLeadTime(e.target.value)} />
                                            <Button onClick={handleAddComponent} className="w-full">
                                                <Plus className="mr-2 h-4 w-4" /> Pridėti
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.2
          }}>
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mt-8">
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Package className="h-6 w-6 text-purple-500" />
                                                Komponentų Sąrašas
                                            </CardTitle>
                                            <div className="relative w-full sm:w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input placeholder="Ieškoti komponento..." value={componentSearchTerm} onChange={e => setComponentSearchTerm(e.target.value)} className="pl-10" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Pavadinimas</TableHead>
                                                        <TableHead>Likutis</TableHead>
                                                        <TableHead>Gavimo laikas (d.)</TableHead>
                                                        <TableHead className="text-right">Veiksmai</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredComponents.length > 0 ? filteredComponents.map(component => <TableRow key={component.id}>
                                                            {editingComponentId === component.id ? <>
                                                                    <TableCell>
                                                                        <Input name="name" value={editingComponentValues.name} onChange={handleComponentInputChange} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input name="stock" type="number" min="0" value={editingComponentValues.stock} onChange={handleComponentInputChange} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input name="leadTimeDays" type="number" min="0" value={editingComponentValues.leadTimeDays} onChange={handleComponentInputChange} />
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button size="icon" onClick={() => handleSaveComponentClick(component.id)}><Save className="h-4 w-4" /></Button>
                                                                            <Button size="icon" variant="outline" onClick={handleCancelEditComponent}><X className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </> : <>
                                                                    <TableCell className="font-medium">{component.name}</TableCell>
                                                                    <TableCell>{component.stock}</TableCell>
                                                                    <TableCell>{component.leadTimeDays}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button variant="ghost" size="icon" onClick={() => handleEditComponentClick(component)}><Edit className="h-4 w-4" /></Button>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Ar tikrai norite ištrinti?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            Šis veiksmas visam laikui pašalins komponentą "{component.name}". Šio veiksmo anuliuoti negalima.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDeleteComponent(component.id, component.name)}>Ištrinti</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </TableCell>
                                                                </>}
                                                        </TableRow>) : <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                                Pagal paiešką komponentų nerasta.
                                                            </TableCell>
                                                        </TableRow>}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="subassemblies">
                            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }}>
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Plus className="h-6 w-6 text-blue-500" />
                                            Pridėti Naują Subasemblį
                                        </CardTitle>
                                        <CardDescription>Įveskite naujo subasemblio duomenis.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                            <Input placeholder="Subasemblio pavadinimas" value={newSubassemblyName} onChange={e => setNewSubassemblyName(e.target.value)} />
                                            <Input type="number" min="0" placeholder="Kiekis sandėlyje" value={newSubassemblyQuantity} onChange={e => setNewSubassemblyQuantity(e.target.value)} />
                                            <Select value={newSubassemblyCategory} onValueChange={setNewSubassemblyCategory}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pasirinkite kategoriją" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAddSubassembly} className="w-full">
                                                <Plus className="mr-2 h-4 w-4" /> Pridėti
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: 0.2
          }}>
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6">
                                     <CardHeader>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <Warehouse className="h-6 w-6 text-blue-500" />
                                                Subasemblių Sąrašas
                                            </CardTitle>
                                            <div className="relative w-full sm:w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input placeholder="Ieškoti subasemblio..." value={subassemblySearchTerm} onChange={e => setSubassemblySearchTerm(e.target.value)} className="pl-10" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Pavadinimas</TableHead>
                                                        <TableHead>Kiekis sandėlyje</TableHead>
                                                        <TableHead className="text-right">Veiksmai</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredSubassemblies.length > 0 ? filteredSubassemblies.map(sa => <TableRow key={sa.id}>
                                                            {editingSubassemblyId === sa.id ? <>
                                                                    <TableCell>
                                                                        <Input name="name" value={editingSubassemblyValues.name} onChange={handleSubassemblyInputChange} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input name="quantity" type="number" min="0" value={editingSubassemblyValues.quantity} onChange={handleSubassemblyInputChange} />
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button size="icon" onClick={() => handleSaveSubassemblyClick(sa.id)}><Save className="h-4 w-4" /></Button>
                                                                            <Button size="icon" variant="outline" onClick={handleCancelEditSubassembly}><X className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </> : <>
                                                                    <TableCell className="font-medium">{sa.name}</TableCell>
                                                                    <TableCell>{sa.quantity}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button variant="ghost" size="icon" onClick={() => handleEditSubassemblyClick(sa)}><Edit className="h-4 w-4" /></Button>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Ar tikrai norite ištrinti?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            Šis veiksmas visam laikui pašalins subasemblį "{sa.name}". Jei jis naudojamas kituose subasembliuose, gali kilti problemų. Šio veiksmo anuliuoti negalima.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDeleteSubassembly(sa.id, sa.name)}>Ištrinti</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </TableCell>
                                                                </>}
                                                        </TableRow>) : <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                                Subasemblių nerasta.
                                                            </TableCell>
                                                        </TableRow>}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </div>
            </>;
};
export default ComponentManagement;
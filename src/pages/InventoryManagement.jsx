import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Plus, Trash2, PackageSearch, PackageX, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useComponents } from '@/context/ComponentsContext';
    import { useToast } from '@/components/ui/use-toast';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

    const InventoryManagement = () => {
        const { componentsInventory, subassemblies, categories, updateComponent, deleteComponent, addComponent } = useComponents();
        const { toast } = useToast();
        const [productionPlan, setProductionPlan] = useState(() => {
            const savedPlan = localStorage.getItem('productionPlan');
            return savedPlan ? JSON.parse(savedPlan) : [];
        });
        const [selectedProduct, setSelectedProduct] = useState('');
        const [newProductQuantity, setNewProductQuantity] = useState(1);
        const [showComponentManager, setShowComponentManager] = useState(false);
        const [editingComponent, setEditingComponent] = useState(null);

        const allSubassembliesFlat = useMemo(() => Object.values(subassemblies).flat(), [subassemblies]);

        useEffect(() => {
            localStorage.setItem('productionPlan', JSON.stringify(productionPlan));
        }, [productionPlan]);

        const getSubassemblyById = (id) => allSubassembliesFlat.find(sa => sa.id === id);

        const getRequiredComponentsForSubassembly = useCallback((subassemblyId, requiredQuantity, allSubassemblies) => {
          const required = new Map();
          const visited = new Set();
        
          function recurse(id, quantityMultiplier) {
            if (visited.has(id)) {
              return;
            }
            visited.add(id);
        
            const subassembly = allSubassemblies.find(sa => sa.id === id);
        
            if (!subassembly) {
              visited.delete(id);
              return;
            }
        
            if (subassembly.components) {
              subassembly.components.forEach(comp => {
                if (comp.componentId) {
                  const currentQuantity = required.get(comp.componentId) || 0;
                  required.set(comp.componentId, currentQuantity + comp.requiredQuantity * quantityMultiplier);
                }
              });
            }
        
            if (subassembly.children) {
              subassembly.children.forEach(childId => {
                 const childMultiplier = 1; 
                 recurse(childId, quantityMultiplier * childMultiplier);
              });
            }
        
            visited.delete(id);
          }
        
          recurse(subassemblyId, requiredQuantity);
          
          const result = {};
          for (const [key, value] of required.entries()) {
            result[key] = value;
          }
          return result;
        }, []);


        const totalRequiredComponents = useMemo(() => {
            const totals = {};
            const allSAs = Object.values(subassemblies).flat();
            productionPlan.forEach(item => {
                const requiredForItem = getRequiredComponentsForSubassembly(item.id, item.quantity, allSAs);
                for (const componentId in requiredForItem) {
                    totals[componentId] = (totals[componentId] || 0) + requiredForItem[componentId];
                }
            });
            return totals;
        }, [productionPlan, subassemblies, getRequiredComponentsForSubassembly]);

        const missingComponents = useMemo(() => {
            const missing = [];
            for (const componentId in totalRequiredComponents) {
                const component = componentsInventory.find(c => c.id === componentId);
                const requiredAmount = totalRequiredComponents[componentId];
                if (component) {
                    const deficit = requiredAmount - component.stock;
                    if (deficit > 0) {
                        missing.push({
                            ...component,
                            required: requiredAmount,
                            deficit: deficit,
                        });
                    }
                } else {
                    missing.push({
                        id: componentId,
                        name: `Nežinomas komponentas (ID: ${componentId.substring(0, 8)})`,
                        stock: 0,
                        required: requiredAmount,
                        deficit: requiredAmount,
                        leadTimeDays: 'N/A'
                    });
                }
            }
            return missing.sort((a, b) => b.deficit - a.deficit);
        }, [totalRequiredComponents, componentsInventory]);
        
        const availableProducts = useMemo(() => {
            const allChildIds = new Set(allSubassembliesFlat.flatMap(p => p.children || []));
            const topLevelProducts = allSubassembliesFlat.filter(p => !allChildIds.has(p.id));
            return topLevelProducts;
        }, [allSubassembliesFlat]);

        const handleAddProductToPlan = () => {
            if (!selectedProduct) {
                toast({ title: "Nepasirinktas produktas", description: "Prašome pasirinkti produktą iš sąrašo.", variant: "destructive" });
                return;
            }
            if (newProductQuantity <= 0) {
                toast({ title: "Neteisingas kiekis", description: "Kiekis turi būti didesnis už 0.", variant: "destructive" });
                return;
            }

            const product = availableProducts.find(p => p.id === selectedProduct);
            if (!product) return;
            
            const idToAdd = product.id;

            setProductionPlan(prevPlan => {
                const existingProductIndex = prevPlan.findIndex(p => p.id === idToAdd);
                if (existingProductIndex !== -1) {
                    const updatedPlan = [...prevPlan];
                    updatedPlan[existingProductIndex].quantity += newProductQuantity;
                    return updatedPlan;
                } else {
                    return [...prevPlan, { id: idToAdd, name: product.name, quantity: newProductQuantity }];
                }
            });

            toast({ title: "Produktas pridėtas", description: `"${product.name}" (${newProductQuantity} vnt.) pridėtas į gamybos planą.` });
            setSelectedProduct('');
            setNewProductQuantity(1);
        };

        const handleQuantityChange = (id, newQuantity) => {
            const quantity = parseInt(newQuantity, 10);
            
            setProductionPlan(prevPlan => 
                prevPlan.map(p => p.id === id ? { ...p, quantity: isNaN(quantity) || quantity < 0 ? 0 : quantity } : p)
            );
        };

        const handleRemoveProductFromPlan = (id) => {
            const product = productionPlan.find(p => p.id === id);
            if(product) {
                 setProductionPlan(prevPlan => prevPlan.filter(p => p.id !== id));
                toast({ title: "Produktas pašalintas", description: `"${product.name}" pašalintas iš gamybos plano.` });
            }
        };

        const handleComponentFormSubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                stock: parseInt(formData.get('stock'), 10),
                leadTimeDays: parseInt(formData.get('leadTimeDays'), 10),
            };

            if (!data.name || isNaN(data.stock) || isNaN(data.leadTimeDays)) {
                toast({ title: "Klaida", description: "Visi laukai turi būti užpildyti teisingai.", variant: "destructive" });
                return;
            }

            if (editingComponent) {
                updateComponent(editingComponent.id, data);
                toast({ title: "Komponentas atnaujintas!" });
            } else {
                addComponent(data);
                toast({ title: "Komponentas pridėtas!" });
            }
            setEditingComponent(null);
            e.target.reset();
        };

        return (
            <>
                <Helmet>
                    <title>Likučių Valdymas | Gamybos Valdymas</title>
                    <meta name="description" content="Gamybos plano sudarymas ir komponentų likučių valdymas." />
                </Helmet>
                <div className="container mx-auto p-4 md:p-8 space-y-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-2">
                            Likučių Valdymas
                        </h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Sukurkite gamybos planą, o sistema automatiškai apskaičiuos reikalingus komponentus ir parodys jų trūkumą.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <motion.div className="lg:col-span-2 space-y-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <PackageSearch className="h-6 w-6 text-blue-500" />
                                        Gamybos Planuoklis
                                    </CardTitle>
                                    <CardDescription>Pridėkite produktus, kuriuos norite pagaminti.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Pasirinkite produktą..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableProducts.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            value={newProductQuantity}
                                            onChange={(e) => setNewProductQuantity(parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                            className="w-full sm:w-32"
                                            placeholder="Kiekis"
                                        />
                                        <Button onClick={handleAddProductToPlan} className="w-full sm:w-auto">
                                            <Plus className="mr-2 h-4 w-4" /> Pridėti
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {productionPlan.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                                                >
                                                    <span className="flex-1 font-medium text-ellipsis overflow-hidden whitespace-nowrap">{item.name}</span>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                        min="0"
                                                        className="w-24"
                                                    />
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Ar tikrai norite pašalinti produktą?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Šis veiksmas pašalins "{item.name}" iš gamybos plano.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRemoveProductFromPlan(item.id)}>Pašalinti</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {productionPlan.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Gamybos planas tuščias. Pridėkite produktų, kad pradėtumėte.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <PackageX className="h-6 w-6 text-red-500" />
                                        Trūkstami Komponentai
                                    </CardTitle>
                                     <CardDescription>
                                        Štai komponentai, kurių trūksta norint įvykdyti gamybos planą.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Komponentas</TableHead>
                                                <TableHead className="text-right">Reikia</TableHead>
                                                <TableHead className="text-right">Likutis</TableHead>
                                                <TableHead className="text-right text-red-500">Trūksta</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {missingComponents.length > 0 ? (
                                                    missingComponents.map(comp => (
                                                        <motion.tr 
                                                            key={comp.id}
                                                            layout
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="hover:bg-muted/50"
                                                        >
                                                            <TableCell className="font-medium">{comp.name}</TableCell>
                                                            <TableCell className="text-right">{comp.required}</TableCell>
                                                            <TableCell className="text-right">{comp.stock}</TableCell>
                                                            <TableCell className="text-right font-bold text-red-500">{comp.deficit}</TableCell>
                                                        </motion.tr>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8">
                                                            {productionPlan.length > 0 ? (
                                                                <div className="flex flex-col items-center gap-2 text-green-600">
                                                                    <CheckCircle className="h-8 w-8" />
                                                                    <span className="font-medium">Visų komponentų pakanka!</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                    <AlertTriangle className="h-8 w-8" />
                                                                    <span className="font-medium">Nėra duomenų, nes gamybos planas tuščias.</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div className="space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Clock className="h-6 w-6 text-purple-500" />
                                        Komponentų Sandėlis
                                    </CardTitle>
                                    <CardDescription>
                                        Peržiūrėkite ir valdykite komponentų likučius bei gavimo laikus.
                                    </CardDescription>
                                    <Button onClick={() => setShowComponentManager(!showComponentManager)} className="mt-4" size="sm">
                                        {showComponentManager ? 'Slėpti valdymą' : 'Pridėti/Redaguoti'}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {showComponentManager && (
                                        <form onSubmit={handleComponentFormSubmit} className="p-4 mb-6 border rounded-lg bg-muted/50 space-y-4">
                                            <h3 className="font-semibold text-lg">{editingComponent ? 'Redaguoti komponentą' : 'Pridėti naują komponentą'}</h3>
                                            <Input name="name" placeholder="Komponento pavadinimas" defaultValue={editingComponent?.name || ''} required />
                                            <div className="flex gap-4">
                                                <Input name="stock" type="number" placeholder="Likutis" defaultValue={editingComponent?.stock ?? ''} required className="flex-1" />
                                                <Input name="leadTimeDays" type="number" placeholder="Gavimo laikas (d.)" defaultValue={editingComponent?.leadTimeDays ?? ''} required className="flex-1" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit" className="flex-1">{editingComponent ? 'Išsaugoti' : 'Pridėti'}</Button>
                                                {editingComponent && <Button variant="outline" onClick={() => { setEditingComponent(null); document.querySelector('form').reset(); }}>Atšaukti</Button>}
                                            </div>
                                        </form>
                                    )}
                                    <div className="max-h-[600px] overflow-y-auto pr-2">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Komponentas</TableHead>
                                                    <TableHead className="text-right">Likutis</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {componentsInventory.map(comp => (
                                                    <TableRow key={comp.id}>
                                                        <TableCell className="font-medium">{comp.name}</TableCell>
                                                        <TableCell className="text-right">{comp.stock}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-1 justify-end">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingComponent(comp)}><span className="sr-only">Redaguoti</span>✏️</Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Ar tikrai norite ištrinti?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Šis veiksmas visam laikui pašalins komponentą "{comp.name}".
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => deleteComponent(comp.id)}>Ištrinti</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </>
        );
    };

    export default InventoryManagement;
import React, { useState, useMemo, useCallback } from 'react';
import { useComponents } from '@/context/ComponentsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductionPlanning = () => {
    const { subassemblies, componentsInventory, categories } = useComponents();
    const [productionPlan, setProductionPlan] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');

    const allSubassembliesFlat = useMemo(() => {
        return Object.values(subassemblies).flat();
    }, [subassemblies]);

    const allItemsMap = useMemo(() => {
        const map = new Map();
        allSubassembliesFlat.forEach(sa => map.set(sa.id, { ...sa, type: 'subassembly' }));
        componentsInventory.forEach(c => map.set(c.id, { ...c, type: 'component' }));
        categories.forEach(cat => map.set(cat.id, { ...cat, type: 'category' }));
        return map;
    }, [allSubassembliesFlat, componentsInventory, categories]);

    const selectableItems = useMemo(() => {
        const topLevelSubassemblies = allSubassembliesFlat.filter(sa => {
            return !allSubassembliesFlat.some(parent => parent.children?.includes(sa.id));
        });

        return [
            { label: "Galutiniai produktai", items: categories },
            { label: "Pagrindiniai subasembliai", items: topLevelSubassemblies }
        ].filter(group => group.items.length > 0);
    }, [categories, allSubassembliesFlat]);


    const handleAddToPlan = () => {
        if (!selectedItem || productionPlan.some(p => p.id === selectedItem)) {
            return;
        }
        const item = allItemsMap.get(selectedItem);
        if (item) {
            setProductionPlan([...productionPlan, { ...item, quantityToProduce: 1 }]);
            setSelectedItem('');
        }
    };
    
    const handleRemoveFromPlan = (id) => {
        setProductionPlan(productionPlan.filter(p => p.id !== id));
    };

    const handleQuantityChange = (id, quantity) => {
        const newQuantity = Math.max(1, parseInt(quantity, 10) || 1);
        setProductionPlan(productionPlan.map(p => p.id === id ? { ...p, quantityToProduce: newQuantity } : p));
    };

    const calculateRequirements = useCallback(() => {
        const requiredComponents = new Map();

        const findRequirementsRecursive = (itemId, quantity) => {
            const item = allItemsMap.get(itemId);
            if (!item) return;

            if (item.type === 'component') {
                const currentQuantity = requiredComponents.get(itemId)?.totalRequired || 0;
                requiredComponents.set(itemId, { ...item, totalRequired: currentQuantity + quantity });
                return;
            }

            if (item.type === 'subassembly') {
                if(item.components) {
                    item.components.forEach(comp => {
                        findRequirementsRecursive(comp.componentId, comp.requiredQuantity * quantity);
                    });
                }
                if(item.children){
                    item.children.forEach(childId => {
                         findRequirementsRecursive(childId, quantity);
                    });
                }
            }
        };

        const findTopLevelRequirements = (itemId, quantity) => {
            const item = allItemsMap.get(itemId);
            if (!item) return;

            if(item.type === 'category'){
                const categorySubassemblies = subassemblies[item.id] || [];
                categorySubassemblies.forEach(sa => {
                    findRequirementsRecursive(sa.id, quantity);
                });
            } else {
                 findRequirementsRecursive(itemId, quantity);
            }
        };


        productionPlan.forEach(planItem => {
            findTopLevelRequirements(planItem.id, planItem.quantityToProduce);
        });

        return Array.from(requiredComponents.values()).map(comp => {
            const shortage = Math.max(0, comp.totalRequired - comp.stock);
            return { ...comp, shortage };
        }).sort((a, b) => b.shortage - a.shortage);
    }, [productionPlan, allItemsMap, subassemblies]);

    const requiredComponents = useMemo(() => calculateRequirements(), [calculateRequirements]);

    const availableItems = useMemo(() => {
        const plannedIds = new Set(productionPlan.map(p => p.id));
        return selectableItems.map(group => ({
            ...group,
            items: group.items.filter(item => !plannedIds.has(item.id))
        })).filter(group => group.items.length > 0);
    }, [selectableItems, productionPlan]);
    
    return (
        <div className="p-8 space-y-8">
            <header>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Gamybos Planavimas</h1>
                <p className="text-lg text-muted-foreground mt-2">Sukurkite gamybos planą ir apskaičiuokite reikalingų komponentų poreikį.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>1. Sudarykite Gamybos Planą</CardTitle>
                            <CardDescription>Pasirinkite galutinius produktus arba pagrindinius subasemblius ir nurodykite kiekius.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Select value={selectedItem} onValueChange={setSelectedItem}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Pasirinkite produktą..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableItems.map(group => (
                                            <React.Fragment key={group.label}>
                                                <SelectItem value={group.label} disabled className="font-bold text-muted-foreground">{group.label}</SelectItem>
                                                {group.items.map(item => (
                                                    <SelectItem key={item.id} value={item.id} className="pl-6">{item.name}</SelectItem>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddToPlan} disabled={!selectedItem}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                <AnimatePresence>
                                    {productionPlan.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className={`text-xs font-semibold ${item.type === 'category' ? 'text-purple-600' : 'text-blue-600'}`}>
                                                    {item.type === 'category' ? 'Galutinis produktas' : 'Subasemblis'}
                                                </p>
                                            </div>
                                            <Input
                                                type="number"
                                                value={item.quantityToProduce}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                className="w-20 h-8 text-center"
                                {(isAdmin() ? categories : visibleCategories).map(cat => (
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveFromPlan(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {productionPlan.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2" />
                                        <p>Gamybos planas tuščias.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>2. Komponentų Poreikis</CardTitle>
                            <CardDescription>Bendras komponentų sąrašas, reikalingas įvykdyti sudarytą gamybos planą.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="max-h-[60vh] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead>Komponentas</TableHead>
                                            <TableHead className="text-center">Likutis Sandėlyje</TableHead>
                                            <TableHead className="text-center">Trūkumas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requiredComponents.length > 0 ? (
                                            requiredComponents.map(comp => (
                                                <TableRow key={comp.id} className={comp.shortage > 0 ? 'bg-red-50/50' : ''}>
                                                    <TableCell className="font-medium">{comp.name}</TableCell>
                                                    <TableCell className="text-center">{comp.stock}</TableCell>
                                                    <TableCell className="text-center font-bold text-red-600">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {comp.shortage > 0 ? (
                                                                <>
                                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                                    <span>{comp.shortage}</span>
                                                                </>
                                                            ) : (
                                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                                                    {productionPlan.length > 0 ? 'Komponentų poreikis apskaičiuojamas...' : 'Pasirinkite produktus, kad matytumėte komponentų poreikį.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProductionPlanning;
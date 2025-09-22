import React, { useState, useMemo, useCallback } from 'react';
    import { useComponents } from '@/context/ComponentsContext';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Clock, Calendar, PackageCheck, PackageX, Package, Calculator } from 'lucide-react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Badge } from '@/components/ui/badge';

    const ComponentTracking = () => {
        const { componentsInventory, subassemblies, categories, getAllSubassembliesMap } = useComponents();
        const [productionCycleDays, setProductionCycleDays] = useState(30);
        const [productionPlan, setProductionPlan] = useState({});
        const [submittedPlan, setSubmittedPlan] = useState(null);

        const handleQuantityChange = (productId, value) => {
            const quantity = Math.max(0, parseInt(value) || 0);
            setProductionPlan(prev => ({
                ...prev,
                [productId]: quantity
            }));
            setSubmittedPlan(null);
        };
        
        const handleCycleDaysChange = (value) => {
            setProductionCycleDays(Math.max(1, parseInt(value) || 1));
            setSubmittedPlan(null);
        }

        const handleCalculate = () => {
            setSubmittedPlan({ ...productionPlan, cycleDays: productionCycleDays });
        };

        const requiredComponents = useMemo(() => {
            if (!submittedPlan || Object.keys(submittedPlan).filter(k => k !== 'cycleDays').every(k => !submittedPlan[k] || submittedPlan[k] === 0) || !subassemblies || !componentsInventory) {
                return {};
            }

            const allSubassembliesMap = getAllSubassembliesMap();
            const componentNeeds = {};
            const memo = new Map();

            const getSubassemblyRequirements = (subassemblyId, requiredParentQty) => {
                const memoKey = `${subassemblyId}-${requiredParentQty}`;
                if (memo.has(memoKey)) {
                    return;
                }

                const subassembly = allSubassembliesMap.get(subassemblyId);
                if (!subassembly) {
                    memo.set(memoKey, true);
                    return;
                }

                if (subassembly.components) {
                    subassembly.components.forEach(component => {
                        const componentInfo = componentsInventory.find(c => c.id === component.componentId);
                        if (componentInfo) {
                            const totalRequired = component.requiredQuantity * requiredParentQty;
                            componentNeeds[componentInfo.name] = (componentNeeds[componentInfo.name] || 0) + totalRequired;
                        }
                    });
                }
                
                if (subassembly.children) {
                    subassembly.children.forEach(childId => {
                        getSubassemblyRequirements(childId, requiredParentQty);
                    });
                }
                
                memo.set(memoKey, true);
            };

            for (const productId in submittedPlan) {
                if (productId === 'cycleDays') continue;

                const quantity = submittedPlan[productId];
                if (quantity > 0) {
                    const categorySubassemblies = subassemblies[productId] || [];
                    categorySubassemblies.forEach(rootSubassembly => {
                        getSubassemblyRequirements(rootSubassembly.id, quantity);
                    });
                }
            }
            
            return componentNeeds;
        }, [submittedPlan, subassemblies, componentsInventory, getAllSubassembliesMap]);
        
        const trackedComponents = useMemo(() => {
            if (Object.keys(requiredComponents).length === 0) return [];
            
            const cycleDays = submittedPlan?.cycleDays || 30;

            return Object.entries(requiredComponents).map(([name, neededQty]) => {
                const component = componentsInventory.find(c => c.name === name);
                if (!component) return null;

                const availableStock = component.stock || 0;
                const shortfall = Math.max(0, neededQty - availableStock);
                
                let status;
                let statusText;
                let variant;
                let orderDeadline = Infinity;

                if (shortfall > 0) {
                    const leadTime = component.leadTimeDays || 0;
                    orderDeadline = cycleDays - leadTime;

                    if (orderDeadline < 0) {
                        status = 'critical';
                        statusText = 'Vėluoja';
                        variant = 'destructive';
                    } else if (orderDeadline <= 5) {
                        status = 'urgent';
                        statusText = 'Užsakyti dabar';
                        variant = 'default';
                    } else {
                        status = 'safe_to_order';
                        statusText = `Laiko rezervas: ${orderDeadline} d.`;
                        variant = 'secondary';
                    }
                } else {
                    status = 'in_stock';
                    statusText = 'Pakanka sandėlyje';
                    variant = 'outline';
                }

                return {
                    ...component,
                    neededQty: Math.ceil(neededQty),
                    shortfall: Math.ceil(shortfall),
                    orderDeadline,
                    status,
                    statusText,
                    variant,
                };
            }).filter(Boolean).sort((a, b) => a.orderDeadline - b.orderDeadline);
        }, [componentsInventory, requiredComponents, submittedPlan]);

        const getStatusIcon = (status) => {
            switch(status) {
                case 'critical':
                    return <PackageX className="h-5 w-5 text-red-500" />;
                case 'urgent':
                    return <Clock className="h-5 w-5 text-yellow-500" />;
                case 'safe_to_order':
                    return <Calendar className="h-5 w-5 text-blue-500" />;
                case 'in_stock':
                    return <PackageCheck className="h-5 w-5 text-green-500" />;
                default:
                    return null;
            }
        }
        
        const statusCategories = [
            { id: 'critical', title: 'Kritiniai (Vėluojantys)', description: 'Šie komponentai nespės atvykti laiku pagal dabartinį planą.'},
            { id: 'urgent', title: 'Užsakytini Dabar', description: 'Šiuos komponentus reikia užsakyti nedelsiant.'},
            { id: 'safe_to_order', title: 'Reikia Užsakyti', description: 'Šiems komponentams turite laiko rezervą.'},
            { id: 'in_stock', title: 'Sandėlyje', description: 'Šių komponentų kiekio sandėlyje pakanka.'},
        ];

        return (
            <div className="p-4 sm:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Komponentų Sekimas</h1>
                    <p className="text-md sm:text-lg text-muted-foreground mt-2">Stebėkite komponentų pristatymo laikus pagal gamybos planą ir identifikuokite kritinius elementus.</p>
                </header>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle>Gamybos Ciklo Planavimas</CardTitle>
                        <CardDescription>Įveskite planuojamą kiekį kiekvienam produktui ir bendrą gamybos trukmę, tada paspauskite "Apskaičiuoti", kad pamatytumėte rezultatus.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="space-y-2">
                                        <Label htmlFor={`quantity-${cat.id}`}>{cat.name}</Label>
                                        <Input
                                            id={`quantity-${cat.id}`}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={productionPlan[cat.id] || ''}
                                            onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                                            className="font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
                                <div className="space-y-2 flex-1 min-w-[200px]">
                                    <Label htmlFor="production-days">Bendra gamybos ciklo trukmė (dienomis)</Label>
                                    <Input
                                        id="production-days"
                                        type="number"
                                        min="1"
                                        value={productionCycleDays}
                                        onChange={(e) => handleCycleDaysChange(e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <Button onClick={handleCalculate} size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                                    <Calculator className="mr-2 h-5 w-5" />
                                    Apskaičiuoti
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AnimatePresence>
                    {submittedPlan && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {statusCategories.map(({id, title, description}) => (
                                <Card key={id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            {getStatusIcon(id)}
                                            {title}
                                        </CardTitle>
                                        <CardDescription>{description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                            <AnimatePresence>
                                                {trackedComponents.filter(c => c.status === id).length > 0 ? trackedComponents.filter(c => c.status === id).map(comp => (
                                                    <motion.div
                                                        key={comp.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{comp.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Trūksta: {comp.shortfall} vnt. (Reikia: {comp.neededQty})
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Pristatymas: {comp.leadTimeDays} d.</p>
                                                        </div>
                                                        <Badge variant={comp.variant}>{comp.statusText}</Badge>
                                                    </motion.div>
                                                )) : (
                                                    <div className="text-center py-10 text-muted-foreground">
                                                        <Package className="h-8 w-8 mx-auto mb-2" />
                                                        <p>Šioje kategorijoje komponentų nėra.</p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    export default ComponentTracking;
import React, { useState, useMemo } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Trash2, Plus, Package } from 'lucide-react';
    import { useComponents } from '@/context/ComponentsContext';
    import { useToast } from '@/components/ui/use-toast';

    const ComponentListDialog = ({ open, onOpenChange, subassembly, onUpdateSubassembly }) => {
        const { componentsInventory, subassemblies: allSubassemblies } = useComponents();
        const { toast } = useToast();
        const [newComponentId, setNewComponentId] = useState('');
        const [newComponentQuantity, setNewComponentQuantity] = useState(1);

        const allComponentsAndSubassemblies = useMemo(() => {
            const allSAs = Object.values(allSubassemblies).flat().map(sa => ({ ...sa, type: 'subassembly' }));
            const allComps = componentsInventory.map(c => ({ ...c, type: 'component' }));
            return [...allSAs, ...allComps];
        }, [componentsInventory, allSubassemblies]);

        const getComponentData = (id) => {
            return allComponentsAndSubassemblies.find(item => item.id === id);
        };

        const handleQuantityChange = (componentId, newQuantity) => {
            const updatedComponents = subassembly.components.map(c =>
                c.componentId === componentId ? { ...c, requiredQuantity: Math.max(0, parseInt(newQuantity, 10) || 0) } : c
            );
            onUpdateSubassembly(subassembly.id, { components: updatedComponents });
        };

        const handleRemoveComponent = (componentId) => {
            const updatedComponents = subassembly.components.filter(c => c.componentId !== componentId);
            onUpdateSubassembly(subassembly.id, { components: updatedComponents });
            toast({ title: "Komponentas pašalintas." });
        };

        const handleAddComponent = () => {
            if (!newComponentId) {
                toast({ title: "Klaida", description: "Pasirinkite komponentą.", variant: "destructive" });
                return;
            }
            if (subassembly.components.some(c => c.componentId === newComponentId)) {
                toast({ title: "Klaida", description: "Šis komponentas jau pridėtas.", variant: "destructive" });
                return;
            }

            const newComponent = {
                componentId: newComponentId,
                requiredQuantity: Math.max(1, newComponentQuantity),
            };

            const updatedComponents = [...subassembly.components, newComponent];
            onUpdateSubassembly(subassembly.id, { components: updatedComponents });
            toast({ title: "Komponentas pridėtas!" });
            setNewComponentId('');
            setNewComponentQuantity(1);
        };

        const availableOptions = useMemo(() => {
            const currentComponentIds = new Set(subassembly.components.map(c => c.componentId));
            return allComponentsAndSubassemblies
                .filter(item => item.id !== subassembly.id && !currentComponentIds.has(item.id))
                .sort((a, b) => a.name.localeCompare(b.name));
        }, [allComponentsAndSubassemblies, subassembly.id, subassembly.components]);

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Komponentų valdymas</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Subasemblio "{subassembly.name}" reikalingi komponentai.
                        </p>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-3">
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-2 py-1 text-sm font-medium text-muted-foreground">
                            <span>Komponentas</span>
                            <span className="text-center">Reikalingas kiekis</span>
                            <span className="text-center">Veiksmai</span>
                        </div>
                        {subassembly.components?.map(({ componentId, requiredQuantity }) => {
                            const componentData = getComponentData(componentId);
                            if (!componentData) return null;
                            
                            const stock = componentData.type === 'component' ? componentData.stock : componentData.quantity;
                            const hasEnough = stock >= requiredQuantity;

                            return (
                                <div key={componentId} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">{componentData.name}</p>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Package className="h-3.5 w-3.5 mr-1.5" />
                                            <span>Likutis: </span>
                                            <span className={`font-semibold ml-1 ${hasEnough ? 'text-green-600' : 'text-red-600'}`}>
                                                {stock} vnt.
                                            </span>
                                        </div>
                                    </div>
                                    <Input
                                        type="number"
                                        value={requiredQuantity}
                                        onChange={(e) => handleQuantityChange(componentId, e.target.value)}
                                        className="w-24 text-center"
                                        min="0"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveComponent(componentId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            );
                        })}
                        {subassembly.components?.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">Komponentų nepriskirta.</p>
                        )}
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Pridėti komponentą</h4>
                        <div className="flex items-center gap-4">
                            <Select value={newComponentId} onValueChange={setNewComponentId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Pasirinkite komponentą ar subasemblį..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOptions.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            <span className={`font-bold ${item.type === 'subassembly' ? 'text-blue-600' : 'text-gray-800'}`}>
                                                {item.type === 'subassembly' ? '[SA] ' : '[C] '}
                                            </span>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                value={newComponentQuantity}
                                onChange={(e) => setNewComponentQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-24"
                                min="1"
                                placeholder="Kiekis"
                            />
                            <Button onClick={handleAddComponent}>
                                <Plus className="h-4 w-4 mr-2" /> Pridėti
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Uždaryti</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    export default ComponentListDialog;
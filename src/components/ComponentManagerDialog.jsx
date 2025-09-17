import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Package, Save } from 'lucide-react';

const ComponentManagerDialog = ({ open, onOpenChange, component, onSave }) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [stock, setStock] = useState(0);
    const [leadTimeDays, setLeadTimeDays] = useState(0);

    useEffect(() => {
        if (component) {
            setName(component.name);
            setStock(component.stock || 0);
            setLeadTimeDays(component.leadTimeDays || 0);
        } else {
            setName('');
            setStock(0);
            setLeadTimeDays(0);
        }
    }, [component, open]);

    const handleSave = () => {
        if (name.trim() === '') {
            toast({
                title: 'Klaida',
                description: 'Komponento pavadinimas negali būti tuščias.',
                variant: 'destructive',
            });
            return;
        }

        onSave({
            name: name.trim(),
            stock: parseInt(stock, 10) || 0,
            leadTimeDays: parseInt(leadTimeDays, 10) || 0,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        {component ? 'Redaguoti komponentą' : 'Pridėti naują komponentą'}
                    </DialogTitle>
                    <DialogDescription>
                        {component ? 'Atnaujinkite komponento informaciją.' : 'Įveskite naujo komponento informaciją.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Pavadinimas
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">
                            Likutis
                        </Label>
                        <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="leadTime" className="text-right">
                            Gavimo laikas (d.)
                        </Label>
                        <Input
                            id="leadTime"
                            type="number"
                            min="0"
                            value={leadTimeDays}
                            onChange={(e) => setLeadTimeDays(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Atšaukti</Button>
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Išsaugoti
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ComponentManagerDialog;
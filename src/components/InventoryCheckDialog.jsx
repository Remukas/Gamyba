import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Package, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Calendar,
  FileText
} from 'lucide-react';

const InventoryCheckDialog = ({ open, onOpenChange, week, components, onComplete }) => {
  const { toast } = useToast();
  const [inspector, setInspector] = useState('');
  const [inventoryData, setInventoryData] = useState({});
  const [notes, setNotes] = useState({});

  // Initialize inventory data when dialog opens
  React.useEffect(() => {
    if (open && components) {
      const initialData = {};
      components.forEach(component => {
        initialData[component.id] = {
          componentName: component.name,
          expectedStock: component.stock,
          actualStock: component.stock,
          hasDiscrepancy: false
        };
      });
      setInventoryData(initialData);
      setNotes({});
      setInspector('');
    }
  }, [open, components]);

  const handleStockChange = (componentId, actualStock) => {
    const stock = parseInt(actualStock) || 0;
    setInventoryData(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        actualStock: stock,
        hasDiscrepancy: stock !== prev[componentId].expectedStock
      }
    }));
  };

  const handleNotesChange = (componentId, noteText) => {
    setNotes(prev => ({
      ...prev,
      [componentId]: noteText
    }));
  };

  const discrepancies = useMemo(() => {
    return Object.values(inventoryData).filter(item => item.hasDiscrepancy);
  }, [inventoryData]);

  const handleSave = () => {
    if (!inspector.trim()) {
      toast({
        title: "Klaida",
        description: "Įveskite inspektoriaus vardą.",
        variant: "destructive"
      });
      return;
    }

    // Sukurti įrašus tik komponentams su neatitikimais
    const recordsToSave = Object.entries(inventoryData)
      .filter(([, data]) => data.hasDiscrepancy)
      .map(([componentId, data]) => ({
        componentId,
        componentName: data.componentName,
        expectedStock: data.expectedStock,
        actualStock: data.actualStock,
        inspector: inspector.trim(),
        notes: notes[componentId] || ''
      }));

    if (recordsToSave.length === 0) {
      toast({
        title: "Nėra neatitikimų",
        description: "Visi komponentai atitinka numatytus likučius. Inventorizacija užbaigta.",
      });
    }

    onComplete(week, recordsToSave);
    onOpenChange(false);
  };

  if (!week) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />
            Inventorizacija - {week.week} Savaitė
          </DialogTitle>
          <DialogDescription>
            Patikrinkite faktiškai esančius komponentų kiekius ir įrašykite tik tuos, kuriuose radote neatitikimus
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Inspector Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="inspector" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Inspektorius *
                </Label>
                <Input
                  id="inspector"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Vardas Pavardė"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data
                </Label>
                <Input value={new Date().toLocaleDateString('lt-LT')} disabled />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Neatitikimai
                </Label>
                <Badge className={discrepancies.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                  {discrepancies.length} komponentų
                </Badge>
              </div>
            </div>
          </div>

          {/* Components List */}
          <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50">
            <div className="sticky top-0 bg-white border-b p-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                <div className="col-span-4">Komponentas</div>
                <div className="col-span-2 text-center">Numatytas Likutis</div>
                <div className="col-span-2 text-center">Faktiškas Likutis</div>
                <div className="col-span-1 text-center">Skirtumas</div>
                <div className="col-span-3">Pastabos</div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {Object.entries(inventoryData).map(([componentId, data]) => (
                <div 
                  key={componentId} 
                  className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg transition-all ${
                    data.hasDiscrepancy 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      {data.hasDiscrepancy ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">{data.componentName}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <Badge variant="outline">{data.expectedStock}</Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={data.actualStock}
                      onChange={(e) => handleStockChange(componentId, e.target.value)}
                      className="text-center"
                      min="0"
                    />
                  </div>
                  
                  <div className="col-span-1 text-center">
                    <Badge className={
                      data.actualStock - data.expectedStock === 0 
                        ? 'bg-green-100 text-green-800'
                        : data.actualStock - data.expectedStock > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {data.actualStock - data.expectedStock > 0 ? '+' : ''}
                      {data.actualStock - data.expectedStock}
                    </Badge>
                  </div>
                  
                  <div className="col-span-3">
                    {data.hasDiscrepancy && (
                      <Textarea
                        placeholder="Aprašykite neatitikimo priežastį..."
                        value={notes[componentId] || ''}
                        onChange={(e) => handleNotesChange(componentId, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {discrepancies.length > 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Inventorizacijos Santrauka:</h4>
              <p className="text-sm text-orange-700">
                Rasta <strong>{discrepancies.length}</strong> komponentų su neatitikimais. 
                Tik šie komponentai bus įrašyti į inventorizacijos istoriją.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Viso komponentų: {Object.keys(inventoryData).length} • 
            Su neatitikimais: {discrepancies.length}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-cyan-600">
              <Save className="h-4 w-4 mr-2" />
              Išsaugoti Inventorizaciją
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryCheckDialog;
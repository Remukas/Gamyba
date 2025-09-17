import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

const StatusManager = ({ open, onOpenChange, statuses, setStatuses }) => {
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#cccccc');
  const [editingStatus, setEditingStatus] = useState(null);

  const handleAddStatus = () => {
    if (newStatusName.trim() === '') {
      toast({ title: 'Klaida', description: 'Statuso pavadinimas negali būti tuščias.', variant: 'destructive' });
      return;
    }
    if (statuses.some(s => s.name.toLowerCase() === newStatusName.trim().toLowerCase())) {
        toast({ title: 'Klaida', description: 'Statusas tokiu pavadinimu jau egzistuoja.', variant: 'destructive' });
        return;
    }

    const newStatus = {
      id: newStatusName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newStatusName.trim(),
      color: newStatusColor,
    };
    
    setStatuses([...statuses, newStatus]);
    setNewStatusName('');
    setNewStatusColor('#cccccc');
    toast({ title: 'Pavyko!', description: `Statusas "${newStatus.name}" pridėtas.` });
  };
  
  const handleDeleteStatus = (idToDelete) => {
    if (statuses.length <= 1) {
      toast({ title: 'Klaida', description: 'Turi likti bent vienas statusas.', variant: 'destructive' });
      return;
    }
    setStatuses(statuses.filter(status => status.id !== idToDelete));
    toast({ title: 'Pavyko!', description: 'Statusas pašalintas.' });
  };
  
  const handleStartEditing = (status) => {
    setEditingStatus({ ...status });
  };

  const handleSaveEdit = () => {
    if (editingStatus.name.trim() === '') {
      toast({ title: 'Klaida', description: 'Statuso pavadinimas negali būti tuščias.', variant: 'destructive' });
      return;
    }

    setStatuses(statuses.map(s => s.id === editingStatus.id ? editingStatus : s));
    setEditingStatus(null);
    toast({ title: 'Pavyko!', description: 'Statusas atnaujintas.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Valdyti gamybos statusus</DialogTitle>
          <DialogDescription>
            Pridėkite, redaguokite arba pašalinkite gamybos proceso statusus.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Esami statusai</Label>
            <div className="space-y-2 rounded-md border p-2 max-h-60 overflow-y-auto">
              {statuses.map(status => (
                <div key={status.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                   {editingStatus && editingStatus.id === status.id ? (
                    <>
                      <Input 
                        type="color" 
                        value={editingStatus.color}
                        onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                        className="p-0 h-8 w-8"
                      />
                      <Input
                        value={editingStatus.name}
                        onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                        className="h-8"
                      />
                      <Button size="icon" className="h-8 w-8" onClick={handleSaveEdit}><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStatus(null)}>Atšaukti</Button>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="flex-1 font-medium text-sm">{status.name}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEditing(status)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive-ghost" className="h-8 w-8" onClick={() => handleDeleteStatus(status.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <Label>Pridėti naują statusą</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="p-0 h-10 w-10"
              />
              <Input
                placeholder="Naujo statuso pavadinimas"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
              />
              <Button onClick={handleAddStatus}>
                <Plus className="h-4 w-4 mr-2" />
                Pridėti
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Uždaryti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusManager;
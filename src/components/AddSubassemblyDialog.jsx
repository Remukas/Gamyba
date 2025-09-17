import React, { useState } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Textarea } from '@/components/ui/textarea';

    const AddSubassemblyDialog = ({ open, onOpenChange, onAdd, category, statuses }) => {
      const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        targetQuantity: 1,
        status: statuses.length > 0 ? statuses[0].id : '',
        comments: []
      });
      const [comment, setComment] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name.trim()) {
          const finalData = {
            ...formData,
            comments: comment.trim() ? [comment.trim()] : []
          };
          onAdd(finalData);
          setFormData({
            name: '',
            quantity: 0,
            targetQuantity: 1,
            status: statuses.length > 0 ? statuses[0].id : '',
            comments: []
          });
          setComment('');
          onOpenChange(false);
        }
      };

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Pridėti naują subasemblį</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Kategorija: {category}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Pavadinimas *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Įveskite subasemblio pavadinimą"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Dabartinis kiekis</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="target">Tikslas *</Label>
                  <Input
                    id="target"
                    type="number"
                    min="1"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Statusas</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: status.color }}/>
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comment">Pradinis komentaras (neprivalomas)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Pridėkite komentarą apie šį subasemblį..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Atšaukti
                </Button>
                <Button type="submit">
                  Pridėti subasemblį
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };

    export default AddSubassemblyDialog;
import React, { useState, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { X, Edit, Trash2, MessageCircle, Plus, Link, HardHat, Component as ComponentIcon } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
    import { useToast } from '@/components/ui/use-toast';

    const SubassemblyDetails = ({ subassembly, onClose, onUpdate, onDelete, onConnect, statuses, onShowComponents }) => {
      const { toast } = useToast();
      const [isEditing, setIsEditing] = useState(false);
      const [editData, setEditData] = useState({
        name: subassembly.name,
        quantity: subassembly.quantity,
        targetQuantity: subassembly.targetQuantity,
        status: subassembly.status
      });
      const [newComment, setNewComment] = useState('');
      
      const currentStatus = useMemo(() => {
        return statuses.find(s => s.id === subassembly.status) || { name: 'Nežinoma', color: '#6b7280' };
      }, [subassembly.status, statuses]);

      const handleSave = () => {
        if (editData.name.trim() === '') {
          toast({
            title: "Klaida",
            description: "Pavadinimas negali būti tuščias.",
            variant: "destructive"
          });
          return;
        }
        onUpdate(editData);
        setIsEditing(false);
        toast({
          title: "Duomenys atnaujinti!",
          description: `${editData.name} sėkmingai atnaujintas`
        });
      };

      const handleAddComment = () => {
        if (newComment.trim()) {
          const updatedComments = [...(subassembly.comments || []), newComment.trim()];
          onUpdate({ comments: updatedComments });
          setNewComment('');
          toast({
            title: "Komentaras pridėtas!",
            description: "Naujas komentaras sėkmingai pridėtas"
          });
        }
      };

      const handleDeleteComment = (index) => {
        const updatedComments = subassembly.comments.filter((_, i) => i !== index);
        onUpdate({ comments: updatedComments });
        toast({
          title: "Komentaras pašalintas",
          description: "Komentaras sėkmingai pašalintas"
        });
      };

      return (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-lg border-l shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Subasemblio detalės</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Pavadinimas</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="quantity">Dabartinis kiekis</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={editData.quantity}
                        min="0"
                        onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Statusas</Label>
                    <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
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

                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      Išsaugoti
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Atšaukti
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subassembly.name}</h3>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white mt-2" style={{ backgroundColor: currentStatus.color }}>
                      {currentStatus.name}
                    </div>
                  </div>

                   <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Gamybos kiekis</span>
                          <span className="text-sm font-semibold text-gray-800">{subassembly.quantity} vnt.</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <HardHat className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <div className="text-sm text-blue-600">Subasembliai</div>
                          <div className="font-semibold text-blue-900">{subassembly.children?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <div className="text-sm text-green-600">Komentarai</div>
                          <div className="font-semibold text-green-900">{subassembly.comments?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(true)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Redaguoti
                    </Button>
                    <Button onClick={onConnect} variant="outline">
                      <Link className="h-4 w-4 mr-2" />
                      Sujungti
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ar tikrai norite ištrinti?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Šis veiksmas negrįžtamas. Subasemblis "{subassembly.name}" bus visam laikui pašalintas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete}>Ištrinti</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 flex items-center"><ComponentIcon className="h-4 w-4 mr-2 text-gray-500" /> Reikalingi komponentai</h4>
                    <Button variant="outline" size="sm" onClick={onShowComponents}>
                        <Edit className="h-3 w-3 mr-1.5" /> Valdyti
                    </Button>
                </div>
                 <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
                   {subassembly.components && subassembly.components.length > 0 ? (
                      <p className="text-gray-500">{subassembly.components.length} komponentų tipai priskirti.</p>
                   ) : (
                      <p className="text-gray-500 italic">Komponentų nenurodyta.</p>
                   )}
                 </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Komentarai</h4>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                  {subassembly.comments?.length > 0 ? subassembly.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-700 flex-1">{comment}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(index)}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 italic">Komentarų nėra</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Pridėti komentarą..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Pridėti komentarą
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    };

    export default SubassemblyDetails;
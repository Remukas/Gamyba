import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Briefcase, Shield, Clock, Edit, Save, X } from 'lucide-react';

const UserProfile = ({ open, onOpenChange }) => {
  const { currentUser, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    department: currentUser?.department || ''
  });

  const handleSave = () => {
    updateUser(currentUser.id, editData);
    setIsEditing(false);
    toast({
      title: "Profilis atnaujintas!",
      description: "Jūsų profilio informacija sėkmingai atnaujinta."
    });
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    operator: 'bg-green-100 text-green-800',
    quality: 'bg-purple-100 text-purple-800'
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Vartotojo Profilis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profilio nuotrauka ir pagrindinė info */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <h3 className="text-xl font-semibold">{currentUser.name}</h3>
            <Badge className={`mt-2 ${roleColors[currentUser.role]}`}>
              {currentUser.role}
            </Badge>
          </div>

          {/* Profilio informacija */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="edit-name">Vardas</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">El. paštas</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Padalinys</Label>
                  <Input
                    id="edit-department"
                    value={editData.department}
                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">El. paštas</div>
                    <div className="font-medium">{currentUser.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Padalinys</div>
                    <div className="font-medium">{currentUser.department || 'Nenurodyta'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Paskutinis prisijungimas</div>
                    <div className="font-medium">
                      {currentUser.lastLogin 
                        ? new Date(currentUser.lastLogin).toLocaleString('lt-LT')
                        : 'Niekada'
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Veiksmai */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Išsaugoti
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Atšaukti
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Redaguoti Profilį
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
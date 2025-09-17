import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useComponents } from '@/context/ComponentsContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Plus,
  Search,
  Settings,
  HelpCircle,
  Package,
  Zap,
  Bot
} from 'lucide-react';
import SubassemblyNode from '@/components/SubassemblyNode';
import SubassemblyDetails from '@/components/SubassemblyDetails';
import AddSubassemblyDialog from '@/components/AddSubassemblyDialog';
import ComponentListDialog from '@/components/ComponentListDialog';
import StatusManager from '@/components/StatusManager';
import ExcelImportDialog from '@/components/ExcelImportDialog';
import ExcelUpdateDialog from '@/components/ExcelUpdateDialog';
import AIAssistant from '@/components/AIAssistant';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';
import Xarrow from 'react-xarrows';

const ProductionHierarchy = () => {
  const { 
    subassemblies, 
    setSubassemblies, 
    categories, 
    setCategories,
    componentsInventory,
    addOrUpdateInventory,
    updateComponentStock,
    updateSubassemblyQuantity
  } = useComponents();
  
  const { toast } = useToast();
  
  // State for UI controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [selectedSubassembly, setSelectedSubassembly] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showExcelUpdate, setShowExcelUpdate] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState(null);
  const [connectionTarget, setConnectionTarget] = useState(null);
  
  // Zoom and pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  
  // Default statuses
  const [statuses, setStatuses] = useState([
    { id: 'pending', name: 'Laukiama', color: '#f97316' },
    { id: 'in_progress', name: 'Vykdoma', color: '#3b82f6' },
    { id: 'completed', name: 'Užbaigta', color: '#22c55e' },
    { id: 'paused', name: 'Pristabdyta', color: '#a855f7' }
  ]);

  const currentCategorySubassemblies = useMemo(() => {
    return subassemblies[selectedCategory] || [];
  }, [subassemblies, selectedCategory]);

  const filteredSubassemblies = useMemo(() => {
    if (!searchTerm) return currentCategorySubassemblies;
    return currentCategorySubassemblies.filter(sa => 
      sa.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentCategorySubassemblies, searchTerm]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      const newLocked = !prev;
      toast({
        title: newLocked ? "Subasembliai užrakinti" : "Subasembliai atrakinti",
        description: newLocked ? "Dabar negalite stumdyti subasemblių" : "Dabar galite laisvai stumdyti subasemblius"
      });
      return newLocked;
    });
  }, [toast]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = useCallback(() => {
    // Automatiškai pritaikyti zoom pagal turinį
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleSubassemblyClick = useCallback((subassembly) => {
    if (isConnecting) {
      if (!connectionSource) {
        setConnectionSource(subassembly.id);
        toast({
          title: "Pasirinktas šaltinis",
          description: `Dabar pasirinkite tikslą, kurį norite sujungti su "${subassembly.name}"`
        });
      } else if (connectionSource !== subassembly.id) {
        setConnectionTarget(subassembly.id);
        handleConnection(connectionSource, subassembly.id);
      }
    } else {
      setSelectedSubassembly(subassembly);
    }
  }, [isConnecting, connectionSource]);

  const handleConnection = useCallback((sourceId, targetId) => {
    const updatedSubassemblies = { ...subassemblies };
    
    // Find source subassembly and add target to its children
    for (const category in updatedSubassemblies) {
      const categorySubassemblies = updatedSubassemblies[category];
      const sourceIndex = categorySubassemblies.findIndex(sa => sa.id === sourceId);
      
      if (sourceIndex !== -1) {
        const updatedSource = { ...categorySubassemblies[sourceIndex] };
        if (!updatedSource.children) {
          updatedSource.children = [];
        }
        if (!updatedSource.children.includes(targetId)) {
          updatedSource.children.push(targetId);
        }
        updatedSubassemblies[category][sourceIndex] = updatedSource;
        break;
      }
    }
    
    setSubassemblies(updatedSubassemblies);
    setIsConnecting(false);
    setConnectionSource(null);
    setConnectionTarget(null);
    
    toast({
      title: "Sujungimas sukurtas!",
      description: "Subasembliai sėkmingai sujungti"
    });
  }, [subassemblies, setSubassemblies, toast]);

  const handleAddSubassembly = useCallback((data) => {
    const newSubassembly = {
      id: `${selectedCategory}-${Date.now()}`,
      ...data,
      position: { 
        x: 200 + Math.random() * 300, 
        y: 150 + Math.random() * 200 
      },
      children: [],
      components: [],
      category: selectedCategory
    };

    const updatedSubassemblies = {
      ...subassemblies,
      [selectedCategory]: [...(subassemblies[selectedCategory] || []), newSubassembly]
    };

    setSubassemblies(updatedSubassemblies);
    toast({
      title: "Subasemblis pridėtas!",
      description: `"${data.name}" sėkmingai pridėtas`
    });
  }, [selectedCategory, subassemblies, setSubassemblies, toast]);

  const handleImportSubassemblyWithComponents = useCallback((data) => {
    const newSubassembly = {
      id: `${selectedCategory}-${Date.now()}`,
      name: data.name,
      quantity: 0,
      targetQuantity: 1,
      status: 'pending',
      position: { 
        x: 200 + Math.random() * 300, 
        y: 150 + Math.random() * 200 
      },
      children: [],
      components: data.components || [],
      category: selectedCategory,
      comments: []
    };

    const updatedSubassemblies = {
      ...subassemblies,
      [selectedCategory]: [...(subassemblies[selectedCategory] || []), newSubassembly]
    };

    setSubassemblies(updatedSubassemblies);
    toast({
      title: "Subasemblis importuotas!",
      description: `"${data.name}" sėkmingai importuotas su komponentais`
    });
  }, [selectedCategory, subassemblies, setSubassemblies, toast]);

  const handleExcelUpdate = useCallback((data) => {
    let updatedComponents = 0;
    let updatedSubassemblies = 0;

    // Atnaujinti komponentų likučius
    data.forEach(item => {
      if (updateComponentStock(item.name, item.quantity)) {
        updatedComponents++;
      }
      if (updateSubassemblyQuantity(item.name, item.quantity)) {
        updatedSubassemblies++;
      }
    });

    toast({
      title: "Likučiai atnaujinti!",
      description: `Atnaujinta ${updatedComponents} komponentų ir ${updatedSubassemblies} subasemblių`
    });
  }, [updateComponentStock, updateSubassemblyQuantity, toast]);
  const handleUpdateSubassembly = useCallback((id, updates) => {
    const updatedSubassemblies = { ...subassemblies };
    
    for (const category in updatedSubassemblies) {
      const categorySubassemblies = updatedSubassemblies[category];
      const index = categorySubassemblies.findIndex(sa => sa.id === id);
      
      if (index !== -1) {
        updatedSubassemblies[category][index] = {
          ...categorySubassemblies[index],
          ...updates
        };
        break;
      }
    }
    
    setSubassemblies(updatedSubassemblies);
    
    if (selectedSubassembly && selectedSubassembly.id === id) {
      setSelectedSubassembly({ ...selectedSubassembly, ...updates });
    }
  }, [subassemblies, setSubassemblies, selectedSubassembly]);

  const handleDeleteSubassembly = useCallback((id) => {
    const updatedSubassemblies = { ...subassemblies };
    
    for (const category in updatedSubassemblies) {
      updatedSubassemblies[category] = updatedSubassemblies[category].filter(sa => sa.id !== id);
      
      // Remove from children arrays
      updatedSubassemblies[category].forEach(sa => {
        if (sa.children) {
          sa.children = sa.children.filter(childId => childId !== id);
        }
      });
    }
    
    setSubassemblies(updatedSubassemblies);
    setSelectedSubassembly(null);
    
    toast({
      title: "Subasemblis pašalintas",
      description: "Subasemblis ir visi jo ryšiai pašalinti"
    });
  }, [subassemblies, setSubassemblies, toast]);

  const renderConnections = () => {
    const connections = [];
    
    filteredSubassemblies.forEach(subassembly => {
      if (subassembly.children) {
        subassembly.children.forEach(childId => {
          const childExists = currentCategorySubassemblies.some(sa => sa.id === childId);
          if (childExists) {
            connections.push(
              <Xarrow
                key={`${subassembly.id}-${childId}`}
                start={subassembly.id}
                end={childId}
                color="#2563eb"
                strokeWidth={4}
                headSize={8}
                curveness={0.3}
                showHead={true}
                animateDrawing={0.5}
                zIndex={-1}
                passProps={{
                  style: {
                    filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))'
                  }
                }}
              />
            );
          }
        });
      }
    });
    
    return connections;
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar Toggle Button */}

      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-0' : 'w-80'} overflow-hidden bg-white/80 backdrop-blur-sm border-r shadow-lg relative`}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6 relative">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gamybos medis
            </h1>
            <p className="text-gray-600 text-sm">Produktų ir subasemblių valdymas</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ieškoti subasemblių..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="pagaminta" className="rounded" />
              <label htmlFor="pagaminta" className="text-sm">Pagaminta 0 vnt.</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="turi-komentaru" className="rounded" />
              <label htmlFor="turi-komentaru" className="text-sm">Turi komentarų</label>
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {categories.map(category => {
                const categorySubassemblies = subassemblies[category.id] || [];
                return (
                  <div key={category.id}>
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </div>
                    
                    {selectedCategory === category.id && (
                      <div className="ml-4 mt-2 space-y-1">
                        {categorySubassemblies.map(sa => (
                          <div key={sa.id} className="text-xs text-gray-600 p-1 hover:bg-gray-50 rounded">
                            {sa.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Pridėti produktą
            </Button>
          </div>

          {/* Selected Category Info */}
          {selectedCategory && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-2">
                {categories.find(c => c.id === selectedCategory)?.name}
              </div>
              <div className="text-xs text-gray-600">
                {currentCategorySubassemblies.length} vnt.
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  Pridėti subasemblį
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowExcelImport(true)}>
                  Importuoti
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowExcelUpdate(true)}>
                  Atnaujinti likučius
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar Toggle Button - Always Visible */}
      <Button
        onClick={toggleSidebar}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-xl border-0 rounded-full w-10 h-16 p-0 transition-all duration-300 flex items-center justify-center ${
          isSidebarCollapsed ? 'left-0' : 'left-80'
        }`}
        size="sm"
      >
        {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </Button>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-40 flex gap-2">
          <Button
            onClick={toggleLock}
            className={`${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg px-4 py-2 h-auto min-w-[120px]`}
          >
            {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            {isLocked ? 'Užrakinta' : 'Atrakinta'}
          </Button>
          
          <Button
            onClick={() => setShowTutorial(true)}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm hover:bg-white px-4 py-2 h-auto min-w-[100px]"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Pagalba
          </Button>

          <Button
            onClick={() => setShowAIAssistant(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg px-4 py-2 h-auto min-w-[140px]"
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Asistentas
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleFitToScreen}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleResetView}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-2 text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </div>
        </div>
        {/* Lock Status Indicator */}
        {isLocked && (
          <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            🔒 Subasembliai užrakinti
          </div>
          isSidebarCollapsed ? 'left-4' : 'left-[316px]'
        } bottom-32`}
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="w-full h-full hierarchy-canvas overflow-hidden relative"
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
        >
          {/* Render Subassemblies */}
          <AnimatePresence>
            {filteredSubassemblies.map(subassembly => (
              <SubassemblyNode
                key={subassembly.id}
                subassembly={subassembly}
                isSelected={selectedSubassembly?.id === subassembly.id}
                onClick={() => handleSubassemblyClick(subassembly)}
                onUpdate={(updates) => handleUpdateSubassembly(subassembly.id, updates)}
                zoom={zoom}
                isConnectingTarget={connectionSource && connectionSource !== subassembly.id}
                statuses={statuses}
                isLocked={isLocked}
              />
            ))}
          </AnimatePresence>

          {/* Render Connections */}
          {renderConnections()}
        </div>
      </div>

      {/* Tutorial Dialog */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold mb-4">🏭 Gamybos Medžio Instrukcijos</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-600">Šoninės Panelės Valdymas:</h4>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Spauskite rodyklės mygtuką kairėje, kad susklapti/išskleisti šoninę panelę</li>
                  <li>Susklapus panelę matysite pilną gamybos medžio vaizdą</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-600">Subasemblių Užrakinimas:</h4>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Spauskite spynos mygtuką viršuje, kad užrakinti/atrakinti subasemblius</li>
                  <li>Užrakinus negalėsite stumdyti subasemblių</li>
                  <li>Užrakinti subasembliai pažymėti raudonu tašku</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600">Ryšiai Tarp Subasemblių:</h4>
                <p>Mėlyni ryšiai su šešėliais rodo sąsajas tarp subasemblių - dabar aiškiau matomi.</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowTutorial(false)}>
                Supratau
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialogs */}
      {selectedSubassembly && (
        <SubassemblyDetails
          subassembly={selectedSubassembly}
          onClose={() => setSelectedSubassembly(null)}
          onUpdate={(updates) => handleUpdateSubassembly(selectedSubassembly.id, updates)}
          onDelete={() => handleDeleteSubassembly(selectedSubassembly.id)}
          onConnect={() => {
            setIsConnecting(true);
            setConnectionSource(selectedSubassembly.id);
            setSelectedSubassembly(null);
            toast({
              title: "Sujungimo režimas",
              description: "Pasirinkite subasemblį, kurį norite sujungti"
            });
          }}
          statuses={statuses}
          onShowComponents={() => setShowComponentDialog(true)}
        />
      )}

      <AddSubassemblyDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddSubassembly}
        category={categories.find(c => c.id === selectedCategory)?.name || ''}
        statuses={statuses}
      />

      {selectedSubassembly && (
        <ComponentListDialog
          open={showComponentDialog}
          onOpenChange={setShowComponentDialog}
          subassembly={selectedSubassembly}
          onUpdateSubassembly={handleUpdateSubassembly}
        />
      )}

      <AIAssistant
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        onPlanConfirm={(plan) => {
          // Handle AI plan confirmation
          console.log('AI Plan:', plan);
        }}
        categories={categories}
        allSubassemblies={Object.values(subassemblies).flat()}
      />

      <ExcelImportDialog
        open={showExcelImport}
        onOpenChange={setShowExcelImport}
        onImportSubassemblyWithComponents={handleImportSubassemblyWithComponents}
        categoryName={categories.find(c => c.id === selectedCategory)?.name || ''}
      />

      <ExcelUpdateDialog
        open={showExcelUpdate}
        onOpenChange={setShowExcelUpdate}
        onImport={handleExcelUpdate}
      />
    </div>
  );
};

export default ProductionHierarchy;
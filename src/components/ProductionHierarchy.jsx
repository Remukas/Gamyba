import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { ZoomIn, ZoomOut, RotateCcw, Plus, Search, Settings, FileUp, Component, Trash2, Edit, ChevronLeft, ChevronRight, Lock, Unlock } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
    import SubassemblyNode from '@/components/SubassemblyNode';
    import SubassemblyDetails from '@/components/SubassemblyDetails';
    import AddSubassemblyDialog from '@/components/AddSubassemblyDialog';
    import ExcelImportDialog from '@/components/ExcelImportDialog';
    import ExcelUpdateDialog from '@/components/ExcelUpdateDialog';
    import StatusManager from '@/components/StatusManager';
    import ComponentListDialog from '@/components/ComponentListDialog';
    import { useToast } from '@/components/ui/use-toast';
    import { useComponents } from '@/context/ComponentsContext';
    import Xarrow, { Xwrapper } from 'react-xarrows';
    
    const initialStatuses = [{
      id: 'pending',
      name: 'Laukiama',
      color: '#f97316'
    }, {
      id: 'producing',
      name: 'Gaminama',
      color: '#3b82f6'
    }, {
      id: 'completed',
      name: 'Baigta',
      color: '#22c55e'
    }, {
      id: 'paused',
      name: 'Sustabdyta',
      color: '#6b7280'
    }];
    
    const initialSubassemblies = {
          'cart': [{
            id: 'cart-1', name: 'Cart SA-10000170', status: 'producing', quantity: 1, targetQuantity: 1, position: { x: 100, y: 100 }, comments: [], children: ['control-unit-1'],
            components: [], category: 'cart'
          }],
          'control-unit': [{
            id: 'control-unit-1', name: 'Control unit SA-10000111', status: 'completed', quantity: 1, targetQuantity: 1, position: { x: 400, y: 100 }, comments: [], children: [],
            components: [{ componentId: 'comp-4', requiredQuantity: 1 }], category: 'control-unit'
          }],
           'cockpit': [],
           'bedside-main': [],
           'nurse-workstation': [],
           'bedside-adapter': []
        };

    const ProductionHierarchy = () => {
      const { toast } = useToast();
      const { addOrUpdateInventory, getComponentByName, subassemblies, setSubassemblies, categories, setCategories, updateComponentStock, updateSubassemblyQuantity } = useComponents();
      const canvasRef = useRef(null);
      const [zoom, setZoom] = useState(1);
      const [pan, setPan] = useState({ x: 0, y: 0 });
      const [isDragging, setIsDragging] = useState(false);
      const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
      const [selectedNode, setSelectedNode] = useState(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [activeCategory, setActiveCategory] = useState('cart');
      const [showAddDialog, setShowAddDialog] = useState(false);
      const [showImportDialog, setShowImportDialog] = useState(false);
      const [showUpdateDialog, setShowUpdateDialog] = useState(false);
      const [editingCategoryId, setEditingCategoryId] = useState(null);
      const [tempCategoryName, setTempCategoryName] = useState('');
      const [connectingMode, setConnectingMode] = useState(null);
      const [showStatusManager, setShowStatusManager] = useState(false);
      const [showAddCategory, setShowAddCategory] = useState(false);
      const [newCategoryName, setNewCategoryName] = useState('');
      const [filterZeroQuantity, setFilterZeroQuantity] = useState(false);
      const [filterHasComments, setFilterHasComments] = useState(false);
      const [showComponentListDialog, setShowComponentListDialog] = useState(false);
      const [nodeForComponents, setNodeForComponents] = useState(null);
      
      // NAUJOS FUNKCIJOS
      const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
      const [nodesLocked, setNodesLocked] = useState(false);

      const [statuses, setStatuses] = useState(() => {
        const saved = localStorage.getItem('production-statuses');
        return saved ? JSON.parse(saved) : initialStatuses;
      });
      
      useEffect(() => {
        const savedSubassemblies = localStorage.getItem('production-hierarchy');
        if (!savedSubassemblies) {
          localStorage.setItem('production-hierarchy', JSON.stringify(initialSubassemblies));
          setSubassemblies(initialSubassemblies);
        }
      }, [setSubassemblies]);

      const allSubassemblies = useMemo(() => Object.values(subassemblies).flat(), [subassemblies]);

      useEffect(() => {
        localStorage.setItem('production-hierarchy', JSON.stringify(subassemblies));
      }, [subassemblies]);

      useEffect(() => {
        localStorage.setItem('production-statuses', JSON.stringify(statuses));
      }, [statuses]);
      
      const handleEditCategoryName = id => {
        const category = categories.find(c => c.id === id);
        if (category) {
          setEditingCategoryId(id);
          setTempCategoryName(category.name);
        }
      };

      const handleSaveCategoryName = id => {
        if (tempCategoryName.trim()) {
          setCategories(prev => prev.map(c => c.id === id ? { ...c, name: tempCategoryName.trim() } : c));
          toast({ title: "Kategorija atnaujinta!", description: "Pavadinimas sėkmingai pakeistas." });
        } else {
          toast({ title: "Klaida", description: "Kategorijos pavadinimas negali būti tuščias.", variant: "destructive" });
        }
        setEditingCategoryId(null);
      };

      const handleAddNewCategory = () => {
        if (!newCategoryName.trim()) {
          toast({ title: "Klaida", description: "Kategorijos pavadinimas negali būti tuščias.", variant: "destructive" });
          return;
        }
        const newId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
        if (categories.some(c => c.id === newId)) {
          toast({ title: "Klaida", description: "Kategorija tokiu pavadinimu jau egzistuoja.", variant: "destructive" });
          return;
        }
        const colors = ['bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-cyan-500'];
        const newCategory = { id: newId, name: newCategoryName.trim(), color: colors[categories.length % colors.length] };
        setCategories(prev => [...prev, newCategory]);
        setSubassemblies(prev => ({ ...prev, [newId]: [] }));
        setNewCategoryName('');
        setShowAddCategory(false);
        toast({ title: "Produktas pridėtas!", description: `Sėkmingai pridėtas "${newCategory.name}".` });
        setActiveCategory(newId);
      };
      
      const handleDeleteCategory = (categoryId) => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;
        
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        setSubassemblies(prev => {
            const newState = { ...prev };
            delete newState[categoryId];
            return newState;
        });

        if (activeCategory === categoryId) {
            const remainingCategories = categories.filter(c => c.id !== categoryId);
            setActiveCategory(remainingCategories.length > 0 ? remainingCategories[0].id : '');
        }

        toast({
            title: "Produktas pašalintas",
            description: `Produktas "${categoryToDelete.name}" ir visi jo subasembliai buvo pašalinti.`
        });
      };

      const handleWheel = useCallback(e => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newZoom = Math.max(0.2, Math.min(3, zoom * zoomFactor));
        const panX = mouseX - (mouseX - pan.x) * zoomFactor;
        const panY = mouseY - (mouseY - pan.y) * zoomFactor;
        setZoom(newZoom);
        setPan({ x: panX, y: panY });
      }, [zoom, pan]);

      const handleMouseDown = useCallback(e => {
        if (e.target === canvasRef.current) {
          setIsDragging(true);
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
      }, [pan]);

      const handleMouseMove = useCallback(e => {
        if (isDragging) {
          setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
      }, [isDragging, dragStart]);

      const handleMouseUp = useCallback(() => {
        setIsDragging(false);
      }, []);

      const resetView = () => {
        setZoom(1);
        setPan({ x: 20, y: 20 });
        toast({ title: "Vaizdas atstatytas", description: "Grįžta į pradinę poziciją" });
      };

      const addSubassembly = (data, category = activeCategory) => {
        const newSubassembly = {
          id: `${category}-${Date.now()}`,
          ...data,
          position: { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
          children: data.children || [],
          components: data.components || [],
          category: category,
        };
        setSubassemblies(prev => ({ ...prev, [category]: [...(prev[category] || []), newSubassembly] }));
        toast({ title: "Subasemblis pridėtas!", description: `${data.name} sėkmingai pridėtas į ${category} kategoriją` });
        return newSubassembly.id;
      };

      const handleImportSubassemblyWithComponents = (data) => {
          addSubassembly({
              name: data.name,
              quantity: 0,
              targetQuantity: 1,
              status: 'pending',
              comments: ['Importuota iš Excel'],
              children: [],
              components: data.components
          }, activeCategory);
      };
      
      const handleImportQuantities = (updates) => {
        let updatedCount = 0;
        let notFoundCount = 0;

        updates.forEach(item => {
            const componentUpdated = updateComponentStock(item.name, item.quantity);
            if (componentUpdated) {
                updatedCount++;
                return;
            }
            const subassemblyUpdated = updateSubassemblyQuantity(item.name, item.quantity);
            if (subassemblyUpdated) {
                updatedCount++;
                return;
            }
            notFoundCount++;
        });

        toast({
            title: "Likučiai atnaujinti",
            description: `Sėkmingai atnaujinta ${updatedCount} įrašų. Nerasta: ${notFoundCount}.`
        });
      };
      
      const updateSubassembly = (id, updates) => {
        let categoryOfItem = null;
        for (const cat in subassemblies) {
            if (subassemblies[cat].some(s => s.id === id)) {
                categoryOfItem = cat;
                break;
            }
        }
        
        if (!categoryOfItem) return;

        setSubassemblies(prev => {
            const newSubassemblies = { ...prev };
            const items = newSubassemblies[categoryOfItem];
            if (items) {
                newSubassemblies[categoryOfItem] = items.map(i => i.id === id ? { ...i, ...updates } : i);
            }
            return newSubassemblies;
        });

        if (selectedNode?.id === id) {
            setSelectedNode(prev => ({ ...prev, ...updates }));
        }
        
        if (nodeForComponents?.id === id) {
            setNodeForComponents(prev => ({...prev, ...updates}));
        }
      };

      const deleteSubassembly = id => {
        let categoryOfItem = null;
        for (const cat in subassemblies) {
            if (subassemblies[cat].some(s => s.id === id)) {
                categoryOfItem = cat;
                break;
            }
        }
        
        if (!categoryOfItem) return;

        setSubassemblies(prev => {
          const newSubassemblies = { ...prev };
          newSubassemblies[categoryOfItem] = newSubassemblies[categoryOfItem].filter(item => item.id !== id);
          Object.keys(newSubassemblies).forEach(cat => {
            newSubassemblies[cat] = newSubassemblies[cat].map(parent => {
              if (parent.children?.includes(id)) {
                return { ...parent, children: parent.children.filter(childId => childId !== id) };
              }
              return parent;
            });
          });
          return newSubassemblies;
        });
        setSelectedNode(null);
        toast({ title: "Subasemblis pašalintas", description: "Elementas sėkmingai pašalintas iš hierarchijos" });
      };

      const handleNodeClick = node => {
        if (connectingMode) {
          if (connectingMode.sourceId === node.id) {
            toast({ title: "Klaida", description: "Negalima sujungti elemento su pačiu savimi.", variant: "destructive" });
            return;
          }
          let sourceCategory = null;
          for (const cat in subassemblies) {
              if(subassemblies[cat].some(s => s.id === connectingMode.sourceId)) {
                  sourceCategory = cat;
                  break;
              }
          }

          if(!sourceCategory) return;

          setSubassemblies(prev => {
              const newSubassemblies = { ...prev };
              const sourceNode = newSubassemblies[sourceCategory].find(item => item.id === connectingMode.sourceId);
              if (sourceNode) {
                  if (!sourceNode.children.includes(node.id)) {
                      sourceNode.children.push(node.id);
                  }
              }
              return newSubassemblies;
          });
          toast({ title: "Sujungta!", description: `Elementas prijungtas prie "${node.name}".` });
          setConnectingMode(null);
        } else {
          setSelectedNode(node);
        }
      };

      const startConnecting = sourceId => {
        setConnectingMode({ sourceId });
        setSelectedNode(null);
        toast({ title: "Sujungimo režimas", description: "Pasirinkite subasemblį, prie kurio norite prijungti." });
      };

      const openComponentList = (node) => {
        setNodeForComponents(node);
        setShowComponentListDialog(true);
      };

      const filteredSubassemblies = useMemo(() => {
        return (subassemblies[activeCategory] || [])
          .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .filter(item => !filterZeroQuantity || item.quantity === 0)
          .filter(item => !filterHasComments || (item.comments && item.comments.length > 0));
      }, [subassemblies, activeCategory, searchTerm, filterZeroQuantity, filterHasComments]);

      useEffect(() => {
        setPan({ x: 20, y: 20 });
      }, [activeCategory]);
      
      useEffect(() => {
        if (!categories.some(c => c.id === activeCategory)) {
            setActiveCategory(categories[0]?.id || '');
        }
      }, [categories, activeCategory]);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.addEventListener('wheel', handleWheel, { passive: false });
          return () => {
            canvas.removeEventListener('wheel', handleWheel);
          };
        }
      }, [handleWheel]);

      const getStatusById = id => statuses.find(s => s.id === id) || { name: 'Nežinoma', color: '#6b7280' };

      const activeCategoryName = useMemo(() => {
        return categories.find(c => c.id === activeCategory)?.name || activeCategory;
      }, [categories, activeCategory]);

      return (
        <div className="h-full flex bg-gradient-to-br from-slate-50 to-blue-50">
          {/* Sidebar */}
          <motion.div 
            className={`${sidebarCollapsed ? 'w-0' : 'w-80'} sidebar border-r flex flex-col z-20 bg-white/90 backdrop-blur-lg transition-all duration-300 overflow-hidden shadow-xl`}
            animate={{ width: sidebarCollapsed ? 0 : 320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h1 className="text-2xl font-bold">🏭 Gamybos Medis</h1>
              <p className="text-blue-100 mt-1">
                Produktų ir subasemblių valdymas
              </p>
            </div>

            <div className="p-4 border-b space-y-4 bg-white/50">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ieškoti subasemblių..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/80" />
                </div>
                 <Button variant="outline" size="icon" onClick={() => setShowUpdateDialog(true)} title="Atnaujinti likučius iš Excel" className="bg-white/80 hover:bg-white">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowStatusManager(true)} title="Valdyti būsenas" className="bg-white/80 hover:bg-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                      <Checkbox id="filter-zero" checked={filterZeroQuantity} onCheckedChange={setFilterZeroQuantity} />
                      <Label htmlFor="filter-zero" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Pagaminta 0 vnt.
                      </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox id="filter-comments" checked={filterHasComments} onCheckedChange={setFilterHasComments} />
                      <Label htmlFor="filter-comments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Turi komentarų
                      </Label>
                  </div>
              </div>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col min-h-0">
              <TabsList className="flex flex-wrap gap-2 m-4 h-auto bg-white/80">
                {categories.map(category => (
                  <TabsTrigger key={category.id} value={category.id} className="text-xs flex-grow">
                    <div className={`w-2 h-2 rounded-full ${category.color} mr-2`} />
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
                <div className="px-4 pb-4 border-b">
                    {showAddCategory ? (
                      <div className="space-y-2">
                            <Input placeholder="Naujo produkto pavadinimas" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus className="bg-white/80" />
                            <div className="flex gap-2">
                                <Button onClick={handleAddNewCategory} size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white">Pridėti</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowAddCategory(false)} className="bg-white/80">Atšaukti</Button>
                            </div>
                        </div>
                    ) : (
                      <Button onClick={() => setShowAddCategory(true)} variant="outline" className="w-full bg-white/80 hover:bg-white" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Pridėti produktą
                        </Button>
                    )}
                </div>
              <div className="flex-1 overflow-y-auto">
                  {categories.map(category => (
                    <TabsContent key={category.id} value={category.id} className="flex-1 px-4 mt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between group">
                          {editingCategoryId === category.id ? (
                            <Input 
                              type="text" 
                              value={tempCategoryName} 
                              onChange={e => setTempCategoryName(e.target.value)} 
                              onBlur={() => handleSaveCategoryName(category.id)} 
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveCategoryName(category.id);
                                if (e.key === 'Escape') setEditingCategoryId(null);
                              }} 
                              autoFocus 
                              className="h-8 font-semibold bg-white/80" 
                            />
                          ) : (
                            <h3 className="font-semibold cursor-pointer" onDoubleClick={() => handleEditCategoryName(category.id)}>
                                {category.name}
                            </h3>
                          )}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {subassemblies[category.id]?.length || 0} vnt.
                                </span>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Ar tikrai norite ištrinti produktą?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              Šis veiksmas negrįžtamas. Produktas "{category.name}" ir visi jo subasembliai bus visam laikui pašalinti.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Ištrinti</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button onClick={() => setShowAddDialog(true)} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Pridėti subasemblį
                            </Button>
                             <Button onClick={() => setShowImportDialog(true)} variant="outline" className="flex-1 bg-white/80 hover:bg-white" size="sm">
                              <FileUp className="h-4 w-4 mr-2" />
                              Importuoti
                            </Button>
                        </div>

                        <div className="space-y-2">
                          {filteredSubassemblies.filter(item => item.category === category.id).map(item => {
                            const status = getStatusById(item.status);
                            return (
                              <motion.div 
                                key={item.id} 
                                layout 
                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  selectedNode?.id === item.id 
                                    ? 'bg-blue-50 border-blue-200 shadow-md' 
                                    : 'hover:bg-gray-50 bg-white/60'
                                }`} 
                                onClick={() => handleNodeClick(item)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap mr-2">
                                    {item.name}
                                  </span>
                                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm`} style={{ backgroundColor: status.color }} />
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                  <span>Likutis: {item.quantity} vnt.</span>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      openComponentList(item); 
                                    }} 
                                    className="p-1 -m-1 rounded-full hover:bg-accent transition-colors"
                                  >
                                    <Component className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
              </div>
            </Tabs>
          </motion.div>

          {/* NAUJAS SIDEBAR TOGGLE MYGTUKAS */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 -right-4 z-30 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl border-2 hover:scale-110 transition-all duration-200"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 relative">
            <Xwrapper>
              <div 
                ref={canvasRef} 
                className={`w-full h-full hierarchy-canvas cursor-grab active:cursor-grabbing overflow-hidden ${connectingMode ? 'connecting-mode' : ''}`} 
                onMouseDown={handleMouseDown} 
                onMouseMove={handleMouseMove} 
                onMouseUp={handleMouseUp} 
                onMouseLeave={handleMouseUp}
              >
                <motion.div 
                  className="absolute top-0 left-0" 
                  style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                    transformOrigin: '0 0' 
                  }}
                >
                  <AnimatePresence>
                    {filteredSubassemblies.map(item => (
                      <SubassemblyNode 
                        key={item.id} 
                        subassembly={item} 
                        statuses={statuses} 
                        isSelected={selectedNode?.id === item.id} 
                        onClick={() => handleNodeClick(item)} 
                        onUpdate={updates => updateSubassembly(item.id, updates)} 
                        zoom={zoom} 
                        isConnectingTarget={connectingMode && connectingMode.sourceId !== item.id} 
                        isLocked={nodesLocked}
                      />
                    ))}
                  </AnimatePresence>
                   {/* PAGERINTI RYŠIAI */}
                   {allSubassemblies.map(item => 
                     item.children?.map(childId => {
                       const child = allSubassemblies.find(c => c.id === childId);
                       if (!child || !allSubassemblies.some(f => f.id === item.id) || !allSubassemblies.some(f => f.id === child.id)) return null;
                       return (
                         <Xarrow 
                           key={`${item.id}-${childId}`} 
                           start={item.id} 
                           end={childId} 
                           strokeWidth={Math.max(4, 5 / zoom)} 
                           color="#2563eb" 
                           path="smooth" 
                           showHead={true}
                           headSize={Math.max(8, 10 / zoom)}
                           startAnchor="right" 
                           endAnchor="left" 
                           zIndex={-1}
                           dashness={{ strokeLen: 0, nonStrokeLen: 0 }}
                           curveness={0.4}
                           _extendSVGcanvas={50}
                           passProps={{
                             style: {
                               filter: 'drop-shadow(0 4px 8px rgba(37, 99, 235, 0.3))'
                             }
                           }}
                         />
                       );
                     })
                   )}
                </motion.div>
              </div>
            </Xwrapper>

            {/* Control Buttons */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
                className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setZoom(prev => Math.max(0.2, prev * 0.8))}
                className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={resetView}
                className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {/* NAUJAS UŽRAKINIMO MYGTUKAS */}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setNodesLocked(!nodesLocked);
                  toast({ 
                    title: nodesLocked ? "Subasembliai atrakinti" : "Subasembliai užrakinti", 
                    description: nodesLocked ? "Dabar galite stumdyti subasemblius" : "Subasembliai užfiksuoti vietoje" 
                  });
                }}
                className={`shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 ${
                  nodesLocked 
                    ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200' 
                    : 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200'
                }`}
              >
                {nodesLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
            </div>

            {/* Connection Mode Indicator */}
            {connectingMode && (
              <div className="absolute top-4 left-4 z-10 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center backdrop-blur-sm">
                <p className="font-medium mr-4">🔗 Pasirinkite subasemblį, prie kurio norite prijungti.</p>
                <Button variant="destructive" size="sm" onClick={() => setConnectingMode(null)}>Atšaukti</Button>
              </div>
            )}

            {/* Zoom Indicator */}
            <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
              <span className="text-sm font-medium">🔍 {Math.round(zoom * 100)}%</span>
            </div>
            
            {/* NAUJAS LOCK STATUS INDICATOR */}
            {nodesLocked && (
              <div className="absolute bottom-4 left-4 z-10 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">🔒 Subasembliai užrakinti</span>
                </div>
              </div>
            )}
          </div>

          {/* Modals and Dialogs */}
          <AnimatePresence>
            {selectedNode && (
              <SubassemblyDetails 
                subassembly={selectedNode} 
                statuses={statuses} 
                onClose={() => setSelectedNode(null)} 
                onUpdate={updates => updateSubassembly(selectedNode.id, updates)} 
                onDelete={() => deleteSubassembly(selectedNode.id)} 
                onConnect={() => startConnecting(selectedNode.id)} 
                onShowComponents={() => openComponentList(selectedNode)} 
              />
            )}
          </AnimatePresence>

          <AddSubassemblyDialog 
            open={showAddDialog} 
            onOpenChange={setShowAddDialog} 
            onAdd={(data) => addSubassembly(data, activeCategory)} 
            category={activeCategoryName} 
            statuses={statuses} 
          />
          
          <ExcelImportDialog 
            open={showImportDialog} 
            onOpenChange={setShowImportDialog}
            onImportSubassemblyWithComponents={handleImportSubassemblyWithComponents}
            categoryName={activeCategoryName}
          />
          
          <ExcelUpdateDialog
            open={showUpdateDialog}
            onOpenChange={setShowUpdateDialog}
            onImport={handleImportQuantities}
          />
          
          <StatusManager 
            open={showStatusManager} 
            onOpenChange={setShowStatusManager} 
            statuses={statuses} 
            setStatuses={setStatuses} 
          />
          
          {nodeForComponents && (
              <ComponentListDialog
                key={nodeForComponents.id}
                open={showComponentListDialog}
                onOpenChange={setShowComponentListDialog}
                subassembly={nodeForComponents}
                onUpdateSubassembly={updateSubassembly}
              />
          )}
        </div>
      );
    };

    export default ProductionHierarchy;
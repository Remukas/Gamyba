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
  Bot,
  CheckCircle,
  Circle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize
} from 'lucide-react';
import SubassemblyNode from '@/components/SubassemblyNode';
import SubassemblyDetails from '@/components/SubassemblyDetails';
import AddSubassemblyDialog from '@/components/AddSubassemblyDialog';
import ComponentListDialog from '@/components/ComponentListDialog';
import StatusManager from '@/components/StatusManager';
import ExcelImportDialog from '@/components/ExcelImportDialog';
import ExcelUpdateDialog from '@/components/ExcelUpdateDialog';
import AIAssistant from '@/components/AIAssistant';
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
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Sveiki! Aš esu jūsų gamybos strategas. Galite klausti apie komponentus, subasemblius, atsargas ar gamybos planavimą. Pvz: "Kokios mano atsargos?" arba "Kas įeina į Cart SA-10000170?"' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState(null);
  const [connectionTarget, setConnectionTarget] = useState(null);
  
  // Zoom and pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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

  // Calculate progress for each category
  const categoryProgress = useMemo(() => {
    const progress = {};
    categories.forEach(category => {
      const categorySubassemblies = subassemblies[category.id] || [];
      const totalSubassemblies = categorySubassemblies.length;
      const completedSubassemblies = categorySubassemblies.filter(sa => sa.quantity > 0).length;
      
      const percentage = totalSubassemblies > 0 ? Math.round((completedSubassemblies / totalSubassemblies) * 100) : 0;
      
      progress[category.id] = {
        percentage,
        completed: completedSubassemblies,
        total: totalSubassemblies
      };
    });
    return progress;
  }, [categories, subassemblies]);

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
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      e.preventDefault();
    }
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      e.preventDefault();
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback((e) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(false);
      e.preventDefault();
    }
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

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
        x: 3800 + Math.random() * 400, 
        y: 2800 + Math.random() * 400 
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
        x: 3800 + Math.random() * 400, 
        y: 2800 + Math.random() * 400 
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

  // AI Chat Functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === '') return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 1500);
  };

  const generateAIResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();

    // Atsargų analizė
    if (lowerInput.includes('atsargos') || lowerInput.includes('likučiai') || lowerInput.includes('komponentai')) {
      const lowStockComponents = componentsInventory.filter(c => c.stock < 10);
      return {
        sender: 'ai',
        text: `Analizuoju jūsų atsargas. Turite ${componentsInventory.length} komponentų tipų. ${lowStockComponents.length > 0 ? `Dėmesio: ${lowStockComponents.length} komponentų turi mažas atsargas!` : 'Visų komponentų atsargos pakankamos.'}`,
        inventoryAnalysis: {
          lowStockComponents: lowStockComponents.map(c => ({ name: c.name, stock: c.stock, leadTime: c.leadTimeDays }))
        }
      };
    }

    // Sudėties užklausa
    if (lowerInput.includes('kas įeina') || lowerInput.includes('sudėtis')) {
      const targetName = lowerInput.replace(/kas įeina į|sudėtis/g, '').trim();
      const targetNode = Object.values(subassemblies).flat().find(sa => 
        sa.name.toLowerCase().includes(targetName)
      );

      if (targetNode && targetNode.components && targetNode.components.length > 0) {
        const componentDetails = targetNode.components.map(c => {
          const componentData = componentsInventory.find(inv => inv.id === c.componentId);
          return {
            name: componentData ? componentData.name : 'Nežinomas komponentas',
            quantity: c.requiredQuantity
          };
        });

        return {
          sender: 'ai',
          text: `Radau informaciją apie "${targetNode.name}":`,
          queryResult: {
            nodeName: targetNode.name,
            components: componentDetails
          }
        };
      }
    }

    // Statistikos analizė
    if (lowerInput.includes('statistika') || lowerInput.includes('progresą') || lowerInput.includes('kiek')) {
      const categoryStats = categories.map(category => {
        const categorySubassemblies = subassemblies[category.id] || [];
        const completed = categorySubassemblies.filter(sa => sa.quantity > 0).length;
        const total = categorySubassemblies.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { name: category.name, completed, total, percentage };
      });

      return {
        sender: 'ai',
        text: 'Štai jūsų gamybos statistika pagal kategorijas:',
        statisticsAnalysis: { categoryStats }
      };
    }

    // Gamybos planavimas
    if (lowerInput.includes('pagamink') || lowerInput.includes('sukurk') || lowerInput.includes('planuok')) {
      const quantityMatch = lowerInput.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
      
      return {
        sender: 'ai',
        text: `Supratau! Planuoju gamybos procesą ${quantity} vienetų. Štai preliminarus planas:`,
        plan: [
          { name: 'Pagrindinis subasemblis', targetQuantity: quantity },
          { name: 'Komponentų paruošimas', targetQuantity: quantity * 2 },
          { name: 'Surinkimas', targetQuantity: quantity }
        ]
      };
    }

    // Bendras atsakymas
    return {
      sender: 'ai',
      text: 'Galiu padėti su: atsargų analize, komponentų sudėtimi, gamybos statistika, planavimo klausimais. Pabandykite klausti: "Kokios mano atsargos?" arba "Kas įeina į [produkto pavadinimas]?"'
    };
  };

  const handleConfirmPlan = (plan) => {
    toast({
      title: "Planas patvirtintas!",
      description: "AI planas bus įgyvendintas gamybos sistemoje."
    });
    setShowAIAssistant(false);
  };

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

          {/* Category List with Progress */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {categories.map(category => {
                const categorySubassemblies = subassemblies[category.id] || [];
                const progress = categoryProgress[category.id] || { percentage: 0, completed: 0, total: 0 };
                
                return (
                  <div key={category.id}>
                    <div 
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                        selectedCategory === category.id 
                          ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-md' 
                          : 'hover:bg-gray-100 border-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {progress.percentage}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            {progress.completed}/{progress.total} subasemblių
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedCategory === category.id && (
                      <div className="ml-4 mt-2 space-y-1">
                        {categorySubassemblies.map(sa => {
                          const isCompleted = sa.quantity > 0;
                          return (
                            <div key={sa.id} className="flex items-center gap-2 text-xs text-gray-600 p-1 hover:bg-gray-50 rounded">
                              {isCompleted ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Circle className="h-3 w-3 text-gray-400" />
                              )}
                              <span className={isCompleted ? 'text-green-700 font-medium' : ''}>
                                {sa.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({sa.quantity} vnt.)
                              </span>
                            </div>
                          );
                        })}
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
              <div className="text-xs text-gray-600 mb-3">
                {currentCategorySubassemblies.length} vnt. • {categoryProgress[selectedCategory]?.percentage || 0}% baigta
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  Pridėti subasemblį
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowExcelImport(true)} className="whitespace-nowrap min-w-[120px] px-3">
                  Importuoti
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowExcelUpdate(true)} className="whitespace-nowrap min-w-[140px] px-3">
                  Atnaujinti likučius
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar Toggle Button */}
      <Button
        onClick={toggleSidebar}
        className={`fixed z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-xl border-0 rounded-full w-14 h-14 p-0 transition-all duration-300 flex items-center justify-center ${
          isSidebarCollapsed ? 'left-4 bottom-8' : 'left-[336px] bottom-8'
        }`}
        size="sm"
      >
        {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
      </Button>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* VIRŠUTINIAI MYGTUKAI - UŽRAKINTI IR PAGALBA */}
        <div className="absolute top-6 right-6 z-50 flex flex-col gap-4">
          <Button
            onClick={toggleLock}
            className={`${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-xl px-8 py-4 h-auto min-w-[200px] text-base font-semibold rounded-xl border-2 border-white`}
          >
            {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            {isLocked ? 'Užrakinta' : 'Atrakinta'}
          </Button>
          
          <Button
            onClick={() => setShowTutorial(true)}
            variant="outline"
            className="bg-white/95 backdrop-blur-sm hover:bg-white px-8 py-4 h-auto min-w-[200px] text-base font-semibold border-2 rounded-xl shadow-xl"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Pagalba
          </Button>
        </div>

        {/* ZOOM VALDYMO MYGTUKAI - CENTRE VIRŠUJE */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border-2">
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="outline"
            className="h-12 w-12 p-0 bg-white hover:bg-gray-50 border-2"
            title="Padidinti mastelį"
          >
            <ZoomIn className="h-6 w-6" />
          </Button>
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="outline"
            className="h-12 w-12 p-0 bg-white hover:bg-gray-50 border-2"
            title="Sumažinti mastelį"
          >
            <ZoomOut className="h-6 w-6" />
          </Button>
          <Button
            onClick={handleFitToScreen}
            size="sm"
            variant="outline"
            className="h-12 w-12 p-0 bg-white hover:bg-gray-50 border-2"
            title="Pritaikyti ekranui"
          >
            <Maximize className="h-6 w-6" />
          </Button>
          <Button
            onClick={handleResetView}
            size="sm"
            variant="outline"
            className="h-12 w-12 p-0 bg-white hover:bg-gray-50 border-2"
            title="Grįžti į pradinį vaizdą"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
          <div className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg border-2">
            {Math.round(zoom * 100)}%
          </div>
        </div>
        
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className={`w-full h-full hierarchy-canvas relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              width: '8000px',
              height: '6000px',
              left: '50%',
              top: '50%',
              marginLeft: '-4000px',
              marginTop: '-3000px'
            }}
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

        {/* PLŪDURIUOJANTIS AI CHAT DEŠINIAME KAMPE */}
        <div className="fixed bottom-8 right-8 z-50">
          {!showAIAssistant ? (
            <Button
              onClick={() => setShowAIAssistant(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 rounded-full w-20 h-20 p-0 border-4 border-white animate-pulse"
              title="AI Gamybos Asistentas"
            >
              <Bot className="h-10 w-10" />
            </Button>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-purple-300 w-[420px] h-[650px] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full animate-pulse">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">🤖 AI Gamybos Strategas</h3>
                    <p className="text-sm text-purple-100">Jūsų protingas asistentas</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAIAssistant(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <p>{msg.text}</p>
                      
                      {/* Render special content */}
                      {msg.queryResult && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-xs mb-2 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Sudėtis:
                          </h4>
                          <div className="bg-gray-50 p-2 rounded-lg text-xs">
                            {msg.queryResult.components.map((comp, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{comp.name}</span>
                                <span className="font-bold">{comp.quantity} vnt.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {msg.inventoryAnalysis && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-xs mb-2 text-red-600">⚠️ Mažos atsargos:</h4>
                          <div className="bg-red-50 p-2 rounded-lg text-xs">
                            {msg.inventoryAnalysis.lowStockComponents.slice(0, 3).map((comp, i) => (
                              <div key={i} className="flex justify-between text-red-700">
                                <span>{comp.name}</span>
                                <span>{comp.stock} vnt.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {msg.statisticsAnalysis && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-xs mb-2">📊 Statistika:</h4>
                          <div className="bg-blue-50 p-2 rounded-lg text-xs space-y-1">
                            {msg.statisticsAnalysis.categoryStats.map((cat, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{cat.name}</span>
                                <span className="font-bold text-blue-600">{cat.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {msg.plan && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-xs mb-2">🎯 Gamybos planas:</h4>
                          <div className="bg-green-50 p-2 rounded-lg text-xs max-h-32 overflow-y-auto">
                            {msg.plan.map((item, i) => (
                              <div key={i} className="mb-1">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-600 ml-2">({item.targetQuantity} vnt.)</span>
                              </div>
                            ))}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-2 text-xs h-7"
                            onClick={() => handleConfirmPlan(msg.plan)}
                          >
                            ✅ Patvirtinti planą
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm rounded-2xl p-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-xs text-gray-500">AI galvoja...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Klausti AI..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="text-sm"
                    disabled={isThinking}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={isThinking || input.trim() === ''}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                  <h4 className="font-semibold text-blue-600">Zoom Valdymas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Pelės ratukas - zoom in/out</li>
                    <li>+ mygtukas - padidinti</li>
                    <li>- mygtukas - sumažinti</li>
                    <li>⬜ mygtukas - pritaikyti ekranui</li>
                    <li>↻ mygtukas - grįžti į pradinį</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">Progreso Procentai:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Žalia progreso juosta prie kiekvienos kategorijos</li>
                    <li>Procentas skaičiuojamas pagal quantity > 0</li>
                    <li>✓ žalia varnelė = pagamintas subasemblis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600">Didelis Canvas Plotas:</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>8000×6000px plotas subasembliams</li>
                    <li>Galite stumdyti labai toli</li>
                    <li>Sumažinus mastelį - dar daugiau vietos</li>
                  </ul>
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

        <StatusManager
          open={showStatusManager}
          onOpenChange={setShowStatusManager}
          statuses={statuses}
          setStatuses={setStatuses}
        />

        <AIAssistant
          open={showAIAssistant}
          onOpenChange={setShowAIAssistant}
          onPlanConfirm={(plan) => {
            console.log('AI Plan:', plan);
          }}
          categories={categories}
          allSubassemblies={Object.values(subassemblies).flat()}
        />

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
    </div>
  );
};

export default ProductionHierarchy;
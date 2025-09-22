import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const ComponentsContext = createContext({
  componentsInventory: [],
  subassemblies: {},
  categories: [],
  isLoading: false,
  
  // Component functions
  addComponent: () => {},
  updateComponent: () => {},
  deleteComponent: () => {},
  getComponentByName: () => null,
  updateComponentStock: () => false,
  
  // Subassembly functions
  addSubassembly: () => {},
  updateSubassembly: () => {},
  deleteSubassembly: () => {},
  updateSubassemblyQuantity: () => false,
  
  // Category functions
  setCategories: () => {},
  
  // Helper functions
  getAllSubassembliesMap: () => new Map(),
  addOrUpdateInventory: () => {},
  
  // Setters (for compatibility)
  setComponentsInventory: () => {},
  setSubassemblies: () => {}
});

export const useComponents = () => useContext(ComponentsContext);

// Pradiniai duomenys
const initialCategories = [
  { id: 'cart', name: 'Cart', color: 'bg-blue-500', isVisible: true },
  { id: 'control-unit', name: 'Control Unit', color: 'bg-green-500', isVisible: true },
  { id: 'frame', name: 'Frame', color: 'bg-purple-500', isVisible: true },
  { id: 'wheels', name: 'Wheels', color: 'bg-orange-500', isVisible: true }
];

const initialComponents = [
  { id: 'comp-1', name: 'Steel Plate 10mm', stock: 25, leadTimeDays: 14 },
  { id: 'comp-2', name: 'Aluminum Profile 40x40', stock: 50, leadTimeDays: 7 },
  { id: 'comp-3', name: 'Bearing 6204', stock: 8, leadTimeDays: 21 },
  { id: 'comp-4', name: 'Motor 24V', stock: 12, leadTimeDays: 28 },
  { id: 'comp-5', name: 'Control Board PCB', stock: 15, leadTimeDays: 35 },
  { id: 'comp-6', name: 'Wheel Assembly', stock: 20, leadTimeDays: 14 },
  { id: 'comp-7', name: 'Bolt M8x25', stock: 100, leadTimeDays: 3 },
  { id: 'comp-8', name: 'Nut M8', stock: 150, leadTimeDays: 3 },
  { id: 'comp-9', name: 'Washer M8', stock: 200, leadTimeDays: 3 },
  { id: 'comp-10', name: 'Cable 2.5mm²', stock: 45, leadTimeDays: 10 }
];

const initialSubassemblies = {
  'cart': [
    {
      id: 'cart-sa-1',
      name: 'Cart SA-10000170',
      quantity: 5,
      targetQuantity: 10,
      status: 'in_progress',
      position: { x: 300, y: 200 },
      children: ['cart-sa-2', 'cart-sa-3'],
      components: [
        { componentId: 'comp-1', requiredQuantity: 2 },
        { componentId: 'comp-7', requiredQuantity: 8 }
      ],
      category: 'cart',
      comments: ['Pagrindinis cart subasemblis', 'Reikia patikrinti matmenis']
    },
    {
      id: 'cart-sa-2',
      name: 'Base Frame',
      quantity: 8,
      targetQuantity: 10,
      status: 'completed',
      position: { x: 100, y: 350 },
      children: [],
      components: [
        { componentId: 'comp-2', requiredQuantity: 4 },
        { componentId: 'comp-7', requiredQuantity: 12 }
      ],
      category: 'cart',
      comments: []
    },
    {
      id: 'cart-sa-3',
      name: 'Top Assembly',
      quantity: 3,
      targetQuantity: 10,
      status: 'pending',
      position: { x: 500, y: 350 },
      children: [],
      components: [
        { componentId: 'comp-1', requiredQuantity: 1 },
        { componentId: 'comp-8', requiredQuantity: 6 }
      ],
      category: 'cart',
      comments: ['Laukia medžiagų']
    }
  ],
  'control-unit': [
    {
      id: 'control-sa-1',
      name: 'Control unit SA-10000111',
      quantity: 2,
      targetQuantity: 5,
      status: 'in_progress',
      position: { x: 250, y: 180 },
      children: ['control-sa-2'],
      components: [
        { componentId: 'comp-5', requiredQuantity: 1 },
        { componentId: 'comp-10', requiredQuantity: 3 }
      ],
      category: 'control-unit',
      comments: ['Elektronikos modulis']
    },
    {
      id: 'control-sa-2',
      name: 'Power Module',
      quantity: 0,
      targetQuantity: 5,
      status: 'pending',
      position: { x: 150, y: 320 },
      children: [],
      components: [
        { componentId: 'comp-4', requiredQuantity: 1 },
        { componentId: 'comp-10', requiredQuantity: 2 }
      ],
      category: 'control-unit',
      comments: []
    }
  ],
  'frame': [
    {
      id: 'frame-sa-1',
      name: 'Main Frame Assembly',
      quantity: 1,
      targetQuantity: 3,
      status: 'in_progress',
      position: { x: 200, y: 200 },
      children: [],
      components: [
        { componentId: 'comp-2', requiredQuantity: 8 },
        { componentId: 'comp-3', requiredQuantity: 4 },
        { componentId: 'comp-7', requiredQuantity: 16 }
      ],
      category: 'frame',
      comments: ['Pagrindinis rėmas']
    }
  ],
  'wheels': [
    {
      id: 'wheels-sa-1',
      name: 'Wheel Assembly Set',
      quantity: 0,
      targetQuantity: 4,
      status: 'pending',
      position: { x: 180, y: 160 },
      children: [],
      components: [
        { componentId: 'comp-6', requiredQuantity: 4 },
        { componentId: 'comp-3', requiredQuantity: 8 }
      ],
      category: 'wheels',
      comments: []
    }
  ]
};

export const ComponentsProvider = ({ children }) => {
  const { toast } = useToast();
  
  // Lokalus duomenų saugojimas
  const [componentsInventory, setComponentsInventory] = useState(() => {
    const saved = localStorage.getItem('components-inventory');
    return saved ? JSON.parse(saved) : initialComponents;
  });
  
  const [subassemblies, setSubassemblies] = useState(() => {
    const saved = localStorage.getItem('subassemblies');
    return saved ? JSON.parse(saved) : initialSubassemblies;
  });
  
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Filtruoti kategorijas pagal matomumą (tik ne-adminams)
  const visibleCategories = useMemo(() => {
    // Jei vartotojas yra admin, rodyti visas kategorijas
    // Kitaip rodyti tik matomus
    return categories.filter(category => category.isVisible);
  }, [categories]);

  // Funkcija kategorijos matomumo perjungimui (tik adminams)
  const toggleCategoryVisibility = useCallback((categoryId) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, isVisible: !cat.isVisible }
        : cat
    ));
  }, []);

  // Funkcija naujos kategorijos pridėjimui
  const addCategory = useCallback((categoryData) => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      isVisible: true,
      ...categoryData
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  // Funkcija kategorijos atnaujinimui
  const updateCategory = useCallback((categoryId, updates) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  }, []);

  // Funkcija kategorijos šalinimui
  const deleteCategory = useCallback((categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  }, []);
  // Išsaugoti duomenis į localStorage
  useEffect(() => {
    localStorage.setItem('components-inventory', JSON.stringify(componentsInventory));
  }, [componentsInventory]);

  useEffect(() => {
    localStorage.setItem('subassemblies', JSON.stringify(subassemblies));
  }, [subassemblies]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // Component management functions
  const addComponent = useCallback((componentData) => {
    const newComponent = {
      id: `comp-${Date.now()}`,
      ...componentData
    };
    setComponentsInventory(prev => [...prev, newComponent]);
    return newComponent;
  }, []);

  const updateComponent = useCallback((id, updates) => {
    setComponentsInventory(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  const deleteComponent = useCallback((id) => {
    setComponentsInventory(prev => prev.filter(c => c.id !== id));
  }, []);

  // Subassembly management functions
  const addSubassembly = useCallback((categoryId, subassemblyData) => {
    const newSubassembly = {
      id: `${categoryId}-${Date.now()}`,
      name: subassemblyData.name,
      quantity: subassemblyData.quantity || 0,
      targetQuantity: subassemblyData.targetQuantity || 1,
      status: subassemblyData.status || 'pending',
      position: subassemblyData.position || { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 },
      children: [],
      components: subassemblyData.components || [],
      category: categoryId,
      comments: subassemblyData.comments || []
    };
    
    setSubassemblies(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newSubassembly]
    }));
    
    return newSubassembly;
  }, []);

  const updateSubassembly = useCallback((id, updates) => {
    setSubassemblies(prev => {
      const newSubassemblies = { ...prev };
      for (const categoryId in newSubassemblies) {
        const index = newSubassemblies[categoryId].findIndex(sa => sa.id === id);
        if (index !== -1) {
          newSubassemblies[categoryId][index] = {
            ...newSubassemblies[categoryId][index],
            ...updates
          };
          break;
        }
      }
      return newSubassemblies;
    });
  }, []);

  const deleteSubassembly = useCallback((id) => {
    setSubassemblies(prev => {
      const newSubassemblies = { ...prev };
      for (const categoryId in newSubassemblies) {
        newSubassemblies[categoryId] = newSubassemblies[categoryId].filter(sa => sa.id !== id);
        // Also remove from children arrays
        newSubassemblies[categoryId].forEach(sa => {
          if (sa.children) {
            sa.children = sa.children.filter(childId => childId !== id);
          }
        });
      }
      return newSubassemblies;
    });
  }, []);

  // Helper functions
  const getAllSubassembliesMap = useCallback(() => {
    const map = new Map();
    Object.values(subassemblies).flat().forEach(sa => map.set(sa.id, sa));
    return map;
  }, [subassemblies]);

  const getComponentByName = useCallback((name) => {
    return componentsInventory.find(c => c.name.toLowerCase() === name.toLowerCase());
  }, [componentsInventory]);

  const updateComponentStock = useCallback((name, stock) => {
    const component = getComponentByName(name);
    if (component) {
      updateComponent(component.id, { stock });
      return true;
    }
    return false;
  }, [getComponentByName, updateComponent]);

  const updateSubassemblyQuantity = useCallback((name, quantity) => {
    const allSAs = Object.values(subassemblies).flat();
    const subassembly = allSAs.find(sa => sa.name.toLowerCase() === name.toLowerCase());
    if (subassembly) {
      updateSubassembly(subassembly.id, { quantity });
      return true;
    }
    return false;
  }, [subassemblies, updateSubassembly]);

  const addOrUpdateInventory = useCallback((items) => {
    items.forEach(item => {
      const existing = getComponentByName(item.name);
      if (existing) {
        updateComponent(existing.id, { stock: item.stock });
      } else {
        addComponent({
          name: item.name,
          stock: item.stock,
          leadTimeDays: 0
        });
      }
    });
  }, [getComponentByName, updateComponent, addComponent]);

  const value = {
    componentsInventory,
    subassemblies,
    categories,
    visibleCategories,
    isLoading,
    
    // Component functions
    addComponent,
    updateComponent,
    deleteComponent,
    getComponentByName,
    updateComponentStock,
    
    // Subassembly functions
    addSubassembly,
    updateSubassembly,
    deleteSubassembly,
    updateSubassemblyQuantity,
    
    // Category functions
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryVisibility,
    
    // Helper functions
    getAllSubassembliesMap,
    addOrUpdateInventory,
    
    // Setters (for compatibility)
    setComponentsInventory,
    setSubassemblies
  };

  return (
    <ComponentsContext.Provider value={value}>
      {children}
    </ComponentsContext.Provider>
  );
};
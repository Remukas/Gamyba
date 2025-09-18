import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  categoriesAPI, 
  componentsAPI, 
  subassembliesAPI,
  productionHistoryAPI 
} from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const ComponentsContext = createContext();

export const useComponents = () => useContext(ComponentsContext);

export const ComponentsProvider = ({ children }) => {
  const { toast } = useToast();
  const [componentsInventory, setComponentsInventory] = useState([]);
  const [subassemblies, setSubassemblies] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load categories
      const categoriesData = await categoriesAPI.getCategories();
      setCategories(categoriesData);
      
      // Load components
      const componentsData = await componentsAPI.getComponents();
      setComponentsInventory(componentsData);
      
      // Load subassemblies
      const subassembliesData = await subassembliesAPI.getSubassemblies();
      
      // Group subassemblies by category
      const groupedSubassemblies = {};
      categoriesData.forEach(cat => {
        groupedSubassemblies[cat.id] = [];
      });
      
      subassembliesData.forEach(sa => {
        if (sa.category_id && groupedSubassemblies[sa.category_id]) {
          // Transform database format to frontend format
          const transformedSA = {
            id: sa.id,
            name: sa.name,
            quantity: sa.quantity || 0,
            targetQuantity: sa.target_quantity || 1,
            status: sa.status || 'pending',
            position: { x: sa.position_x || 200, y: sa.position_y || 150 },
            category: sa.category_id,
            children: [], // Will be populated from parent_id relationships
            components: (sa.components || []).map(comp => ({
              componentId: comp.component.id,
              requiredQuantity: comp.required_quantity
            })),
            comments: (sa.comments || []).map(comment => comment.comment)
          };
          
          groupedSubassemblies[sa.category_id].push(transformedSA);
        }
      });
      
      // Build parent-child relationships
      subassembliesData.forEach(sa => {
        if (sa.parent_id) {
          // Find parent in grouped data and add this as child
          Object.values(groupedSubassemblies).forEach(categorySubassemblies => {
            const parent = categorySubassemblies.find(p => p.id === sa.parent_id);
            if (parent && !parent.children.includes(sa.id)) {
              parent.children.push(sa.id);
            }
          });
        }
      });
      
      setSubassemblies(groupedSubassemblies);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko įkelti duomenų iš duomenų bazės.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Component management functions
  const addComponent = async (componentData) => {
    try {
      const newComponent = await componentsAPI.createComponent(componentData);
      setComponentsInventory(prev => [...prev, newComponent]);
      return newComponent;
    } catch (error) {
      console.error('Error adding component:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti komponento.",
        variant: "destructive"
      });
    }
  };

  const updateComponent = async (id, updates) => {
    try {
      const updatedComponent = await componentsAPI.updateComponent(id, updates);
      setComponentsInventory(prev => 
        prev.map(c => c.id === id ? updatedComponent : c)
      );
      return updatedComponent;
    } catch (error) {
      console.error('Error updating component:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti komponento.",
        variant: "destructive"
      });
    }
  };

  const deleteComponent = async (id) => {
    try {
      await componentsAPI.deleteComponent(id);
      setComponentsInventory(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting component:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti komponento.",
        variant: "destructive"
      });
    }
  };

  // Subassembly management functions
  const addSubassembly = async (categoryId, subassemblyData) => {
    try {
      const newSubassembly = await subassembliesAPI.createSubassembly({
        ...subassemblyData,
        category_id: categoryId,
        position_x: subassemblyData.position?.x || 200,
        position_y: subassemblyData.position?.y || 150
      });
      
      // Transform to frontend format
      const transformedSA = {
        id: newSubassembly.id,
        name: newSubassembly.name,
        quantity: newSubassembly.quantity || 0,
        targetQuantity: newSubassembly.target_quantity || 1,
        status: newSubassembly.status || 'pending',
        position: { x: newSubassembly.position_x, y: newSubassembly.position_y },
        category: newSubassembly.category_id,
        children: [],
        components: [],
        comments: []
      };
      
      setSubassemblies(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), transformedSA]
      }));
      
      return transformedSA;
    } catch (error) {
      console.error('Error adding subassembly:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko pridėti subasemblio.",
        variant: "destructive"
      });
    }
  };

  const updateSubassembly = async (id, updates) => {
    try {
      const dbUpdates = {
        ...updates,
        position_x: updates.position?.x,
        position_y: updates.position?.y,
        target_quantity: updates.targetQuantity
      };
      
      // Remove frontend-specific fields
      delete dbUpdates.position;
      delete dbUpdates.targetQuantity;
      delete dbUpdates.children;
      delete dbUpdates.category;
      
      const updatedSubassembly = await subassembliesAPI.updateSubassembly(id, dbUpdates);
      
      // Update local state
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
      
      return updatedSubassembly;
    } catch (error) {
      console.error('Error updating subassembly:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko atnaujinti subasemblio.",
        variant: "destructive"
      });
    }
  };

  const deleteSubassembly = async (id) => {
    try {
      await subassembliesAPI.deleteSubassembly(id);
      
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
    } catch (error) {
      console.error('Error deleting subassembly:', error);
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti subasemblio.",
        variant: "destructive"
      });
    }
  };

  // Helper functions
  const getAllSubassembliesMap = useCallback(() => {
    const map = new Map();
    Object.values(subassemblies).flat().forEach(sa => map.set(sa.id, sa));
    return map;
  }, [subassemblies]);

  const getComponentByName = (name) => {
    return componentsInventory.find(c => c.name.toLowerCase() === name.toLowerCase());
  };

  const updateComponentStock = async (name, stock) => {
    const component = getComponentByName(name);
    if (component) {
      await updateComponent(component.id, { stock });
      return true;
    }
    return false;
  };

  const updateSubassemblyQuantity = async (name, quantity) => {
    const allSAs = Object.values(subassemblies).flat();
    const subassembly = allSAs.find(sa => sa.name.toLowerCase() === name.toLowerCase());
    if (subassembly) {
      await updateSubassembly(subassembly.id, { quantity });
      return true;
    }
    return false;
  };

  // Legacy compatibility functions
  const addOrUpdateInventory = async (items) => {
    for (const item of items) {
      const existing = getComponentByName(item.name);
      if (existing) {
        await updateComponent(existing.id, { stock: item.stock });
      } else {
        await addComponent({
          name: item.name,
          stock: item.stock,
          lead_time_days: 0
        });
      }
    }
  };

  const value = {
    componentsInventory,
    subassemblies,
    categories,
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
    
    // Helper functions
    getAllSubassembliesMap,
    addOrUpdateInventory,
    
    // Legacy setters (for compatibility)
    setComponentsInventory,
    setSubassemblies,
    
    // Reload function
    loadData
  };

  return (
    <ComponentsContext.Provider value={value}>
      {children}
    </ComponentsContext.Provider>
  );
};
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

    const ComponentsContext = createContext();

    export const useComponents = () => useContext(ComponentsContext);

    const initialInventory = [
        { id: 'comp-1', name: 'Variklio korpusas', stock: 50, leadTimeDays: 7 },
        { id: 'comp-2', name: 'Cilindro galvutė', stock: 40, leadTimeDays: 10 },
        { id: 'comp-3', name: 'Stūmoklis', stock: 100, leadTimeDays: 5 },
        { id: 'comp-4', name: 'Valdymo mikroschema', stock: 0, leadTimeDays: 30 },
        { id: 'comp-5', name: 'Sensorius v1', stock: 150, leadTimeDays: 3 },
        { id: 'comp-6', name: 'Pneumatinis vožtuvas', stock: 80, leadTimeDays: 14 },
        { id: 'comp-7', name: 'Hidraulinė pompa', stock: 10, leadTimeDays: 21 },
    ];
    
    const initialCategories = [{ id: 'cart', name: 'Cart SA-10000170', color: 'bg-blue-500' }, { id: 'control-unit', name: 'Control unit SA-10000111', color: 'bg-green-500' }, { id: 'cockpit', name: 'Cockpit SEN-1-ME-10001124', color: 'bg-yellow-500' }, { id: 'bedside-main', name: 'Bedside unit main SA-10000296', color: 'bg-purple-500' }, { id: 'nurse-workstation', name: 'Nurse Workstation SA-10000478', color: 'bg-pink-500' }, { id: 'bedside-adapter', name: 'Bedside unit adapter SA-10000401 & SA-10000404', color: 'bg-orange-500' }];


    export const ComponentsProvider = ({ children }) => {
        const [componentsInventory, setComponentsInventory] = useState(() => {
            const saved = localStorage.getItem('components-inventory');
            return saved ? JSON.parse(saved) : initialInventory;
        });

        const [subassemblies, setSubassemblies] = useState(() => {
            const saved = localStorage.getItem('production-hierarchy');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                return typeof parsed === 'object' && parsed !== null ? parsed : {};
              } catch (e) {
                return {};
              }
            }
            return {};
        });
        
        const [categories, setCategories] = useState(() => {
            const saved = localStorage.getItem('production-categories');
            return saved ? JSON.parse(saved) : initialCategories;
        });

        useEffect(() => {
            localStorage.setItem('components-inventory', JSON.stringify(componentsInventory));
        }, [componentsInventory]);
        
        useEffect(() => {
            localStorage.setItem('production-categories', JSON.stringify(categories));
        }, [categories]);
        
        useEffect(() => {
            const handleStorageChange = () => {
                const savedSubassemblies = localStorage.getItem('production-hierarchy');
                const parsedSubassemblies = savedSubassemblies ? JSON.parse(savedSubassemblies) : {};
                setSubassemblies(parsedSubassemblies);

                const savedCategories = localStorage.getItem('production-categories');
                const parsedCategories = savedCategories ? JSON.parse(savedCategories) : initialCategories;
                setCategories(parsedCategories);
            };

            window.addEventListener('storage', handleStorageChange);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
            };
        }, []);

        const getAllSubassembliesMap = useCallback(() => {
            const map = new Map();
            if (!subassemblies) return map;
            Object.values(subassemblies).flat().forEach(sa => map.set(sa.id, sa));
            return map;
        }, [subassemblies]);

        const addOrUpdateInventory = (items) => {
            setComponentsInventory(prevInventory => {
                const newInventory = [...prevInventory];
                items.forEach(item => {
                    const existingIndex = newInventory.findIndex(invItem => invItem.name.toLowerCase() === item.name.toLowerCase());
                    if (existingIndex !== -1) {
                        newInventory[existingIndex] = { ...newInventory[existingIndex], stock: item.stock };
                    } else {
                        newInventory.push({
                            id: `comp-${Date.now()}-${Math.random()}`,
                            name: item.name,
                            stock: item.stock,
                            leadTimeDays: 0
                        });
                    }
                });
                return newInventory;
            });
        };
        
        const getComponentByName = (name) => {
            return componentsInventory.find(c => c.name.toLowerCase() === name.toLowerCase());
        };
        
        const addComponent = (component) => {
            const newComponent = {
                ...component,
                id: `comp-${Date.now()}-${Math.random()}`
            };
            setComponentsInventory(prev => [...prev, newComponent]);
        };

        const updateComponent = (id, updates) => {
            setComponentsInventory(prev => 
                prev.map(c => c.id === id ? { ...c, ...updates } : c)
            );
        };

        const deleteComponent = (id) => {
            setComponentsInventory(prev => prev.filter(c => c.id !== id));
        };
        
        const updateComponentStock = (name, stock) => {
            let updated = false;
            setComponentsInventory(prev => {
                const newInventory = prev.map(c => {
                    if (c.name.toLowerCase() === name.toLowerCase()) {
                        updated = true;
                        return { ...c, stock: stock };
                    }
                    return c;
                });
                return newInventory;
            });
            return updated;
        };

        const updateSubassemblyQuantity = (name, quantity) => {
            let updated = false;
            setSubassemblies(prev => {
                const newSubassemblies = { ...prev };
                for (const category in newSubassemblies) {
                    newSubassemblies[category] = newSubassemblies[category].map(sa => {
                        if (sa.name.toLowerCase() === name.toLowerCase()) {
                            updated = true;
                            return { ...sa, quantity: quantity };
                        }
                        return sa;
                    });
                }
                return newSubassemblies;
            });
            return updated;
        };


        const value = {
            componentsInventory,
            addOrUpdateInventory,
            getComponentByName,
            setComponentsInventory,
            addComponent,
            updateComponent,
            deleteComponent,
            subassemblies,
            setSubassemblies,
            categories, 
            setCategories,
            updateComponentStock,
            updateSubassemblyQuantity,
            getAllSubassembliesMap,
        };

        return (
            <ComponentsContext.Provider value={value}>
                {children}
            </ComponentsContext.Provider>
        );
    };
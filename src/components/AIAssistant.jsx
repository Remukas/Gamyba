import React, { useState, useRef, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Bot, Send, User, Check, Sparkles, ChevronRight, ShoppingCart, BrainCircuit, Info } from 'lucide-react';
    import { useComponents } from '@/context/ComponentsContext';

    const AIAssistant = ({ open, onOpenChange, onPlanConfirm, categories, allSubassemblies }) => {
        const [messages, setMessages] = useState([
            { sender: 'ai', text: 'Sveiki! Aš esu jūsų gamybos strategas. Dabar aš suprantu jūsų unikalią gamybos struktūrą. Klauskite manęs apie subasemblius arba nurodykite, ką norite pagaminti.' }
        ]);
        const [input, setInput] = useState('');
        const [isThinking, setIsThinking] = useState(false);
        const messagesEndRef = useRef(null);
        const { componentsInventory } = useComponents();

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        useEffect(scrollToBottom, [messages]);

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
        
        const findCategoryOfSubassembly = (subassemblyId) => {
            for (const category of categories) {
                const found = allSubassemblies.find(s => s.id === subassemblyId && s.category === category.id);
                if(found) return category.id;
            }
            const item = allSubassemblies.find(s => s.id === subassemblyId);
            return item?.category || 'unknown';
        };

        const generateAIResponse = (userInput) => {
            const lowerInput = userInput.toLowerCase();

            if (lowerInput.includes('kas įeina') || lowerInput.includes('komponentai') || lowerInput.includes('sudėtis')) {
                return handleQueryIntent(userInput);
            }
            
            return handleProductionIntent(userInput);
        };
        
        const handleQueryIntent = (userInput) => {
            const lowerInput = userInput.toLowerCase();
            const queryKeywords = ['kas įeina į', 'kokie komponentai yra', 'parodyk sudėtį'];
            let targetName = lowerInput;
            for (const keyword of queryKeywords) {
                if (targetName.includes(keyword)) {
                    targetName = targetName.replace(keyword, '').trim();
                }
            }

            const targetNode = allSubassemblies.find(node => node.name && node.name.toLowerCase().includes(targetName));

            if (!targetNode) {
                return {
                    sender: 'ai',
                    text: `Atsiprašau, neradau subasemblio, pavadinto panašiai į "${targetName}". Patikslinkite pavadinimą.`
                };
            }

            if (!targetNode.components || targetNode.components.length === 0) {
                return {
                    sender: 'ai',
                    text: `Subasemblis "${targetNode.name}" neturi jam priskirtų komponentų.`
                };
            }
            
            const componentDetails = targetNode.components.map(c => {
                 const componentData = componentsInventory.find(inv => inv.id === c.componentId);
                 return {
                     name: componentData ? componentData.name : 'Nežinomas komponentas',
                     quantity: c.requiredQuantity
                 };
            });

            return {
                sender: 'ai',
                text: `Radau informaciją apie subasemblį "${targetNode.name}":`,
                queryResult: {
                    nodeName: targetNode.name,
                    components: componentDetails
                }
            };
        };
        
        const handleProductionIntent = (userInput) => {
             const lowerInput = userInput.toLowerCase();
            const quantityMatch = lowerInput.match(/(\d+)/);
            const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

            const allNodes = allSubassemblies;
            const childIds = new Set(allNodes.filter(node => node && node.children).flatMap(node => node.children));
            const rootNodes = allNodes.filter(node => node && node.id && !childIds.has(node.id));

            const targetNodeName = lowerInput.replace(/(\d+)/, '').replace('sukurk', '').replace('pagamink', '').trim();
            
            if (!targetNodeName) {
                return {
                    sender: 'ai',
                    text: 'Nurodykite, kurį produktą norite pagaminti, pvz., "Pagamink 10 Cart".'
                };
            }
            
            const targetRootNode = rootNodes.find(node => node.name && node.name.toLowerCase().includes(targetNodeName));

            if (!targetRootNode) {
                return {
                    sender: 'ai',
                    text: `Atsiprašau, neradau galutinio produkto, pavadinto panašiai į "${targetNodeName}". Galimi galutiniai produktai yra: ${rootNodes.filter(n => n.name).map(n => `"${n.name}"`).join(', ')}. Prašau patikslinkite.`
                };
            }

            const plan = [];
            const requiredComponents = {};
            const nodesToProcess = [{ id: targetRootNode.id, parentId: null }];
            const processedIds = new Set();

            while (nodesToProcess.length > 0) {
                const { id } = nodesToProcess.shift();
                if (processedIds.has(id)) continue;

                const node = allNodes.find(n => n.id === id);
                if (!node) continue;

                processedIds.add(id);

                const planItem = {
                    id: node.id,
                    name: node.name,
                    category: findCategoryOfSubassembly(node.id),
                    children: node.children || [],
                    components: node.components || [],
                    targetQuantity: quantity,
                };
                plan.push(planItem);

                if (node.components) {
                    node.components.forEach(component => {
                        const componentData = componentsInventory.find(c => c.id === component.componentId);
                        if (componentData && componentData.name) {
                             const totalNeeded = component.requiredQuantity * quantity;
                            if (requiredComponents[componentData.name]) {
                                requiredComponents[componentData.name] += totalNeeded;
                            } else {
                                requiredComponents[componentData.name] = totalNeeded;
                            }
                        }
                    });
                }

                if (node.children) {
                    node.children.forEach(childId => {
                        nodesToProcess.push({ id: childId, parentId: id });
                    });
                }
            }

            return {
                sender: 'ai',
                text: `Gerai, supratau. Planuoju pagaminti ${quantity} vnt. "${targetRootNode.name}". Išanalizavau jūsų gamybos struktūrą ir paruošiau planą:`,
                plan: plan,
                blueprintName: targetRootNode.name,
                requiredComponents: requiredComponents,
                analysis: {
                    rootNodes: rootNodes.filter(n => n.name).map(n => n.name)
                }
            };
        };
        
        const renderPlan = (plan) => {
            const planMap = new Map(plan.map(p => [p.id, p]));
            const rootNodes = plan.filter(p => !plan.some(parent => parent.children.includes(p.id)));

            const findCategoryName = (categoryId) => {
                 const category = categories.find(c => c.id === categoryId);
                 return category ? category.name : categoryId;
            };

            const buildTree = (nodes) => {
                return nodes.map((node) => {
                    if (!node) return null;
                    const children = (node.children || []).map(childId => planMap.get(childId)).filter(Boolean);
                    const categoryName = findCategoryName(node.category);
                    const componentList = (node.components || []).map(c => {
                        const compData = componentsInventory.find(inv => inv.id === c.componentId);
                        return { name: compData?.name || 'N/A', quantity: c.requiredQuantity };
                    }).filter(c => c.name !== 'N/A');

                    return (
                        <li key={node.id}>
                            <div className="flex items-center text-sm">
                                {children.length > 0 && <ChevronRight className="h-4 w-4 mr-1 text-gray-400" />}
                                <span>{node.name} <span className="text-gray-500">({categoryName})</span></span>
                            </div>
                            {componentList.length > 0 && (
                                <ul className="pl-5 text-xs text-gray-600">
                                    {componentList.map(c => <li key={c.name}>- {c.name} ({c.quantity} vnt./vnt.)</li>)}
                                </ul>
                            )}
                            {children.length > 0 && <ul className="pl-5">{buildTree(children)}</ul>}
                        </li>
                    );
                });
            };
            
            return <ul className="space-y-1">{buildTree(rootNodes)}</ul>;
        };


        const handleConfirmPlan = (plan) => {
            onPlanConfirm(plan);
            onOpenChange(false);
        };

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] p-0 border-0 bg-transparent shadow-2xl">
                    <div className="flex flex-col h-[700px] bg-white rounded-lg overflow-hidden">
                        <DialogHeader className="p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-full text-white">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold">AI Gamybos Strategas</DialogTitle>
                                    <DialogDescription>Jūsų protingas gamybos ir resursų planuotojas</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                                >
                                    {msg.sender === 'ai' && <div className="bg-gray-200 p-2 rounded-full"><Bot className="h-5 w-5 text-gray-600" /></div>}
                                    <div className={`max-w-[90%] rounded-lg p-3 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        {msg.queryResult && (
                                            <div className="mt-3 border-t pt-3 space-y-2">
                                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-blue-500" />
                                                    Subasemblio sudėtis:
                                                </h4>
                                                <div className="text-sm bg-gray-50 p-3 rounded-md border">
                                                     <ul className="space-y-1">
                                                        {msg.queryResult.components.map((component) => (
                                                            <li key={component.name} className="flex justify-between">
                                                                <span>{component.name}</span>
                                                                <span className="font-semibold">{component.quantity} vnt.</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                        {msg.plan && (
                                            <div className="mt-3 border-t pt-3 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 text-purple-500" />
                                                            Gamybos planas:
                                                        </h4>
                                                        <div className="text-sm bg-gray-50 p-3 rounded-md border h-60 overflow-y-auto">
                                                            {renderPlan(msg.plan)}
                                                        </div>
                                                    </div>
                                                     <div>
                                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                            <ShoppingCart className="h-4 w-4 text-green-500" />
                                                            Reikalingi komponentai:
                                                        </h4>
                                                        <div className="text-sm bg-gray-50 p-3 rounded-md border h-60 overflow-y-auto">
                                                            <ul className="space-y-1">
                                                                {Object.entries(msg.requiredComponents).map(([name, quantity]) => (
                                                                    <li key={name} className="flex justify-between">
                                                                        <span>{name}</span>
                                                                        <span className="font-semibold">{quantity} vnt.</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                {msg.analysis && msg.analysis.rootNodes && (
                                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                            <BrainCircuit className="h-4 w-4 text-blue-500" />
                                                            Struktūros Analizė:
                                                        </h4>
                                                        <p className="text-xs text-blue-800">
                                                            Aš atpažinau šiuos galutinius produktus jūsų sistemoje: <span className="font-medium">{msg.analysis.rootNodes.join(', ')}</span>. Galite prašyti pagaminti bet kurį iš jų.
                                                        </p>
                                                    </div>
                                                )}
                                                <Button className="w-full mt-4" size="sm" onClick={() => handleConfirmPlan(msg.plan)}>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Patvirtinti ir sukurti visą struktūrą
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {msg.sender === 'user' && <div className="bg-blue-600 p-2 rounded-full text-white"><User className="h-5 w-5" /></div>}
                                </motion.div>
                            ))}
                            {isThinking && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="bg-gray-200 p-2 rounded-full"><Bot className="h-5 w-5 text-gray-600" /></div>
                                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <div className="relative">
                                <Input
                                    placeholder="Įveskite užduotį arba klausimą..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="pr-12"
                                    disabled={isThinking}
                                />
                                <Button
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={handleSend}
                                    disabled={isThinking || input.trim() === ''}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    export default AIAssistant;
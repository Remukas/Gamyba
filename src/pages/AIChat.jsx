import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Sparkles, Package, BarChart3, Factory, Info, ShoppingCart } from 'lucide-react';
import { useComponents } from '@/context/ComponentsContext';
import { Badge } from '@/components/ui/badge';

const AIChat = () => {
  const { componentsInventory, subassemblies, categories } = useComponents();
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Sveiki! 🤖 Aš esu jūsų gamybos strategas. Suprantu visą jūsų gamybos struktūrą ir galiu padėti su:\n\n• Atsargų analize\n• Komponentų sudėtimi\n• Gamybos planavimu\n• Statistikos ataskaita\n\nKlauskite bet ko apie gamybą!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

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
      const totalValue = componentsInventory.reduce((sum, c) => sum + (c.stock * 15), 0);
      
      return {
        sender: 'ai',
        text: `📦 Atsargų analizė:\n\n• Viso komponentų tipų: ${componentsInventory.length}\n• Mažos atsargos (<10 vnt.): ${lowStockComponents.length}\n• Bendra atsargų vertė: ~€${totalValue.toLocaleString()}\n\n${lowStockComponents.length > 0 ? '⚠️ Dėmesio! Šie komponentai turi mažas atsargas:' : '✅ Visų komponentų atsargos pakankamos!'}`,
        inventoryAnalysis: {
          lowStockComponents: lowStockComponents.map(c => ({ 
            name: c.name, 
            stock: c.stock, 
            leadTime: c.leadTimeDays 
          }))
        }
      };
    }

    // Sudėties užklausa
    if (lowerInput.includes('kas įeina') || lowerInput.includes('sudėtis') || lowerInput.includes('komponentai')) {
      const targetName = lowerInput.replace(/kas įeina į|sudėtis|kokie komponentai/g, '').trim();
      const allSubassemblies = Object.values(subassemblies).flat();
      const targetNode = allSubassemblies.find(sa => 
        sa.name.toLowerCase().includes(targetName)
      );

      if (targetNode && targetNode.components && targetNode.components.length > 0) {
        const componentDetails = targetNode.components.map(c => {
          const componentData = componentsInventory.find(inv => inv.id === c.componentId);
          return {
            name: componentData ? componentData.name : 'Nežinomas komponentas',
            quantity: c.requiredQuantity,
            stock: componentData ? componentData.stock : 0
          };
        });

        return {
          sender: 'ai',
          text: `🔍 Radau informaciją apie "${targetNode.name}":\n\nŠis subasemblis reikalauja ${componentDetails.length} komponentų tipų:`,
          queryResult: {
            nodeName: targetNode.name,
            components: componentDetails
          }
        };
      } else {
        const availableNames = allSubassemblies.filter(sa => sa.name).map(sa => sa.name).slice(0, 5);
        return {
          sender: 'ai',
          text: `❌ Neradau subasemblio "${targetName}".\n\nGalimi subasembliai:\n${availableNames.map(name => `• ${name}`).join('\n')}`
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

      const totalSubassemblies = Object.values(subassemblies).flat().length;
      const totalCompleted = Object.values(subassemblies).flat().filter(sa => sa.quantity > 0).length;

      return {
        sender: 'ai',
        text: `📊 Gamybos statistika:\n\n• Viso subasemblių: ${totalSubassemblies}\n• Užbaigta: ${totalCompleted}\n• Bendras progresas: ${totalSubassemblies > 0 ? Math.round((totalCompleted / totalSubassemblies) * 100) : 0}%\n\nDetalės pagal kategorijas:`,
        statisticsAnalysis: { categoryStats }
      };
    }

    // Gamybos planavimas
    if (lowerInput.includes('pagamink') || lowerInput.includes('sukurk') || lowerInput.includes('planuok')) {
      const quantityMatch = lowerInput.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
      
      const allSubassemblies = Object.values(subassemblies).flat();
      const childIds = new Set(allSubassemblies.filter(sa => sa.children).flatMap(sa => sa.children));
      const rootNodes = allSubassemblies.filter(sa => !childIds.has(sa.id));
      
      const targetName = lowerInput.replace(/pagamink|sukurk|planuok|\d+/g, '').trim();
      const targetProduct = rootNodes.find(node => 
        node.name.toLowerCase().includes(targetName)
      );

      if (targetProduct) {
        const requiredComponents = {};
        
        // Apskaičiuoti reikalingus komponentus
        const calculateComponents = (nodeId, multiplier) => {
          const node = allSubassemblies.find(sa => sa.id === nodeId);
          if (!node) return;
          
          if (node.components) {
            node.components.forEach(comp => {
              const componentData = componentsInventory.find(c => c.id === comp.componentId);
              if (componentData) {
                const totalNeeded = comp.requiredQuantity * multiplier;
                requiredComponents[componentData.name] = (requiredComponents[componentData.name] || 0) + totalNeeded;
              }
            });
          }
          
          if (node.children) {
            node.children.forEach(childId => calculateComponents(childId, multiplier));
          }
        };
        
        calculateComponents(targetProduct.id, quantity);

        return {
          sender: 'ai',
          text: `🎯 Gamybos planas: ${quantity} vnt. "${targetProduct.name}"\n\nAnalizuoju struktūrą ir skaičiuoju reikalingus komponentus...`,
          productionPlan: {
            productName: targetProduct.name,
            quantity: quantity,
            requiredComponents: requiredComponents
          }
        };
      } else {
        return {
          sender: 'ai',
          text: `❌ Neradau produkto "${targetName}".\n\nGalimi produktai:\n${rootNodes.map(node => `• ${node.name}`).join('\n')}`
        };
      }
    }

    // Optimizavimo patarimai
    if (lowerInput.includes('optimizuoti') || lowerInput.includes('pagerinti') || lowerInput.includes('patarimai')) {
      const lowStock = componentsInventory.filter(c => c.stock < 10).length;
      const pendingSubassemblies = Object.values(subassemblies).flat().filter(sa => sa.quantity === 0).length;
      
      return {
        sender: 'ai',
        text: `🚀 Optimizavimo rekomendacijos:\n\n${lowStock > 0 ? `⚠️ Papildykite ${lowStock} komponentų atsargas` : '✅ Atsargos pakankamos'}\n\n${pendingSubassemblies > 0 ? `📋 ${pendingSubassemblies} subasemblių laukia gamybos` : '✅ Visi subasembliai pagaminti'}\n\n💡 Patarimas: Pradėkite nuo komponentų su ilgiausiu gavimo laiku!`,
        optimizationTips: {
          lowStockCount: lowStock,
          pendingCount: pendingSubassemblies
        }
      };
    }

    // Bendras atsakymas
    return {
      sender: 'ai',
      text: `🤔 Suprantu! Galiu padėti su:\n\n📦 "Kokios mano atsargos?" - atsargų analizė\n🔍 "Kas įeina į Cart?" - sudėties analizė\n📊 "Statistika" - gamybos progreso ataskaita\n🎯 "Pagamink 5 Cart" - gamybos planas\n🚀 "Optimizuoti" - patarimai efektyvumui\n\nTiesiog parašykite, ko norite!`
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🤖 AI Gamybos Strategas
            </h1>
            <p className="text-gray-600 text-lg">Protingas asistentas gamybos valdymui</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-2xl text-white shadow-xl">
            <Bot className="h-12 w-12" />
          </div>
        </div>

        {/* Chat Container */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl h-[600px] flex flex-col">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              AI Chat
            </CardTitle>
            <CardDescription className="text-purple-100">
              Klauskite bet ko apie gamybą - aš suprantu visą struktūrą!
            </CardDescription>
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.sender === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                    <div className="flex items-start gap-3">
                      {msg.sender === 'ai' && (
                        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-full text-white flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-line">{msg.text}</p>
                        
                        {/* Atsargų analizė */}
                        {msg.inventoryAnalysis && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-red-700">
                              <Package className="h-4 w-4" />
                              Kritiniai komponentai:
                            </h4>
                            {msg.inventoryAnalysis.lowStockComponents.length > 0 ? (
                              <div className="space-y-1">
                                {msg.inventoryAnalysis.lowStockComponents.map((comp, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-red-800">{comp.name}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-red-100 text-red-800">{comp.stock} vnt.</Badge>
                                      <span className="text-xs text-red-600">{comp.leadTime}d</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-green-700 text-sm">✅ Visų komponentų atsargos pakankamos!</p>
                            )}
                          </div>
                        )}

                        {/* Sudėties informacija */}
                        {msg.queryResult && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700">
                              <Info className="h-4 w-4" />
                              Subasemblio "{msg.queryResult.nodeName}" sudėtis:
                            </h4>
                            <div className="space-y-1">
                              {msg.queryResult.components.map((comp, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-blue-800">{comp.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800">{comp.quantity} vnt.</Badge>
                                    <span className={`text-xs ${comp.stock >= comp.quantity ? 'text-green-600' : 'text-red-600'}`}>
                                      (sandėlyje: {comp.stock})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Statistikos analizė */}
                        {msg.statisticsAnalysis && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700">
                              <BarChart3 className="h-4 w-4" />
                              Kategorijų progresas:
                            </h4>
                            <div className="space-y-2">
                              {msg.statisticsAnalysis.categoryStats.map((cat, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span className="text-sm text-green-800">{cat.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${cat.percentage}%` }}
                                      />
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">{cat.percentage}%</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gamybos planas */}
                        {msg.productionPlan && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-orange-700">
                              <Factory className="h-4 w-4" />
                              Gamybos planas:
                            </h4>
                            <div className="mb-3">
                              <p className="text-sm text-orange-800">
                                <strong>{msg.productionPlan.productName}</strong> × {msg.productionPlan.quantity} vnt.
                              </p>
                            </div>
                            {Object.keys(msg.productionPlan.requiredComponents).length > 0 && (
                              <div>
                                <h5 className="font-medium text-xs mb-2 flex items-center gap-1">
                                  <ShoppingCart className="h-3 w-3" />
                                  Reikalingi komponentai:
                                </h5>
                                <div className="space-y-1">
                                  {Object.entries(msg.productionPlan.requiredComponents).map(([name, qty], i) => {
                                    const comp = componentsInventory.find(c => c.name === name);
                                    const hasEnough = comp && comp.stock >= qty;
                                    return (
                                      <div key={i} className="flex justify-between items-center text-sm">
                                        <span className={hasEnough ? 'text-green-800' : 'text-red-800'}>
                                          {name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <Badge className={hasEnough ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                            {qty} vnt.
                                          </Badge>
                                          {!hasEnough && <span className="text-xs text-red-600">⚠️</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Optimizavimo patarimai */}
                        {msg.optimizationTips && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2 text-yellow-700">💡 Optimizavimo patarimai:</h4>
                            <div className="text-sm text-yellow-800 space-y-1">
                              {msg.optimizationTips.lowStockCount > 0 && (
                                <p>• Papildykite {msg.optimizationTips.lowStockCount} komponentų atsargas</p>
                              )}
                              {msg.optimizationTips.pendingCount > 0 && (
                                <p>• Pradėkite gaminti {msg.optimizationTips.pendingCount} laukiančių subasemblių</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {msg.sender === 'user' && (
                        <div className="bg-purple-700 p-2 rounded-full text-white flex-shrink-0 ml-3">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border shadow-sm rounded-2xl p-4 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-full text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-sm text-gray-600">AI analizuoja duomenis...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3">
              <Input
                placeholder="Užduokite klausimą apie gamybą..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="text-base"
                disabled={isThinking}
              />
              <Button
                onClick={handleSend}
                disabled={isThinking || input.trim() === ''}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput('Kokios mano atsargos?')}
                className="text-xs"
              >
                📦 Atsargos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput('Statistika')}
                className="text-xs"
              >
                📊 Statistika
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInput('Optimizuoti')}
                className="text-xs"
              >
                🚀 Patarimai
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AIChat;
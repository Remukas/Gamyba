import React, { useState, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { MoreVertical, MessageCircle, Package, AlertCircle, HardHat } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

    const SubassemblyNode = ({ subassembly, isSelected, onClick, onUpdate, zoom, isConnectingTarget, statuses }) => {
      const { toast } = useToast();
      const [isDragging, setIsDragging] = useState(false);
      const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

      const statusInfo = useMemo(() => {
        return statuses.find(s => s.id === subassembly.status) || { name: 'Nežinoma', color: '#6b7280' };
      }, [subassembly.status, statuses]);

      const handleMouseDown = (e) => {
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({
          x: e.clientX / zoom - subassembly.position.x,
          y: e.clientY / zoom - subassembly.position.y
        });
      };
      
      const handleMouseMove = (e) => {
        if (isDragging) {
          const newPosition = {
            x: e.clientX / zoom - dragStart.x,
            y: e.clientY / zoom - dragStart.y
          };
          onUpdate({ position: newPosition });
        }
      };

      const handleMouseUp = (e) => {
        if (isDragging) {
          setIsDragging(false);
          if (
            Math.abs(e.movementX) < 3 &&
            Math.abs(e.movementY) < 3
          ) {
            onClick();
          }
        } else {
            onClick();
        }
      };

      const hasIssues = subassembly.status !== 'completed' && subassembly.quantity < subassembly.targetQuantity;
      
      const backgroundClass = subassembly.quantity > 0 ? 'bg-green-100/90' : 'bg-red-100/90';

      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                id={subassembly.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute subassembly-node cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-blue-500 shadow-2xl' : 'shadow-lg'} ${isConnectingTarget ? 'connecting-target' : ''}`}
                style={{
                  left: subassembly.position.x,
                  top: subassembly.position.y,
                  width: 200,
                  height: 120,
                  zIndex: isSelected ? 10 : 1,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div className={`${backgroundClass} backdrop-blur-sm rounded-lg border hover:shadow-xl transition-shadow duration-300 flex flex-col h-full p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                        {subassembly.name}
                      </h3>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1" style={{ backgroundColor: statusInfo.color }}>
                        {statusInfo.name}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 -mr-2 -mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "🚧 Ši funkcija dar neįgyvendinta—bet nesijaudinkite! Galite jos paprašyti kitame pranešime! 🚀" });
                      }}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    Likutis: <span className="font-semibold">{subassembly.quantity} vnt.</span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Package className="h-3 w-3 mr-1" />
                        {subassembly.children?.length || 0}
                      </div>
                      {subassembly.components?.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <HardHat className="h-3 w-3 mr-1" />
                          {subassembly.components.length}
                        </div>
                      )}
                      {subassembly.comments?.length > 0 && (
                        <div className="flex items-center text-xs text-blue-600">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {subassembly.comments.length}
                        </div>
                      )}
                    </div>
                    
                    {hasIssues && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            {subassembly.comments && subassembly.comments.length > 0 && (
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="font-semibold mb-2">Komentarai:</div>
                <ul className="list-disc list-inside space-y-1">
                  {subassembly.comments.map((comment, index) => (
                    <li key={index} className="text-xs">{comment}</li>
                  ))}
                </ul>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    };

    export default SubassemblyNode;
import React from 'react';
    import { Outlet, NavLink } from 'react-router-dom';
    import { LayoutGrid, Package, GanttChartSquare, Timer } from 'lucide-react';
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

    const MainLayout = () => {
      return (
        <TooltipProvider>
          <div className="h-screen w-screen flex bg-gray-50">
            <nav className="w-20 bg-white border-r flex flex-col items-center py-6 gap-8">
              <div className="text-blue-600 font-bold text-xl">
                G
              </div>
              <div className="flex flex-col gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink 
                      to="/" 
                      end
                      className={({ isActive }) => 
                        `p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`
                      }
                    >
                      <LayoutGrid className="h-6 w-6" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Gamybos Medis</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink 
                      to="/components" 
                      className={({ isActive }) => 
                        `p-3 rounded-lg transition-colors ${isActive ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'}`
                      }
                    >
                      <Package className="h-6 w-6" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Komponentų Valdymas</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink 
                      to="/planning" 
                      className={({ isActive }) => 
                        `p-3 rounded-lg transition-colors ${isActive ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'}`
                      }
                    >
                      <GanttChartSquare className="h-6 w-6" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Gamybos Planavimas</p>
                  </TooltipContent>
                </Tooltip>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink 
                      to="/tracking" 
                      className={({ isActive }) => 
                        `p-3 rounded-lg transition-colors ${isActive ? 'bg-yellow-100 text-yellow-600' : 'text-gray-500 hover:bg-gray-100'}`
                      }
                    >
                      <Timer className="h-6 w-6" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Komponentų Sekimas</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </nav>
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </TooltipProvider>
      );
    };

    export default MainLayout;
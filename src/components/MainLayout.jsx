import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Package, 
  GanttChartSquare, 
  Timer, 
  BarChart3, 
  Shield, 
  Settings, 
  Users,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import UserProfile from '@/components/UserProfile';

const MainLayout = () => {
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = [
    {
      to: "/",
      icon: LayoutGrid,
      label: "Gamybos Medis",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      permission: null
    },
    {
      to: "/components",
      icon: Package,
      label: "Komponentų Valdymas",
      color: "text-green-600",
      bgColor: "bg-green-100",
      permission: "manage_components"
    },
    {
      to: "/planning",
      icon: GanttChartSquare,
      label: "Gamybos Planavimas",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      permission: "manage_production"
    },
    {
      to: "/tracking",
      icon: Timer,
      label: "Komponentų Sekimas",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      permission: "view_tracking"
    },
    {
      to: "/analytics",
      icon: BarChart3,
      label: "Analitika",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      permission: "view_analytics"
    },
    {
      to: "/quality",
      icon: Shield,
      label: "Kokybės Kontrolė",
      color: "text-red-600",
      bgColor: "bg-red-100",
      permission: "view_quality"
    },
    {
      to: "/maintenance",
      icon: Settings,
      label: "Priežiūros Grafikas",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      permission: "view_analytics"
    }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <TooltipProvider>
      <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-white/90 backdrop-blur-sm"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sidebar */}
        <nav className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-40 w-80 lg:w-20 xl:w-80 h-full
          bg-white/80 backdrop-blur-xl border-r border-white/20 
          flex flex-col py-6 transition-transform duration-300 ease-in-out
          shadow-xl lg:shadow-none
        `}>
          {/* Logo */}
          <div className="px-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                G
              </div>
              <div className="lg:hidden xl:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gamybos Valdymas
                </h1>
                <p className="text-xs text-gray-500">Beta versija</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 space-y-2">
            {filteredNavItems.map((item) => (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `${item.bgColor} ${item.color} shadow-lg scale-105`
                          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:scale-105'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6 flex-shrink-0" />
                    <span className="lg:hidden xl:block font-medium truncate">
                      {item.label}
                    </span>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:block xl:hidden hidden">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Admin Panel - Only for admins */}
            {currentUser?.role === 'admin' && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-red-100 text-red-600 shadow-lg scale-105'
                          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:scale-105'
                      }`
                    }
                  >
                    <Users className="h-6 w-6 flex-shrink-0" />
                    <span className="lg:hidden xl:block font-medium truncate">
                      Administravimas
                    </span>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:block xl:hidden hidden">
                  <p>Administravimas</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* User Section */}
          <div className="px-3 pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="lg:hidden xl:block flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser?.role}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUserProfile(true)}
                    className="flex-1 lg:w-full xl:flex-1 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:block xl:hidden hidden">
                  <p>Profilis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="flex-1 lg:w-full xl:flex-1 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:block xl:hidden hidden">
                  <p>Atsijungti</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </nav>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* User Profile Modal */}
        <UserProfile 
          open={showUserProfile} 
          onOpenChange={setShowUserProfile} 
        />
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;
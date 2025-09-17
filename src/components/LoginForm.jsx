import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Lock, User, Eye, EyeOff, Shield, Factory } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      toast({
        title: "Sėkmingai prisijungėte!",
        description: "Sveiki sugrįžę į gamybos valdymo sistemą."
      });
    } else {
      toast({
        title: "Prisijungimo klaida",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'Administratorius', desc: 'Pilnas sistemos valdymas' },
    { username: 'manager', password: 'manager123', role: 'Vadovas', desc: 'Gamybos valdymas ir analitika' },
    { username: 'operator', password: 'operator123', role: 'Operatorius', desc: 'Gamybos procesų valdymas' },
    { username: 'quality', password: 'quality123', role: 'Kokybės kontrolierius', desc: 'Kokybės valdymas' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Kairė pusė - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-white mr-4">
              <Factory className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gamybos Valdymas
              </h1>
              <p className="text-gray-600">Gamybos valdymo sistema</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center lg:justify-start">
              <Shield className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-gray-700">Saugi autentifikacija</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start">
              <User className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-gray-700">Vartotojų valdymas</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start">
              <Factory className="h-5 w-5 text-purple-500 mr-3" />
              <span className="text-gray-700">Gamybos optimizavimas</span>
            </div>
          </div>

          {/* Demo paskyros */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border">
            <h3 className="font-semibold text-gray-800 mb-3">Demo Paskyros:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {demoAccounts.map((account, index) => (
                <div key={index} className="bg-white/70 rounded-lg p-3 border">
                  <div className="font-medium text-gray-800">{account.role}</div>
                  <div className="text-xs text-gray-600 mb-1">{account.desc}</div>
                  <div className="text-xs font-mono bg-gray-100 rounded px-2 py-1">
                    {account.username} / {account.password}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dešinė pusė - Prisijungimo forma */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-800">Prisijungimas</CardTitle>
              <CardDescription>Įveskite savo prisijungimo duomenis</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Vartotojo vardas
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Įveskite vartotojo vardą"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Slaptažodis
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Įveskite slaptažodį"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Prisijungiama...
                    </div>
                  ) : (
                    'Prisijungti'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;
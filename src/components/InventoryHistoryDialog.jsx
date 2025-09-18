import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  User,
  Package,
  BarChart3,
  Download,
  Eye
} from 'lucide-react';

const InventoryHistoryDialog = ({ open, onOpenChange, records, selectedWeek, components }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState(selectedWeek?.week || 'all');
  const [filterType, setFilterType] = useState('all'); // all, positive, negative, zero

  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.inspector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by week
    if (filterWeek !== 'all') {
      filtered = filtered.filter(record => record.week_number === filterWeek);
    }

    // Filter by discrepancy type
    if (filterType !== 'all') {
      if (filterType === 'positive') {
        filtered = filtered.filter(record => record.difference > 0);
      } else if (filterType === 'negative') {
        filtered = filtered.filter(record => record.difference < 0);
      } else if (filterType === 'zero') {
        filtered = filtered.filter(record => record.difference === 0);
      }
    }

    return filtered.sort((a, b) => new Date(b.check_date) - new Date(a.check_date));
  }, [records, searchTerm, filterWeek, filterType]);

  const analytics = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const positiveDiscrepancies = filteredRecords.filter(r => r.difference > 0).length;
    const negativeDiscrepancies = filteredRecords.filter(r => r.difference < 0).length;
    const totalDiscrepancyValue = filteredRecords.reduce((sum, r) => sum + Math.abs(r.difference), 0);

    // Komponentų su dažniausiais neatitikimais analizė
    const componentFrequency = {};
    filteredRecords.forEach(record => {
      if (record.difference !== 0) {
        componentFrequency[record.component_name] = (componentFrequency[record.component_name] || 0) + 1;
      }
    });

    const topProblematicComponents = Object.entries(componentFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Savaitės su daugiausiai neatitikimų
    const weekFrequency = {};
    filteredRecords.forEach(record => {
      if (record.difference !== 0) {
        weekFrequency[record.week_number] = (weekFrequency[record.week_number] || 0) + 1;
      }
    });

    const topProblematicWeeks = Object.entries(weekFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      totalRecords,
      positiveDiscrepancies,
      negativeDiscrepancies,
      totalDiscrepancyValue,
      topProblematicComponents,
      topProblematicWeeks
    };
  }, [filteredRecords]);

  const exportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      filters: { searchTerm, filterWeek, filterType },
      analytics,
      records: filteredRecords
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const availableWeeks = useMemo(() => {
    const weeks = [...new Set(records.map(r => r.week_number))].sort();
    return weeks;
  }, [records]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Inventorizacijos Istorija
            {selectedWeek && ` - ${selectedWeek.week} Savaitė`}
          </DialogTitle>
          <DialogDescription>
            Visų inventorizacijos įrašų istorija su analize ir filtravimo galimybėmis
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Viso Įrašų</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{analytics.totalRecords}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Pertekliai</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{analytics.positiveDiscrepancies}</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Trūkumai</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{analytics.negativeDiscrepancies}</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">Bendras Skirtumas</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{analytics.totalDiscrepancyValue}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4" />
                Paieška
              </Label>
              <Input
                placeholder="Komponentas arba inspektorius..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Savaitė
              </Label>
              <Select value={filterWeek} onValueChange={setFilterWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visos savaitės</SelectItem>
                  {availableWeeks.map(week => (
                    <SelectItem key={week} value={week}>{week}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4" />
                Neatitikimo Tipas
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visi</SelectItem>
                  <SelectItem value="positive">Pertekliai (+)</SelectItem>
                  <SelectItem value="negative">Trūkumai (-)</SelectItem>
                  <SelectItem value="zero">Be neatitikimų</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={exportData} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Eksportuoti
              </Button>
            </div>
          </div>

          {/* Records Table */}
          <div className="flex-1 overflow-y-auto border rounded-lg bg-white">
            <div className="sticky top-0 bg-gray-100 border-b">
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-gray-700">
                <div className="col-span-2">Data / Savaitė</div>
                <div className="col-span-3">Komponentas</div>
                <div className="col-span-1 text-center">Numatytas</div>
                <div className="col-span-1 text-center">Faktiškas</div>
                <div className="col-span-1 text-center">Skirtumas</div>
                <div className="col-span-2">Inspektorius</div>
                <div className="col-span-2">Pastabos</div>
              </div>
            </div>
            
            <div className="divide-y">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => (
                  <div key={record.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-2">
                      <div className="font-medium">{record.check_date}</div>
                      <Badge variant="outline" className="text-xs mt-1">{record.week_number}</Badge>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="font-medium">{record.component_name}</div>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <Badge variant="outline">{record.expected_stock}</Badge>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <Badge variant="outline">{record.actual_stock}</Badge>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <Badge className={
                        record.difference === 0 
                          ? 'bg-green-100 text-green-800'
                          : record.difference > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {record.difference > 0 ? '+' : ''}{record.difference}
                      </Badge>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{record.inspector}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600 max-w-full overflow-hidden">
                        {record.notes || '-'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Įrašų nerasta</p>
                  <p className="text-sm">Pakeiskite filtrus arba pradėkite inventorizaciją</p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Panel */}
          {analytics.topProblematicComponents.length > 0 && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Problematiški Komponentai
                </h4>
                <div className="space-y-2">
                  {analytics.topProblematicComponents.map(([componentName, count]) => (
                    <div key={componentName} className="flex justify-between items-center">
                      <span className="text-sm text-red-700">{componentName}</span>
                      <Badge className="bg-red-100 text-red-800">{count} neatitikimų</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {analytics.topProblematicWeeks.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Problemiškos Savaitės
                  </h4>
                  <div className="space-y-2">
                    {analytics.topProblematicWeeks.map(([week, count]) => (
                      <div key={week} className="flex justify-between items-center">
                        <span className="text-sm text-orange-700">{week}</span>
                        <Badge className="bg-orange-100 text-orange-800">{count} neatitikimų</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Rodoma: {filteredRecords.length} iš {records.length} įrašų
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Uždaryti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryHistoryDialog;
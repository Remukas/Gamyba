import React, { useState, useCallback, useEffect } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import * as XLSX from 'xlsx';
    import { Upload, FileText, CheckCircle, Sheet, Columns, Component, Package, ListTodo } from 'lucide-react';
    import { useComponents } from '@/context/ComponentsContext';
    import { Badge } from '@/components/ui/badge';

    const ExcelImportDialog = ({ open, onOpenChange, onImportSubassemblyWithComponents, categoryName }) => {
        const [file, setFile] = useState(null);
        const [workbook, setWorkbook] = useState(null);
        const [sheetNames, setSheetNames] = useState([]);
        const [selectedSheet, setSelectedSheet] = useState('');
        
        const [subassemblyNameCell, setSubassemblyNameCell] = useState('A1');
        const [componentNameCol, setComponentNameCol] = useState('B');
        const [componentQuantityCol, setComponentQuantityCol] = useState('C');
        const [startRow, setStartRow] = useState('2');
        
        const [parsedData, setParsedData] = useState(null);

        const [isLoading, setIsLoading] = useState(false);
        const { toast } = useToast();
        const { getComponentByName } = useComponents();


        const resetState = useCallback(() => {
            setFile(null);
            setWorkbook(null);
            setSheetNames([]);
            setSelectedSheet('');
            setSubassemblyNameCell('A1');
            setComponentNameCol('B');
            setComponentQuantityCol('C');
            setStartRow('2');
            setParsedData(null);
            setIsLoading(false);
        }, []);
        
        const handleFileChange = (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'application/vnd.ms-excel') {
                    setIsLoading(true);
                    setFile(selectedFile);
                    setParsedData(null);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = new Uint8Array(event.target.result);
                            const wb = XLSX.read(data, { type: 'array' });
                            setWorkbook(wb);
                            setSheetNames(wb.SheetNames);
                            if (wb.SheetNames.length > 0) {
                                setSelectedSheet(wb.SheetNames[0]);
                            }
                            toast({ title: "Failas įkeltas", description: "Pasirinkite lapą ir nurodykite duomenų laukus." });
                        } catch (error) {
                            toast({ title: "Skaitymo klaida", description: "Nepavyko nuskaityti failo struktūros.", variant: "destructive" });
                            resetState();
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    reader.onerror = () => {
                        setIsLoading(false);
                        toast({ title: "Failo klaida", description: "Įvyko klaida skaitant failą.", variant: "destructive" });
                    };
                    reader.readAsArrayBuffer(selectedFile);
                } else {
                    toast({
                        title: "Netinkamas failo formatas",
                        description: "Prašome pasirinkti .xlsx arba .xls failą.",
                        variant: "destructive"
                    });
                }
            }
        };

        const handleParse = useCallback(() => {
            if (!workbook || !selectedSheet) {
                toast({ title: "Klaida", description: "Trūksta duomenų (failas arba lapas).", variant: "destructive" });
                return;
            }
            
            setIsLoading(true);
            setParsedData(null);

            try {
                const worksheet = workbook.Sheets[selectedSheet];
                
                // Parse subassembly name
                const saNameCell = worksheet[subassemblyNameCell.toUpperCase()];
                const subassemblyName = (saNameCell ? saNameCell.v : '').toString().trim();

                if (!subassemblyName) {
                    toast({ title: "Klaida", description: `Langelis ${subassemblyNameCell} tuščias arba nerastas.`, variant: "destructive" });
                    setIsLoading(false);
                    return;
                }
                
                // Parse components
                const nameColIndex = XLSX.utils.decode_col(componentNameCol.toUpperCase());
                const quantityColIndex = XLSX.utils.decode_col(componentQuantityCol.toUpperCase());
                const firstRow = parseInt(startRow, 10);

                if (isNaN(firstRow) || firstRow < 1) {
                    toast({ title: "Klaida", description: `Neteisingas pradžios eilutės numeris.`, variant: "destructive" });
                    setIsLoading(false);
                    return;
                }

                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
                
                const extractedComponents = data
                    .slice(firstRow - 1)
                    .map(row => ({ name: row[nameColIndex], quantity: row[quantityColIndex] }))
                    .filter(item => item.name && String(item.name).trim() !== '' && item.quantity !== undefined && !isNaN(Number(item.quantity)) && Number(item.quantity) > 0)
                    .map(item => {
                        const existingComp = getComponentByName(String(item.name).trim());
                        return {
                            name: String(item.name).trim(),
                            requiredQuantity: Number(item.quantity),
                            componentId: existingComp ? existingComp.id : null,
                            exists: !!existingComp
                        };
                    });

                if (extractedComponents.length === 0) {
                     toast({ title: "Komponentų nerasta", description: `Nurodytuose stulpeliuose nerasta tinkamų komponentų.`, variant: "destructive" });
                }

                const parsed = {
                    subassemblyName,
                    components: extractedComponents
                };
                
                setParsedData(parsed);
                toast({ title: "Duomenys nuskaityti", description: `Rastas subasemblis ir ${extractedComponents.length} komponentų.` });

            } catch (error) {
                console.error("Parsing error:", error);
                toast({ title: "Analizės klaida", description: "Nepavyko apdoroti nurodytų laukų.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }

        }, [workbook, selectedSheet, subassemblyNameCell, componentNameCol, componentQuantityCol, startRow, toast, getComponentByName]);
        
        useEffect(() => {
          if (workbook && selectedSheet) {
            handleParse();
          }
        }, [selectedSheet, workbook, handleParse]);

        const handleClose = useCallback(() => {
            resetState();
            onOpenChange(false);
        }, [resetState, onOpenChange]);

        const handleImport = () => {
            if (parsedData && parsedData.subassemblyName) {
                const componentsToImport = parsedData.components.filter(c => c.componentId).map(c => ({ componentId: c.componentId, requiredQuantity: c.requiredQuantity }));
                
                onImportSubassemblyWithComponents({
                    name: parsedData.subassemblyName,
                    components: componentsToImport
                });
                toast({ title: "Importavimas sėkmingas", description: `Subasemblis "${parsedData.subassemblyName}" pridėtas.` });
            } else {
                toast({ title: "Importavimo klaida", description: "Nėra duomenų, kuriuos būtų galima importuoti.", variant: "destructive" });
                return;
            }
            handleClose();
        };

        useEffect(() => {
            if (!open) {
                resetState();
            }
        }, [open, resetState]);


        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Importuoti Subasemblį su Komponentais</DialogTitle>
                        <DialogDescription>
                            Importuokite naują subasemblį į "{categoryName}" kategoriją tiesiai iš Excel failo. Sistema automatiškai priskirs komponentus.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4 px-1 overflow-y-auto flex-1">
                        <div className="space-y-2">
                             <Label htmlFor="excel-file" className="text-base font-semibold">1. Įkelkite Excel failą</Label>
                             <div className="flex items-center gap-4">
                                <Input id="excel-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                                <Label htmlFor="excel-file" className="flex-1 cursor-pointer">
                                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-accent hover:border-primary transition-colors">
                                        {isLoading && !file ? 
                                            <div className="flex flex-col items-center gap-2 animate-pulse"><Upload className="h-6 w-6"/><span>Įkeliamas failas...</span></div> :
                                            file ? 
                                            <div className="flex flex-col items-center gap-2 text-green-600"><FileText className="h-6 w-6"/><span>{file.name}</span></div> 
                                            : <div className="flex flex-col items-center gap-2"><Upload className="h-6 w-6"/><span>Spauskite, kad įkeltumėte</span></div>
                                        }
                                    </div>
                                </Label>
                             </div>
                        </div>

                        {file && sheetNames.length > 0 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">2. Pasirinkite lapą</Label>
                                    <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={isLoading}>
                                        <SelectTrigger id="sheet-select">
                                            <SelectValue placeholder="Pasirinkite lapą" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sheetNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sa-name-cell" className="flex items-center gap-2 font-semibold"><ListTodo className="h-4 w-4"/>Subasemblio pavadinimo langelis</Label>
                                            <Input id="sa-name-cell" value={subassemblyNameCell} onChange={(e) => setSubassemblyNameCell(e.target.value.toUpperCase())} placeholder="Pvz., A1" disabled={isLoading} />
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-4 mt-4">
                                      <Label className="text-base font-semibold mb-2 block">Komponentų sąrašas</Label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="comp-name-col" className="flex items-center gap-2 font-semibold"><Component className="h-4 w-4"/>Pavadinimų stulpelis</Label>
                                            <Input id="comp-name-col" value={componentNameCol} onChange={(e) => setComponentNameCol(e.target.value.toUpperCase())} placeholder="Pvz., B" disabled={isLoading} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="comp-qty-col" className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4"/>Kiekio stulpelis</Label>
                                            <Input id="comp-qty-col" value={componentQuantityCol} onChange={(e) => setComponentQuantityCol(e.target.value.toUpperCase())} placeholder="Pvz., C" disabled={isLoading} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="start-row" className="flex items-center gap-2 font-semibold"><Columns className="h-4 w-4"/>Pradžios eilutė</Label>
                                            <Input id="start-row" type="number" value={startRow} onChange={(e) => setStartRow(e.target.value)} placeholder="Pvz., 2" disabled={isLoading} />
                                        </div>
                                      </div>
                                    </div>
                                </div>
                                
                                <Button onClick={handleParse} disabled={!file || isLoading} className="w-full">
                                    {isLoading ? 'Skaitoma...' : 'Nuskaityti duomenis'}
                                </Button>

                                {parsedData && (
                                    <div className="space-y-4 pt-4">
                                        <Label className="flex items-center gap-2 text-base font-semibold"><CheckCircle className="h-5 w-5 text-green-500" />Peržiūra: Nuskaityti duomenys</Label>
                                        <div className="border rounded-lg p-4 bg-background/50 space-y-4">
                                            <div className="font-medium">
                                                <span className="text-muted-foreground">Subasemblis: </span>
                                                <span>{parsedData.subassemblyName}</span>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto border rounded-md p-3 text-sm shadow-inner space-y-1">
                                                <p className="font-semibold mb-2">Komponentai ({parsedData.components.length} vnt.):</p>
                                                {parsedData.components.map((item, index) => (
                                                    <div key={index} className={`flex justify-between items-center ${!item.exists ? 'text-orange-500' : ''}`} title={!item.exists ? "Šio komponento nėra bendrame sąraše. Jis nebus importuotas." : ""}>
                                                        <span>{index + 1}. {item.name} - <strong>{item.requiredQuantity} vnt.</strong></span>
                                                        {!item.exists && <Badge variant="outline" className="text-xs border-orange-500">Naujas</Badge>}
                                                    </div>
                                                ))}
                                                {parsedData.components.length === 0 && <p className="text-muted-foreground text-center py-2">Komponentų nerasta.</p>}
                                            </div>
                                             {parsedData.components.some(c => !c.exists) && (
                                                <p className="text-xs text-orange-600 mt-2">
                                                   Dėmesio: komponentai, pažymėti "Naujas", nebus importuoti, nes jų nėra bendrame komponentų sąraše. Pirmiausia juos pridėkite per komponentų valdymo langą.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-shrink-0">
                        <Button type="button" variant="outline" onClick={handleClose}>Atšaukti</Button>
                        <Button 
                            type="button" 
                            onClick={handleImport} 
                            disabled={!parsedData || !parsedData.subassemblyName || isLoading}
                        >
                            Importuoti Subasemblį
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    export default ExcelImportDialog;
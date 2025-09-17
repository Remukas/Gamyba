import React, { useState, useCallback, useEffect } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import * as XLSX from 'xlsx';
    import { Upload, FileText, CheckCircle, Sheet, Columns, Component, Package } from 'lucide-react';

    const ExcelUpdateDialog = ({ open, onOpenChange, onImport }) => {
        const [file, setFile] = useState(null);
        const [workbook, setWorkbook] = useState(null);
        const [sheetNames, setSheetNames] = useState([]);
        const [selectedSheet, setSelectedSheet] = useState('');
        
        const [nameCol, setNameCol] = useState('A');
        const [quantityCol, setQuantityCol] = useState('B');
        const [startRow, setStartRow] = useState('2');
        
        const [parsedData, setParsedData] = useState(null);

        const [isLoading, setIsLoading] = useState(false);
        const { toast } = useToast();


        const resetState = useCallback(() => {
            setFile(null);
            setWorkbook(null);
            setSheetNames([]);
            setSelectedSheet('');
            setNameCol('A');
            setQuantityCol('B');
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
                
                const nameColIndex = XLSX.utils.decode_col(nameCol.toUpperCase());
                const quantityColIndex = XLSX.utils.decode_col(quantityCol.toUpperCase());
                const firstRow = parseInt(startRow, 10);

                if (isNaN(firstRow) || firstRow < 1) {
                    toast({ title: "Klaida", description: `Neteisingas pradžios eilutės numeris.`, variant: "destructive" });
                    setIsLoading(false);
                    return;
                }

                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
                
                const extractedItems = data
                    .slice(firstRow - 1)
                    .map(row => ({ name: row[nameColIndex], quantity: row[quantityColIndex] }))
                    .filter(item => item.name && String(item.name).trim() !== '' && item.quantity !== undefined && !isNaN(Number(item.quantity)) && Number(item.quantity) >= 0)
                    .map(item => ({
                        name: String(item.name).trim(),
                        quantity: Number(item.quantity)
                    }));

                if (extractedItems.length === 0) {
                     toast({ title: "Duomenų nerasta", description: `Nurodytuose stulpeliuose nerasta tinkamų įrašų.`, variant: "destructive" });
                }
                
                setParsedData(extractedItems);
                toast({ title: "Duomenys nuskaityti", description: `Rasta ${extractedItems.length} įrašų atnaujinimui.` });

            } catch (error) {
                console.error("Parsing error:", error);
                toast({ title: "Analizės klaida", description: "Nepavyko apdoroti nurodytų laukų.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }

        }, [workbook, selectedSheet, nameCol, quantityCol, startRow, toast]);
        
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
            if (parsedData && parsedData.length > 0) {
                onImport(parsedData);
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
                <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Atnaujinti likučius iš Excel</DialogTitle>
                        <DialogDescription>
                            Importuokite failą, kad masiškai atnaujintumėte komponentų ir subasemblių likučius.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4 px-1 overflow-y-auto flex-1">
                        <div className="space-y-2">
                             <Label htmlFor="excel-file-update" className="text-base font-semibold">1. Įkelkite Excel failą</Label>
                             <div className="flex items-center gap-4">
                                <Input id="excel-file-update" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                                <Label htmlFor="excel-file-update" className="flex-1 cursor-pointer">
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
                                        <SelectTrigger id="sheet-select-update">
                                            <SelectValue placeholder="Pasirinkite lapą" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sheetNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                      <Label className="text-base font-semibold mb-2 block">Duomenų stulpeliai</Label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="item-name-col" className="flex items-center gap-2 font-semibold"><Component className="h-4 w-4"/>Pavadinimų stulpelis</Label>
                                            <Input id="item-name-col" value={nameCol} onChange={(e) => setNameCol(e.target.value.toUpperCase())} placeholder="Pvz., A" disabled={isLoading} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="item-qty-col" className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4"/>Likučio stulpelis</Label>
                                            <Input id="item-qty-col" value={quantityCol} onChange={(e) => setQuantityCol(e.target.value.toUpperCase())} placeholder="Pvz., B" disabled={isLoading} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="update-start-row" className="flex items-center gap-2 font-semibold"><Columns className="h-4 w-4"/>Pradžios eilutė</Label>
                                            <Input id="update-start-row" type="number" value={startRow} onChange={(e) => setStartRow(e.target.value)} placeholder="Pvz., 2" disabled={isLoading} />
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
                                            <div className="max-h-48 overflow-y-auto border rounded-md p-3 text-sm shadow-inner space-y-1">
                                                <p className="font-semibold mb-2">Įrašai atnaujinimui ({parsedData.length} vnt.):</p>
                                                {parsedData.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span>{index + 1}. {item.name}</span>
                                                        <strong>{item.quantity} vnt.</strong>
                                                    </div>
                                                ))}
                                                {parsedData.length === 0 && <p className="text-muted-foreground text-center py-2">Įrašų nerasta.</p>}
                                            </div>
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
                            disabled={!parsedData || parsedData.length === 0 || isLoading}
                        >
                            Importuoti Likučius
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    export default ExcelUpdateDialog;
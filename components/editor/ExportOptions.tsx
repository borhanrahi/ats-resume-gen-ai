'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Settings, 
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeBlock } from '@/types/editor';
import { 
  PDFExportOptions, 
  DOCXExportOptions, 
  exportToPDF, 
  exportToDOCX, 
  ExportResult 
} from '@/lib/utils/exportUtils';

interface ExportOptionsProps {
  blocks: ResumeBlock[];
  isOpen: boolean;
  onClose: () => void;
  onExportComplete?: (result: ExportResult) => void;
  className?: string;
}

export function ExportOptions({
  blocks,
  isOpen,
  onClose,
  onExportComplete,
  className = ''
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');
  
  const [pdfOptions, setPdfOptions] = useState<Partial<PDFExportOptions>>({
    quality: 'high',
    paperSize: 'a4',
    orientation: 'portrait',
    margins: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15
    },
    enableLinks: true,
    imageQuality: 0.95,
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    }
  });

  const [docxOptions, setDocxOptions] = useState<Partial<DOCXExportOptions>>({
    quality: 'high',
    paperSize: 'a4',
    orientation: 'portrait',
    margins: {
      top: 25,
      right: 25,
      bottom: 25,
      left: 25
    },
    includePageNumbers: true,
    fontFamily: 'Calibri',
    fontSize: 11,
    lineSpacing: 1.15
  });

  const [customFilename, setCustomFilename] = useState('');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      let result: ExportResult;

      if (exportFormat === 'pdf') {
        const exportOptions: Partial<PDFExportOptions> = {
          ...pdfOptions,
          filename: customFilename || undefined
        };
        result = await exportToPDF(blocks, exportOptions);
      } else {
        const exportOptions: Partial<DOCXExportOptions> = {
          ...docxOptions,
          filename: customFilename || undefined
        };
        result = await exportToDOCX(blocks, exportOptions);
      }

      setExportResult(result);
      
      if (onExportComplete) {
        onExportComplete(result);
      }

      if (result.success) {
        // Auto-close after successful export on mobile
        if (isMobile) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      setExportResult({
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const updatePdfOptions = (updates: Partial<PDFExportOptions>) => {
    setPdfOptions(prev => ({ ...prev, ...updates }));
  };

  const updateDocxOptions = (updates: Partial<DOCXExportOptions>) => {
    setDocxOptions(prev => ({ ...prev, ...updates }));
  };

  const updateMargins = (side: keyof PDFExportOptions['margins'], value: number) => {
    if (exportFormat === 'pdf') {
      setPdfOptions(prev => ({
        ...prev,
        margins: {
          ...prev.margins!,
          [side]: value
        }
      }));
    } else {
      setDocxOptions(prev => ({
        ...prev,
        margins: {
          ...prev.margins!,
          [side]: value
        }
      }));
    }
  };

  const currentOptions = exportFormat === 'pdf' ? pdfOptions : docxOptions;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-2xl max-h-[90vh] overflow-auto ${className}`}
        >
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Resume
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Export Result */}
              <AnimatePresence>
                {exportResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                      exportResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {exportResult.success ? (
                      <Check className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      {exportResult.success ? (
                        <div>
                          <div className="font-medium">Export successful!</div>
                          <div className="text-sm opacity-80">
                            Downloaded as: {exportResult.filename}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">Export failed</div>
                          <div className="text-sm opacity-80">
                            {exportResult.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  File Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Export Format</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={(value: 'pdf' | 'docx') => setExportFormat(value)}
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="docx">Word Document (DOCX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filename">Custom Filename (optional)</Label>
                    <Input
                      id="filename"
                      placeholder="My_Resume"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quality">Export Quality</Label>
                    <Select
                      value={currentOptions.quality}
                      onValueChange={(value: 'low' | 'medium' | 'high') => {
                        if (exportFormat === 'pdf') {
                          updatePdfOptions({ quality: value });
                        } else {
                          updateDocxOptions({ quality: value });
                        }
                      }}
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Better Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Page Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Page Settings
                </h3>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic" className="min-h-[44px]">Basic</TabsTrigger>
                    <TabsTrigger value="advanced" className="min-h-[44px]">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paperSize">Paper Size</Label>
                        <Select
                          value={currentOptions.paperSize}
                          onValueChange={(value: 'a4' | 'letter') => {
                            if (exportFormat === 'pdf') {
                              updatePdfOptions({ paperSize: value });
                            } else {
                              updateDocxOptions({ paperSize: value });
                            }
                          }}
                        >
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                            <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="orientation">Orientation</Label>
                        <Select
                          value={currentOptions.orientation}
                          onValueChange={(value: 'portrait' | 'landscape') => {
                            if (exportFormat === 'pdf') {
                              updatePdfOptions({ orientation: value });
                            } else {
                              updateDocxOptions({ orientation: value });
                            }
                          }}
                        >
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Margins */}
                    <div className="space-y-3">
                      <Label>Margins (mm)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                          <div key={side} className="space-y-2">
                            <Label className="text-sm capitalize">{side}</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[currentOptions.margins?.[side] || (exportFormat === 'pdf' ? 15 : 25)]}
                                onValueChange={([value]) => updateMargins(side, value)}
                                max={50}
                                min={5}
                                step={1}
                                className="w-full"
                              />
                              <div className="text-xs text-center text-gray-500">
                                {currentOptions.margins?.[side] || (exportFormat === 'pdf' ? 15 : 25)}mm
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    {exportFormat === 'pdf' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="enableLinks">Enable Clickable Links</Label>
                            <p className="text-sm text-gray-500">
                              Make email and website links clickable in PDF
                            </p>
                          </div>
                          <Switch
                            id="enableLinks"
                            checked={pdfOptions.enableLinks}
                            onCheckedChange={(checked) => updatePdfOptions({ enableLinks: checked })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Image Quality</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[pdfOptions.imageQuality || 0.95]}
                              onValueChange={([value]) => updatePdfOptions({ imageQuality: value })}
                              max={1}
                              min={0.1}
                              step={0.05}
                              className="w-full"
                            />
                            <div className="text-xs text-center text-gray-500">
                              {Math.round((pdfOptions.imageQuality || 0.95) * 100)}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Render Scale</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[pdfOptions.html2canvas?.scale || 2]}
                              onValueChange={([value]) => updatePdfOptions({ 
                                html2canvas: { ...pdfOptions.html2canvas!, scale: value }
                              })}
                              max={4}
                              min={1}
                              step={0.5}
                              className="w-full"
                            />
                            <div className="text-xs text-center text-gray-500">
                              {pdfOptions.html2canvas?.scale || 2}x
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Higher scale = better quality but slower export
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="includePageNumbers">Include Page Numbers</Label>
                            <p className="text-sm text-gray-500">
                              Add page numbers to the document footer
                            </p>
                          </div>
                          <Switch
                            id="includePageNumbers"
                            checked={docxOptions.includePageNumbers}
                            onCheckedChange={(checked) => updateDocxOptions({ includePageNumbers: checked })}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fontFamily">Font Family</Label>
                            <Select
                              value={docxOptions.fontFamily}
                              onValueChange={(value) => updateDocxOptions({ fontFamily: value })}
                            >
                              <SelectTrigger className="min-h-[44px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Calibri">Calibri</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Font Size</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[docxOptions.fontSize || 11]}
                                onValueChange={([value]) => updateDocxOptions({ fontSize: value })}
                                max={16}
                                min={8}
                                step={1}
                                className="w-full"
                              />
                              <div className="text-xs text-center text-gray-500">
                                {docxOptions.fontSize || 11}pt
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Line Spacing</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[docxOptions.lineSpacing || 1.15]}
                              onValueChange={([value]) => updateDocxOptions({ lineSpacing: value })}
                              max={2}
                              min={1}
                              step={0.05}
                              className="w-full"
                            />
                            <div className="text-xs text-center text-gray-500">
                              {docxOptions.lineSpacing || 1.15}x
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Export Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 min-h-[44px]"
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || blocks.length === 0}
                  className="flex-1 min-h-[44px]"
                >
                  {isExporting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2"
                      >
                        <Settings className="w-4 h-4" />
                      </motion.div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
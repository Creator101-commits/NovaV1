import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useColorCustomization, BACKGROUND_THEMES } from '@/contexts/ColorCustomizationContext';
import { ThemeColorPicker, ColorPicker } from '@/components/ui/color-picker';
import { Palette, RotateCcw, Eye, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ColorCustomizationSettings = () => {
  const { customization, updateCustomization, resetToDefault } = useColorCustomization();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const handleBackgroundThemeChange = (theme: string) => {
    updateCustomization({ backgroundTheme: theme as any });
  };

  const handleCustomBackgroundChange = (color: string) => {
    updateCustomization({ customBackgroundColor: color });
  };

  const handleReset = () => {
    resetToDefault();
    toast({
      title: "Colors Reset",
      description: "Your color customization has been reset to default.",
    });
  };

  const handleExportSettings = () => {
    const settings = JSON.stringify(customization, null, 2);
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refyneo-color-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Your color settings have been exported successfully.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          updateCustomization(importedSettings);
          toast({
            title: "Settings Imported",
            description: "Your color settings have been imported successfully.",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to import settings. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Background Theme
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred theme
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs"
        >
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          Reset
        </Button>
      </div>

      {/* Enhanced Preview */}
      {showPreview && (
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <p className="text-muted-foreground">
              See how your theme looks in action
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="w-full h-12 text-base font-medium">Primary Action</Button>
              <Button variant="secondary" className="w-full h-12 text-base font-medium">Secondary Action</Button>
              <Button variant="outline" className="w-full h-12 text-base font-medium">Outline Action</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-lg">Sample Card</h4>
                <p className="text-muted-foreground mb-3">
                  This is how your content cards will appear with the selected theme.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Action</Button>
                  <Button size="sm" variant="outline">Cancel</Button>
                </div>
              </Card>
              
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-2 text-lg">Muted Card</h4>
                <p className="text-muted-foreground mb-3">
                  Secondary content areas use muted backgrounds for hierarchy.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Action</Button>
                  <Button size="sm" variant="ghost">Cancel</Button>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Background Themes */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(BACKGROUND_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleBackgroundThemeChange(key)}
              className={`relative p-3 rounded-lg border transition-colors ${
                customization.backgroundTheme === key 
                  ? 'border-primary ring-1 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
              style={{
                backgroundColor: theme.background,
                color: theme.foreground,
              }}
            >
              <div className="text-center">
                <div className="text-sm font-medium">{theme.name}</div>
              </div>
              {customization.backgroundTheme === key && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Custom Color */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Background Color</Label>
          <div className="flex gap-2">
            <ColorPicker
              value={customization.customBackgroundColor || '#000000'}
              onChange={handleCustomBackgroundChange}
              showCustomInput={true}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCustomization({ customBackgroundColor: undefined })}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

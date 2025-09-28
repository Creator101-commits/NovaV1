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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Background Themes
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose a beautiful background theme that matches your style and improves your productivity experience
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide' : 'Show'} Live Preview
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
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
      <Card className="border-2">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Palette className="w-5 h-5" />
            Choose Your Background Theme
          </CardTitle>
          <p className="text-muted-foreground">
            Select a theme that feels right for your productivity journey
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(BACKGROUND_THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleBackgroundThemeChange(key)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  customization.backgroundTheme === key 
                    ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.foreground,
                }}
              >
                <div className="text-center">
                  <div className="text-sm font-semibold mb-1">{theme.name}</div>
                  <div className="text-xs opacity-80">Theme Preview</div>
                </div>
                {customization.backgroundTheme === key && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="text-center">
              <Label className="text-lg font-medium">Custom Background Color</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Want something unique? Set a custom background color
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <ColorPicker
                value={customization.customBackgroundColor || '#000000'}
                onChange={handleCustomBackgroundChange}
                showCustomInput={true}
              />
              <Button
                variant="outline"
                onClick={() => updateCustomization({ customBackgroundColor: undefined })}
                className="flex items-center gap-2"
              >
                Clear Custom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Settings Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Backup & Restore
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Save your settings or restore from a backup
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleExportSettings}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Info */}
        <Card className="border-2 bg-gradient-to-br from-muted/30 to-muted/10">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Current Theme</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your active customization settings
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="font-medium">Background Theme:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: BACKGROUND_THEMES[customization.backgroundTheme].background }}
                />
                <span className="text-sm">{BACKGROUND_THEMES[customization.backgroundTheme].name}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="font-medium">Custom Background:</span>
              <div className="flex items-center gap-2">
                {customization.customBackgroundColor ? (
                  <>
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: customization.customBackgroundColor }}
                    />
                    <span className="text-sm text-green-600">Active</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Not set</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

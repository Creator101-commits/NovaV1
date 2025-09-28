import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorCustomizationSettings } from '@/components/ColorCustomizationSettings';
import { GoogleSyncSettings } from '@/components/GoogleSyncSettings';
import { Palette, Settings as SettingsIcon, RefreshCw, User } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 max-w-6xl px-4">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Customize your Refyneo experience with personalized settings and preferences
          </p>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="appearance" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger 
              value="sync" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Google Sync
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-8">
            <ColorCustomizationSettings />
          </TabsContent>

          <TabsContent value="sync" className="space-y-8">
            <GoogleSyncSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-8">
            <Card className="border-2 border-dashed">
              <CardHeader className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-12">
                <p className="text-muted-foreground mb-4">
                  Account management features are coming soon!
                </p>
                <p className="text-sm text-muted-foreground">
                  We're working on profile management, security settings, and more.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

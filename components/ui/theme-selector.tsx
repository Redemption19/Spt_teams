'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'light' as const,
      name: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
      preview: 'bg-white border-gray-200',
      contentPreview: 'bg-gray-50'
    },
    {
      id: 'dark' as const,
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
      contentPreview: 'bg-gray-800'
    },
    {
      id: 'system' as const,
      name: 'System',
      description: 'Adapts to your system preference',
      icon: Monitor,
      preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400',
      contentPreview: 'bg-gradient-to-br from-gray-50 to-gray-800'
    }
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Theme Preference</Label>
      <div className="grid grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.id;
          
          return (
            <div
              key={themeOption.id}
              className={`relative cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => setTheme(themeOption.id)}
            >
              <Card className={`border-2 ${isSelected ? 'border-primary' : 'border-border'} hover:border-primary/50 transition-colors`}>
                <CardContent className="p-4 space-y-3">
                  {/* Theme Preview */}
                  <div className={`h-16 rounded-md border-2 ${themeOption.preview} relative overflow-hidden`}>
                    <div className={`h-4 ${themeOption.contentPreview} m-2 rounded`}></div>
                    <div className={`h-2 ${themeOption.contentPreview} mx-2 mb-2 rounded w-3/4`}></div>
                    <div className={`h-2 ${themeOption.contentPreview} mx-2 rounded w-1/2`}></div>
                  </div>
                  
                  {/* Theme Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{themeOption.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

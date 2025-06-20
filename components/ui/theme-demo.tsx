'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useTheme } from '@/lib/theme-context';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';

export function ThemeDemo() {
  const { theme, actualTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Theme System Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Experience our comprehensive light and dark mode implementation
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-2">
              {theme === 'light' && <Sun className="h-3 w-3" />}
              {theme === 'dark' && <Moon className="h-3 w-3" />}
              {theme === 'system' && <Monitor className="h-3 w-3" />}
              <span>Current: {theme}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-2">
              <Palette className="h-3 w-3" />
              <span>Active: {actualTheme}</span>
            </Badge>
            <ThemeToggle variant="button" />
          </div>
        </div>

        {/* Theme Selector */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-primary" />
              <span>Theme Selector</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        {/* Color Palette Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Brand Colors */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Primary</span>
                  <div className="w-8 h-8 bg-primary rounded-md"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accent</span>
                  <div className="w-8 h-8 bg-accent rounded-md"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-primary to-accent rounded-md"></div>
              </div>
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                Brand Gradient Button
              </Button>
            </CardContent>
          </Card>

          {/* Semantic Colors */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Semantic Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Background</span>
                  <div className="w-8 h-8 bg-background border rounded-md"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Card</span>
                  <div className="w-8 h-8 bg-card border rounded-md"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Muted</span>
                  <div className="w-8 h-8 bg-muted rounded-md"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Elements */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Interactive Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                  Brand Badge
                </Badge>
              </div>
              <div className="space-y-2">
                <Button size="sm" className="w-full">Small Button</Button>
                <Button size="default" className="w-full">Default Button</Button>
                <Button size="lg" className="w-full">Large Button</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Typography Demo */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Typography & Text Colors</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Heading 1</h1>
                <h2 className="text-2xl font-semibold text-foreground">Heading 2</h2>
                <h3 className="text-xl font-medium text-foreground">Heading 3</h3>
                <p className="text-foreground">Regular paragraph text</p>
                <p className="text-muted-foreground">Muted text for descriptions</p>
              </div>
              <div className="space-y-2">
                <p className="text-primary font-semibold">Primary text color</p>
                <p className="text-accent font-semibold">Accent text color</p>
                <p className="text-destructive">Destructive/Error text</p>
                <p className="text-sm text-muted-foreground">Small muted text</p>
                <p className="text-xs text-muted-foreground">Extra small text</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Information */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Theme System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">✨ Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Automatic system theme detection</li>
                  <li>• Persistent theme preference storage</li>
                  <li>• Smooth theme transitions</li>
                  <li>• Brand color integration</li>
                  <li>• Accessible color contrasts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">🎨 Brand Colors</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Primary: Deep Maroon (#8A0F3C)</li>
                  <li>• Accent: Bright Crimson (#CF163C)</li>
                  <li>• Optimized for both light and dark modes</li>
                  <li>• Consistent across all components</li>
                  <li>• WCAG compliant contrast ratios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

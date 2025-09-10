'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n-context';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as any)}>
      <SelectTrigger className="border-border bg-background focus:ring-primary focus:border-primary">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="fr">French</SelectItem>
        <SelectItem value="tw">Twi</SelectItem>
        <SelectItem value="ga">Ga</SelectItem>
      </SelectContent>
    </Select>
  );
}



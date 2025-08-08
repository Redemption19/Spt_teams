import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BRAND_COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}) => {
  const getPaddingStyle = (padding: string) => {
    switch (padding) {
      case 'sm':
        return styles.paddingSm;
      case 'md':
        return styles.paddingMd;
      case 'lg':
        return styles.paddingLg;
      default:
        return styles.paddingMd;
    }
  };

  const cardStyle = [
    styles.base,
    styles[variant],
    getPaddingStyle(padding),
    style,
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
  },
  default: {
    ...SHADOWS.sm,
  },
  elevated: {
    ...SHADOWS.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paddingSm: {
    padding: SPACING.sm,
  },
  paddingMd: {
    padding: SPACING.md,
  },
  paddingLg: {
    padding: SPACING.lg,
  },
});

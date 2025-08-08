'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { validatePassword } from '@/lib/auth-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showIndicator?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showIndicator = true,
  className = '' 
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState({
    isValid: false,
    errors: [] as string[],
    strength: 'weak' as 'weak' | 'medium' | 'strong'
  });

  useEffect(() => {
    if (password) {
      setStrength(validatePassword(password));
    } else {
      setStrength({
        isValid: false,
        errors: [],
        strength: 'weak'
      });
    }
  }, [password]);

  if (!showIndicator || !password) {
    return null;
  }

  const getStrengthColor = () => {
    if (strength.strength === 'weak') return 'text-red-500';
    if (strength.strength === 'medium') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthText = () => {
    if (strength.strength === 'weak') return 'Weak';
    if (strength.strength === 'medium') return 'Medium';
    return 'Strong';
  };

  const getProgressColor = () => {
    if (strength.strength === 'weak') return 'bg-red-500';
    if (strength.strength === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${strength.strength === 'weak' ? 33 : strength.strength === 'medium' ? 66 : 100}%` }}
        />
      </div>

      {/* Strength Text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${getStrengthColor()}`}>
          {getStrengthText()}
        </span>
      </div>

      {/* Requirements List */}
      {password && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">Requirements:</p>
          <div className="space-y-1">
            <RequirementItem
              met={password.length >= 8}
              text="At least 8 characters"
            />
            <RequirementItem
              met={/[a-z]/.test(password)}
              text="Include lowercase letters"
            />
            <RequirementItem
              met={/[A-Z]/.test(password)}
              text="Include uppercase letters"
            />
            <RequirementItem
              met={/\d/.test(password)}
              text="Include numbers"
            />
            <RequirementItem
              met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
              text="Include special characters"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className="flex items-center space-x-2 text-xs">
      {met ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500" />
      )}
      <span className={met ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
        {text}
      </span>
    </div>
  );
}

// Simplified version for inline use
export function InlinePasswordStrength({ password }: { password: string }) {
  const [strength, setStrength] = useState({
    isValid: false,
    errors: [] as string[],
    strength: 'weak' as 'weak' | 'medium' | 'strong'
  });

  useEffect(() => {
    if (password) {
      setStrength(validatePassword(password));
    }
  }, [password]);

  if (!password) return null;

  const getStrengthColor = () => {
    if (strength.strength === 'weak') return 'text-red-500';
    if (strength.strength === 'medium') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthText = () => {
    if (strength.strength === 'weak') return 'Weak';
    if (strength.strength === 'medium') return 'Medium';
    return 'Strong';
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${getStrengthColor().replace('text-', 'bg-')}`} />
      <span className={getStrengthColor()}>{getStrengthText()}</span>
    </div>
  );
}

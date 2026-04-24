'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
}

export function LoadingSpinner({ fullPage = true }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex items-center justify-center ${fullPage ? 'min-h-screen bg-white dark:bg-slate-950' : 'p-8'}`}>
      <Loader2 className="w-12 h-12 animate-spin text-slate-900 dark:text-white" />
    </div>
  );

  return spinner;
}

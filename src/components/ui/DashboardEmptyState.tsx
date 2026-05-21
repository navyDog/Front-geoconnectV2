import React from 'react';
import { Card, CardContent } from './Card';

interface DashboardEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * État vide générique pour les onglets du tableau de bord client.
 */
export function DashboardEmptyState({ icon, title, description, action }: DashboardEmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className={`text-slate-500 ${action ? 'mb-6' : ''}`}>{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

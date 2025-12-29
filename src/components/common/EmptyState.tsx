import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon: Icon = PackageOpen,
    title,
    description,
    actionLabel,
    onAction
}: EmptyStateProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Icon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <p className="text-secondary-600 text-lg mb-2">{title}</p>
            {description && (
                <p className="text-secondary-500 text-sm mb-4">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

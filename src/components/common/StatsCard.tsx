import React from 'react';
import { LucideIcon } from 'lucide-react';

export type StatsCardTheme = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    theme?: StatsCardTheme;
}

const themeStyles: Record<StatsCardTheme, { text: string; bg?: string }> = {
    default: { text: 'text-secondary-800' },
    primary: { text: 'text-primary-600' },
    success: { text: 'text-green-600' },
    warning: { text: 'text-yellow-600' },
    error: { text: 'text-red-600' }
};

export default function StatsCard({ label, value, icon: Icon, theme = 'default' }: StatsCardProps) {
    const themeStyle = themeStyles[theme];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-secondary-600">{label}</p>
                    <p className={`text-2xl font-bold ${themeStyle.text}`}>{value}</p>
                </div>
                {Icon && (
                    <Icon className={`w-8 h-8 ${themeStyle.text} opacity-50`} />
                )}
            </div>
        </div>
    );
}

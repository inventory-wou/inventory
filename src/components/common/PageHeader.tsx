import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from './Button';

interface PageHeaderAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    icon?: React.ComponentType<{ className?: string }>;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    backButtonLabel?: string;
    backUrl?: string;
    actions?: PageHeaderAction[];
}

export default function PageHeader({
    title,
    subtitle,
    showBackButton = false,
    backButtonLabel = 'Back to Dashboard',
    backUrl = '/dashboard/admin',
    actions = []
}: PageHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (backUrl) {
            router.push(backUrl);
        } else {
            router.back();
        }
    };

    return (
        <header className="bg-white border-b border-secondary-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-800">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-secondary-600 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || 'primary'}
                                onClick={action.onClick}
                                icon={action.icon as any}
                            >
                                {action.label}
                            </Button>
                        ))}
                        {showBackButton && (
                            <Button
                                variant="secondary"
                                onClick={handleBack}
                                icon={ArrowLeft}
                            >
                                {backButtonLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

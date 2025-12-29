import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-white hover:bg-secondary-50 text-secondary-700 border border-secondary-300'
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
};

const iconSizeStyles: Record<ButtonSize, string> = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
};

export default function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    const iconSizeClass = iconSizeStyles[size];

    return (
        <button
            className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <div className={`border-2 border-current border-t-transparent rounded-full animate-spin ${iconSizeClass}`} />
            )}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon className={iconSizeClass} />
            )}
            {children}
            {!loading && Icon && iconPosition === 'right' && (
                <Icon className={iconSizeClass} />
            )}
        </button>
    );
}

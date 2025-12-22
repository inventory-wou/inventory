import Link from 'next/link';

interface DepartmentCardProps {
    id: string;
    name: string;
    description: string;
    itemCount: number;
    icon?: string;
}

export default function DepartmentCard({ id, name, description, itemCount, icon }: DepartmentCardProps) {
    // Icon mapping based on department
    const getIcon = () => {
        if (icon === 'ROBO') {
            return (
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            );
        } else if (icon === 'AI') {
            return (
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            );
        } else if (icon === 'META') {
            return (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            );
        }
        return (
            <svg className="w-12 h-12 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        );
    };

    return (
        <Link href={`/dashboard/user/browse/${id}`}>
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl border border-secondary-200 hover:border-primary-400 transition-all p-6 cursor-pointer">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-secondary-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {name}
                        </h3>
                        <p className="text-sm text-secondary-600 mb-4">
                            {description}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                    {itemCount} items
                                </span>
                            </div>
                            <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

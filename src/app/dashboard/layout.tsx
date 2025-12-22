import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-secondary-50">
            <Header />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
}

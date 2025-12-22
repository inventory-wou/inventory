export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-bold mb-3">WoU Inventory Management</h3>
                        <p className="text-secondary-300 text-sm">
                            A comprehensive inventory management system for Robotics Lab, AI Research Centre, and Metaverse Lab at Woxsen University.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-3">Departments</h3>
                        <ul className="space-y-2 text-sm text-secondary-300">
                            <li>• Robotics Lab (ROBO)</li>
                            <li>• AI Research Centre (AI)</li>
                            <li>• Metaverse Lab (META)</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-3">Contact Us</h3>
                        <div className="space-y-2 text-sm text-secondary-300">
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href="mailto:inventory_wou@woxsen.edu.in" className="hover:text-white transition-colors">
                                    inventory_wou@woxsen.edu.in
                                </a>
                            </p>
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Woxsen University, Telangana
                            </p>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-secondary-700 mt-8 pt-6 text-center text-sm text-secondary-400">
                    <p>© {currentYear} Woxsen University. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function Home() {
  // Check if user is logged in
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect based on role
    if (session.user.role === 'ADMIN') redirect('/dashboard/admin');
    if (session.user.role === 'INCHARGE') redirect('/dashboard/incharge');
    if (session.user.role === 'FACULTY') redirect('/dashboard/faculty');
    if (session.user.role === 'STAFF') redirect('/dashboard/staff');
    if (session.user.role === 'STUDENT') redirect('/dashboard/student');
    // Fallback for any other role
    redirect('/dashboard');
  }

  // Show public home page
  return (
    <div className="min-h-screen flex flex-col bg-gradient-light">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              WoU Inventory Management System
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Streamline your lab equipment management at Woxsen University
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-primary-700 text-white rounded-lg font-bold text-lg hover:bg-primary-600 border-2 border-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-secondary-800 mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-secondary-800 mb-2">Easy Item Requests</h3>
                <p className="text-secondary-600">
                  Browse available equipment and submit requests online. Track your requests in real-time.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-secondary-800 mb-2">Quick Approval</h3>
                <p className="text-secondary-600">
                  Fast approval process by lab incharges. Get notified via email instantly.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-secondary-800 mb-2">Department-wise Access</h3>
                <p className="text-secondary-600">
                  Access equipment from Robotics Lab, AI Research Centre, and Metaverse Lab.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Can Register */}
        <section className="py-16 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-secondary-800 mb-12">
              Who Can Register?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
                <h3 className="text-xl font-bold text-blue-600 mb-3">Students</h3>
                <p className="text-secondary-600 mb-4">
                  All Woxsen University students can register to request lab equipment for projects and assignments.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>✓ Request equipment</li>
                  <li>✓ Track borrowed items</li>
                  <li>✓ View return deadlines</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
                <h3 className="text-xl font-bold text-green-600 mb-3">Faculty</h3>
                <p className="text-secondary-600 mb-4">
                  Faculty members have extended access to equipment for teaching and research purposes.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>✓ Extended borrow duration</li>
                  <li>✓ Priority approvals</li>
                  <li>✓ Multiple items</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
                <h3 className="text-xl font-bold text-purple-600 mb-3">Staff</h3>
                <p className="text-secondary-600 mb-4">
                  University staff can access equipment for administrative and support activities.
                </p>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>✓ Request equipment</li>
                  <li>✓ Extended duration</li>
                  <li>✓ Department access</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-secondary-800 mb-12">
              How to Use the System
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-800 mb-1">Register Your Account</h3>
                  <p className="text-secondary-600">
                    Click "Register" and fill in your details. Select your user type (Student, Faculty, or Staff). Wait for admin approval.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-800 mb-1">Browse Available Items</h3>
                  <p className="text-secondary-600">
                    Once approved, login and browse items by department. View equipment details, availability, and specifications.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-800 mb-1">Submit Request</h3>
                  <p className="text-secondary-600">
                    Click on an item and submit a request with purpose and duration. Lab incharge will review and approve.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-800 mb-1">Collect & Return</h3>
                  <p className="text-secondary-600">
                    After approval, collect the item from the lab. Return it on or before the due date to avoid penalties.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/register"
                className="inline-block px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-lg transition-colors"
              >
                Register Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

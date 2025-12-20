import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/register', '/api/auth'];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    // If accessing public path, allow
    if (isPublicPath) {
        return NextResponse.next();
    }

    // If not authenticated, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const isAdminPath = pathname.startsWith('/dashboard/admin');
    const isInchargePath = pathname.startsWith('/dashboard/incharge');

    if (isAdminPath && token.role !== 'ADMIN') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    if (isInchargePath && token.role !== 'INCHARGE' && token.role !== 'ADMIN') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { query } from '@/lib/db';
import { isValidRole } from '@/lib/rbac';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/dashboard/login',
    error: '/dashboard/login',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Check if this Google email matches an active staff member
      const result = await query(
        'SELECT id, role FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
        [user.email],
      );

      if (!result.rows || result.rows.length === 0) {
        // Not a staff member — deny access
        return '/dashboard/login?error=not_staff';
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in or when session is refreshed, load staff data
      if (user?.email || trigger === 'update') {
        const email = user?.email || token.email;
        if (email) {
          const result = await query(
            'SELECT id, email, name, role, phone FROM al_staff WHERE LOWER(email) = LOWER($1) AND active = true LIMIT 1',
            [email],
          );

          if (result.rows && result.rows.length > 0) {
            const staff = result.rows[0];
            token.staffId = staff.id;
            token.staffEmail = staff.email;
            token.staffName = staff.name;
            token.role = isValidRole(staff.role) ? staff.role : 'agent';
            token.phone = staff.phone || undefined;

            // Update last_login
            await query('UPDATE al_staff SET last_login = NOW() WHERE id = $1', [staff.id]);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose staff data in the session
      if (token.staffId) {
        session.user.staffId = token.staffId as string;
        session.user.role = token.role as string;
        session.user.staffName = token.staffName as string;
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler };

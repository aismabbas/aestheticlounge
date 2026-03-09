import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      staffId?: string;
      role?: string;
      staffName?: string;
      phone?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    staffId?: string;
    staffEmail?: string;
    staffName?: string;
    role?: string;
    phone?: string;
  }
}

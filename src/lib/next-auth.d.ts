import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user object to include id and an optional role.
   */
  interface User {
    id: string;
    role?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT token to include id and an optional role.
   */
  interface JWT {
    id: string;
    role?: string | null;
  }
} 
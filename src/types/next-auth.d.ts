declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
    } & DefaultSession["user"]
  }
  interface User {
    id: string
  }
} 
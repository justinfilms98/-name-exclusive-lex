import "next-auth";

export interface PurchaseHistoryItem {
  id: string;
  purchaseDate: Date;
  expiresAt: Date | null;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailPath: string | null;
    price: number;
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  }
} 
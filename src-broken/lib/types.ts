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
export type BillStatus = 'pending' | 'approved' | 'rejected';

export interface Bill {
  _id: string;
  user: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
  status: BillStatus;
  notes?: string;
  paymentMethod?: string;
  vendor?: string;
  location?: string;
  isBillable?: boolean;
  project?: string;
  createdAt?: string;
  updatedAt?: string;
  receiptUrl?: string;
}

export interface OrderItem {
  itemNo: string;
  code: string;
  description: string;
  location: string;
  quantityOrdered: number;
  unit: string;
}

export interface Order {
  orderId: string;
  requester: string;
  destinationSector: string;
  items: OrderItem[];
  status: 'picking' | 'completed' | 'canceled';
  timestamp: string;
  completionTimestamp?: string; // Hora de término da conferência
  pickedItems?: string[];
  completionStatus?: 'complete' | 'incomplete';
  separator?: string;
  confirmer?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'separator' | 'confirmer';
}
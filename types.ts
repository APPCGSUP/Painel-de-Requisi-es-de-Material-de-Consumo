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
  pickedItems?: string[];
  completionStatus?: 'complete' | 'incomplete';
}
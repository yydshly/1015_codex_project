export interface CartItem { sku: string; quantity: number; unitPrice: number; weight: number }
export interface Customer { id: string; region: "local" | "remote" }
export interface OrderInput { customer: Customer; items: CartItem[]; coupon?: string }
export interface Quote { subtotal: number; discount: number; shipping: number; total: number }
export interface SavedOrder extends Quote { id: string; customerId: string; status: "confirmed" }

export interface Order {
  id: number
  fullName: string
  phonenumber: string
  note: string
  comment: string
  date: string
  discount: number
  offsite: boolean
  chairCount: number
  price: number
  orderTypeName: string
  status: "accepted" | "rejected" | "pending"
  totalPayment: number
  updatedBy: {
    id: number
    firstName: string
    lastName: string
  }
}

export interface OrderType {
  id: number
  name: string
  price: number
  isActive: boolean
  restaurantId: number
}

export interface PaginationParams {
  limit: number
  page: number
  order_direction: "ASC" | "DESC"
  order_by: string
}


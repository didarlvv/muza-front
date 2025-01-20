import axios from "axios"
import type { PaginationParams, User } from "@/types/api"
import StorageService from "@/utils/storage"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "https://srv694284.hstgr.cloud"
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "4041"
const API_BASE = `${API_HOST}:${API_PORT}/api/v1`

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
})

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = StorageService.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post("/authentications/login", { username, password })
    return response.data
  },
}

export const userApi = {
  getUsers: async (params: Partial<PaginationParams> = {}): Promise<User[]> => {
    const defaultParams: PaginationParams = {
      limit: 20,
      page: 1,
      order_direction: "DESC",
      order_by: "id",
      ...params,
    }
    try {
      const response = await api.get("/manager/users", { params: defaultParams })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error("Failed to fetch users:", error)
      return []
    }
  },
  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/manager/users/${id}`)
    return response.data
  },
  createUser: async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    phonenumber: number
    validUntil: string
    role: string
    status: string
  }) => {
    const response = await api.post("/manager/users", data)
    return response.data
  },
  updateUser: async (
    id: number,
    data: {
      firstName?: string
      lastName?: string
      email?: string
      password?: string
      phonenumber?: number
      validUntil?: string
      role?: string
      status?: string
    },
  ) => {
    const response = await api.patch(`/manager/users/${id}`, data)
    return response.data
  },
}

export const restaurantApi = {
  getRestaurants: async (params: Partial<PaginationParams> = {}) => {
    const defaultParams: PaginationParams = {
      limit: 20,
      page: 1,
      order_direction: "DESC",
      order_by: "id",
      ...params,
    }
    const response = await api.get("/restaurants", { params: defaultParams })
    return response.data
  },
  getRestaurantById: async (id: number) => {
    const response = await api.get(`/restaurants/${id}`)
    return response.data
  },
  createRestaurant: async (data: { name: string; slug: string; file: any; userId: number }) => {
    const response = await api.post("/restaurants", data)
    return response.data
  },
  updateRestaurant: async (id: number, data: { name?: string; slug?: string; file?: any; userId?: number }) => {
    const response = await api.patch(`/restaurants/${id}`, data)
    return response.data
  },
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post(`${API_BASE}/files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${StorageService.getItem("token")}`,
      },
    })
    return response.data
  },
}

export const orderTypeApi = {
  getOrderTypes: async (params: Partial<PaginationParams & { restaurantId: number }> = {}) => {
    const defaultParams: PaginationParams & { restaurantId: number } = {
      limit: 20,
      page: 1,
      order_direction: "DESC",
      order_by: "id",
      ...params,
    }
    if (!defaultParams.restaurantId) {
      throw new Error("Restaurant ID is required")
    }
    try {
      const response = await api.get("/order-types", { params: defaultParams })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error("Failed to fetch order types:", error)
      return []
    }
  },
  createOrderType: async (data: {
    name: string
    price: number
    isActive: boolean
    restaurantId: number
  }) => {
    const response = await api.post("/order-types", data)
    return response.data
  },
  updateOrderType: async (
    id: number,
    data: { name?: string; price?: number; isActive?: boolean; restaurantId: number },
  ) => {
    const response = await api.patch(`/order-types/${id}`, data)
    return response.data
  },
  deleteOrderType: async (id: number) => {
    const response = await api.delete(`/order-types/${id}`)
    return response.data
  },
}

export const orderApi = {
  getOrders: async (params: {
    order_by?: string
    search?: string
    order_direction?: "ASC" | "DESC"
    minDate?: string
    maxDate?: string
    restaurantId: number
    status?: string
    orderTypeId?: number
    offsite?: boolean
  }) => {
    try {
      const requestParams = { ...params }
      if (requestParams.status === "all") {
        delete requestParams.status
      }
      const response = await api.get("/orders", { params: requestParams })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      throw error // Re-throw the error to be handled by the component
    }
  },
  updateOrder: async (orderId: string, data: any) => {
    const response = await api.patch(`/orders/${orderId}`, data)
    return response.data
  },
  createOrder: async (data: any) => {
    const response = await api.post("/orders", data)
    return response.data
  },
}


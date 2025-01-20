"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import StorageService from "@/utils/storage"

interface Restaurant {
  id: number
  name: string
}

interface User {
  id: number
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string
  email: string
  phonenumber: number
  isSuperUser: boolean
  validUntil: string
  restaurants: Restaurant[]
}

interface AuthContextType {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  selectedRestaurant: Restaurant | null
  setSelectedRestaurant: (restaurant: Restaurant | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = StorageService.getItem("token")
    const storedUser = StorageService.getItem("user")
    const storedSelectedRestaurant = StorageService.getItem("selectedRestaurant")

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)

      if (storedSelectedRestaurant) {
        setSelectedRestaurant(JSON.parse(storedSelectedRestaurant))
      } else if (parsedUser.restaurants && parsedUser.restaurants.length > 0) {
        setSelectedRestaurant(parsedUser.restaurants[0])
      }
    } else {
      router.push("/login")
    }
  }, [router])

  const login = (token: string, user: User) => {
    StorageService.setItem("token", token)
    StorageService.setItem("user", JSON.stringify(user))
    setUser(user)
    if (user.restaurants && user.restaurants.length > 0) {
      setSelectedRestaurant(user.restaurants[0])
      StorageService.setItem("selectedRestaurant", JSON.stringify(user.restaurants[0]))
    }
  }

  const logout = () => {
    StorageService.removeItem("token")
    StorageService.removeItem("user")
    StorageService.removeItem("selectedRestaurant")
    setUser(null)
    setSelectedRestaurant(null)
    router.push("/login")
  }

  const updateSelectedRestaurant = (restaurant: Restaurant | null) => {
    setSelectedRestaurant(restaurant)
    if (restaurant) {
      StorageService.setItem("selectedRestaurant", JSON.stringify(restaurant))
    } else {
      StorageService.removeItem("selectedRestaurant")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        selectedRestaurant,
        setSelectedRestaurant: updateSelectedRestaurant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


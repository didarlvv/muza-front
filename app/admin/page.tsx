"use client"

import { useEffect, useState } from "react"
import { userApi, restaurantApi } from "@/lib/api"
import type { User, Restaurant } from "../../types/api"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Utensils, ArrowRight } from "lucide-react"

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, restaurantsData] = await Promise.all([userApi.getUsers(), restaurantApi.getRestaurants()])
        setUsers(usersData)
        setRestaurants(restaurantsData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Панель администратора</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{users.length}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего ресторанов</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold">{restaurants.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Последние пользователи</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between space-x-4">
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Link href="/admin/users">
                  <Button variant="link" className="text-primary">
                    Все пользователи
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Последние рестораны</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between space-x-4">
                      <div>
                        <p className="text-sm font-medium leading-none">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Link href="/admin/restaurants">
                  <Button variant="link" className="text-primary">
                    Все рестораны
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}


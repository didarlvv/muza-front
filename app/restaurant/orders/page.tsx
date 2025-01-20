"use client"

import { useState, useEffect } from "react"
import { RestaurantLayout } from "@/components/restaurant-layout"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { orderApi } from "@/lib/api"
import type { Order } from "@/types/api"
import {
  Search,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Clipboard,
  User,
  Percent,
  MessageSquare,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import type { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/date-range-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditOrderForm } from "@/components/edit-order-form"

export default function OrdersPage() {
  const { toast } = useToast()
  const { selectedRestaurant } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  // const [statusFilter, setStatusFilter] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  })
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  const fetchOrders = async () => {
    if (!selectedRestaurant) return
    setIsLoading(true)
    try {
      const data = await orderApi.getOrders({
        order_by: "date",
        order_direction: "ASC",
        search: searchQuery || undefined,
        restaurantId: selectedRestaurant.id,
        // status: statusFilter || undefined,
        minDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        maxDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      })
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      let errorMessage = "Не удалось загрузить заказы"
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`
      }
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedRestaurant) {
      fetchOrders()
    }
  }, [selectedRestaurant, searchQuery, dateRange])

  const groupOrdersByDate = (orders: Order[]) => {
    return orders.reduce(
      (groups, order) => {
        const date = order.date
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(order)
        return groups
      },
      {} as Record<string, Order[]>,
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Принят"
      case "rejected":
        return "Отклонен"
      default:
        return "Ожидает"
    }
  }

  const groupedOrders = groupOrdersByDate(orders)

  const handleEditSuccess = () => {
    setEditingOrder(null)
    fetchOrders()
  }

  if (!selectedRestaurant) {
    return <div>Пожалуйста, выберите ресторан</div>
  }

  return (
    <RestaurantLayout>
      <Card className="mb-6 bg-gradient-to-b from-white to-gray-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск заказов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Removed Select component */}
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                <div key={date} className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {format(parseISO(date), "d MMMM yyyy", { locale: ru })}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {dateOrders.map((order) => (
                      <Card
                        key={order.id}
                        className="overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-102 text-xs"
                      >
                        <CardHeader className="p-2 bg-gradient-to-r from-primary/10 to-primary/5">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-xs font-semibold text-gray-900 truncate">
                              {order.fullName}
                            </CardTitle>
                            <Badge className={`${getStatusColor(order.status)} text-white text-xs`}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                          <div className="grid grid-cols-2 gap-1">
                            <div className="flex items-center text-gray-700">
                              <Calendar className="mr-1 h-3 w-3 text-blue-500" />
                              {format(parseISO(order.date), "dd.MM.yyyy")}
                            </div>
                            <div className="flex items-center text-gray-700">
                              <Users className="mr-1 h-3 w-3 text-green-500" />
                              {order.chairCount} гостей
                            </div>
                            <div className="flex items-center text-gray-700">
                              <MapPin className="mr-1 h-3 w-3 text-red-500" />
                              {order.offsite ? "Выездное" : "В ресторане"}
                            </div>
                            <div className="flex items-center text-gray-700">
                              <Phone className="mr-1 h-3 w-3 text-purple-500" />
                              {order.phonenumber}
                            </div>
                            <div className="flex items-center text-gray-700 col-span-2">
                              <Clipboard className="mr-1 h-3 w-3 text-yellow-500" />
                              {order.orderTypeName}
                            </div>
                            <div className="flex items-center text-gray-700">
                              <DollarSign className="mr-1 h-3 w-3 text-green-600" />
                              Цена: {order.price} TMT
                            </div>
                            <div className="flex items-center text-gray-700">
                              <Percent className="mr-1 h-3 w-3 text-orange-500" />
                              Скидка: {order.discount}%
                            </div>
                          </div>
                          <div className="pt-1 border-t border-gray-200 space-y-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="flex items-center text-gray-700 truncate">
                                    <MessageSquare className="mr-1 h-3 w-3 text-blue-400" />
                                    Примечание: {order.note || "Нет"}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{order.note || "Примечание отсутствует"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="flex items-center text-gray-700 truncate">
                                    <MessageSquare className="mr-1 h-3 w-3 text-indigo-400" />
                                    Комментарий: {order.comment || "Нет"}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{order.comment || "Комментарий отсутствует"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="font-medium text-gray-700">Полная сумма:</span>
                            <span className="font-bold text-primary">
                              {(() => {
                                const totalCost = order.price * order.chairCount
                                const discountAmount = totalCost * (order.discount / 100)
                                const finalCost = totalCost - discountAmount
                                return `${finalCost.toFixed(2)} TMT`
                              })()}
                            </span>
                          </div>
                          {(() => {
                            const totalCost = order.price * order.chairCount
                            const discountAmount = totalCost * (order.discount / 100)
                            const finalCost = totalCost - discountAmount
                            const remainingPayment = Math.max(0, finalCost - order.totalPayment)
                            return (
                              <div className="flex justify-between items-center pt-1 text-[10px]">
                                <span className="text-gray-700">Статус оплаты:</span>
                                {remainingPayment > 0 ? (
                                  <span className="text-amber-600 font-medium">
                                    Осталось оплатить: {remainingPayment.toFixed(2)} TMT
                                  </span>
                                ) : (
                                  <span className="text-green-600 font-medium">Оплачено</span>
                                )}
                              </div>
                            )
                          })()}
                        </CardContent>
                        <CardFooter className="p-1 bg-gradient-to-r from-primary/5 to-primary/10 flex justify-between items-center text-[10px]">
                          <div className="text-gray-600 flex items-center">
                            <User className="mr-1 h-3 w-3 text-primary" />
                            <span className="truncate">
                              {order.updatedBy.firstName} {order.updatedBy.lastName}
                            </span>
                          </div>
                          <Button
                            className="text-[10px] py-0.5 px-2 h-auto bg-primary text-white hover:bg-primary/90"
                            size="sm"
                            onClick={() => setEditingOrder(order)}
                          >
                            Детали
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Order Sheet */}
      <Sheet open={editingOrder !== null} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Редактировать заказ</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingOrder && (
              <EditOrderForm
                orderId={editingOrder.id.toString()}
                initialData={editingOrder}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingOrder(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </RestaurantLayout>
  )
}


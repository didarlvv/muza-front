"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RestaurantLayout } from "@/components/restaurant-layout"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { orderApi, orderTypeApi } from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import type { OrderType } from "@/types/api"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  orderTypeId: z.string().min(1, "Выберите тип заказа"),
  note: z.string(),
  comment: z.string(),
  chairCount: z.number().min(1, "Минимальное количество гостей - 1"),
  phonenumber: z.string().min(8, "Введите корректный номер телефона"),
  date: z.string().min(1, "Выберите дату"),
  status: z.enum(["accepted", "rejected", "prepayment"]).default("prepayment"),
  discount: z.number().min(0).max(100),
  offsite: z.boolean().default(false),
  totalPayment: z.number().min(0),
  price: z.number().min(0),
})

export default function NewOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedRestaurant } = useAuth()
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      orderTypeId: "",
      note: "",
      comment: "",
      chairCount: 1,
      phonenumber: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "prepayment",
      discount: 0,
      offsite: false,
      totalPayment: 0,
      price: 0,
    },
  })

  const watchPrice = form.watch("price")
  const watchDiscount = form.watch("discount")

  useEffect(() => {
    const totalPayment = watchPrice - (watchPrice * watchDiscount) / 100
    form.setValue("totalPayment", totalPayment)
  }, [watchPrice, watchDiscount, form])

  useEffect(() => {
    const fetchOrderTypes = async () => {
      if (!selectedRestaurant) return
      try {
        const data = await orderTypeApi.getOrderTypes({
          restaurantId: selectedRestaurant.id,
        })
        setOrderTypes(data)
      } catch (error) {
        console.error("Failed to fetch order types:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить типы заказов",
          variant: "destructive",
        })
      }
    }

    fetchOrderTypes()
  }, [selectedRestaurant, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedRestaurant) {
      toast({
        title: "Ошибка",
        description: "Выберите ресторан",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      // Omit restaurantId from the request body
      const { totalPayment, ...submitData } = values
      await orderApi.createOrder(submitData)

      toast({
        title: "Успех",
        description: "Заказ успешно создан",
      })

      router.push("/restaurant/orders")
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedRestaurant) {
    return <div>Пожалуйста, выберите ресторан</div>
  }

  return (
    <RestaurantLayout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Новый заказ</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО клиента</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phonenumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер телефона</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип заказа</FormLabel>
                      <Select disabled={isLoading} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип заказа" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orderTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isLoading} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chairCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество гостей</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Скидка (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Итоговая сумма</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={true} className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select disabled={isLoading} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prepayment">Предоплата</SelectItem>
                          <SelectItem value="accepted">Принят</SelectItem>
                          <SelectItem value="rejected">Отклонен</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="offsite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Выездное мероприятие</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечание</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={isLoading} className="min-h-[100px] bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={isLoading} className="min-h-[100px] bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать заказ"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </RestaurantLayout>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { orderApi, orderTypeApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Order, OrderType } from "@/types/api"
import { useAuth } from "@/contexts/AuthContext"

const formSchema = z.object({
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  orderTypeId: z.string().min(1, "Выберите тип заказа"),
  note: z.string(),
  comment: z.string(),
  chairCount: z.number().min(1, "Минимальное количество гостей - 1"),
  phonenumber: z.string().min(8, "Введите корректный номер телефона"),
  date: z.string().min(1, "Выберите дату"),
  status: z.enum(["accepted", "rejected", "prepayment"]),
  discount: z.number().min(0).max(100),
  offsite: z.boolean(),
  totalPayment: z.number().min(0),
  price: z.number().min(0),
})

interface EditOrderFormProps {
  orderId: string
  initialData: Order
  onSuccess: () => void
  onCancel: () => void
}

export function EditOrderForm({ orderId, initialData, onSuccess, onCancel }: EditOrderFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { selectedRestaurant } = useAuth()
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData.fullName,
      orderTypeId: initialData.orderTypeId?.toString(),
      note: initialData.note,
      comment: initialData.comment,
      chairCount: initialData.chairCount,
      phonenumber: initialData.phonenumber,
      date: new Date(initialData.date).toISOString().split("T")[0],
      status: initialData.status,
      discount: initialData.discount,
      offsite: initialData.offsite,
      totalPayment: initialData.totalPayment,
      price: initialData.price,
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
    try {
      setIsLoading(true)
      await orderApi.updateOrder(orderId, values)

      toast({
        title: "Успех",
        description: "Заказ успешно обновлен",
      })

      onSuccess()
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
                  <Input {...field} disabled={isLoading} />
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
                  <Input {...field} disabled={isLoading} />
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
                  <Input type="date" {...field} disabled={isLoading} />
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
                <Textarea {...field} disabled={isLoading} className="min-h-[100px]" />
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
                <Textarea {...field} disabled={isLoading} className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </form>
    </Form>
  )
}


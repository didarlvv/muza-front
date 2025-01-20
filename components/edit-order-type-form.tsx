"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { orderTypeApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { OrderType } from "@/types/api"

const formSchema = z.object({
  name: z.string().min(2, "Название должно быть не менее 2 символов"),
  price: z.number().min(0, "Цена не может быть отрицательной"),
  isActive: z.boolean(),
})

interface EditOrderTypeFormProps {
  orderTypeId: number
  initialData: OrderType
  restaurantId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditOrderTypeForm({
  orderTypeId,
  initialData,
  restaurantId,
  onSuccess,
  onCancel,
}: EditOrderTypeFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      price: initialData.price,
      isActive: initialData.isActive,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const changedFields = Object.entries(values).reduce(
      (acc, [key, value]) => {
        if (JSON.stringify(initialData[key as keyof OrderType]) !== JSON.stringify(value)) {
          acc[key] = value
        }
        return acc
      },
      {} as Partial<z.infer<typeof formSchema>>,
    )

    if (Object.keys(changedFields).length === 0) {
      toast({
        title: "Информация",
        description: "Нет изменений для сохранения",
      })
      return
    }

    try {
      setIsLoading(true)

      await orderTypeApi.updateOrderType(orderTypeId, {
        ...changedFields,
        restaurantId,
      })

      toast({
        title: "Успех",
        description: "Тип заказа успешно обновлен",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить тип заказа",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Активный</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
              </FormControl>
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


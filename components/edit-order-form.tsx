"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { orderApi, orderTypeApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import type { Order, OrderType } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  orderTypeId: z
    .string()
    .refine((value) => value === "none" || value.length > 0, {
      message: "Выберите тип заказа или 'Не выбрано'",
    })
    .optional(),
  note: z.string().optional(),
  comment: z.string().optional(),
  chairCount: z.number().min(1, "Минимальное количество гостей - 1"),
  phonenumber: z.string().min(8, "Введите корректный номер телефона"),
  date: z.string().min(1, "Выберите дату"),
  status: z.enum(["accepted", "rejected", "prepayment"]),
  discount: z.number().min(0).max(100).optional(),
  offsite: z.boolean().optional(),
  totalPayment: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
});

interface EditOrderFormProps {
  orderId: string;
  initialData: Order;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditOrderForm({
  orderId,
  initialData,
  onSuccess,
  onCancel,
}: EditOrderFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedRestaurant } = useAuth();
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData.fullName,
      orderTypeId: initialData.orderTypeId?.toString() || "none",
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
  });

  useEffect(() => {
    const fetchOrderTypes = async () => {
      if (!selectedRestaurant) return;
      try {
        const data = await orderTypeApi.getOrderTypes({
          restaurantId: selectedRestaurant.id,
        });
        setOrderTypes(data);
      } catch (error) {
        console.error("Failed to fetch order types:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить типы заказов",
          variant: "destructive",
        });
      }
    };

    fetchOrderTypes();
  }, [selectedRestaurant, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      const changedFields: Partial<z.infer<typeof formSchema>> = {};

      Object.keys(values).forEach((key) => {
        const typedKey = key as keyof typeof values;
        if (
          values[typedKey] !== initialData[typedKey] &&
          values[typedKey] !== null &&
          values[typedKey] !== undefined
        ) {
          changedFields[typedKey] = values[typedKey];
        }
      });

      // Handle orderTypeId separately
      if (values.orderTypeId === "none") {
        if (initialData.orderTypeId !== null) {
          delete changedFields.orderTypeId;
        }
      } else if (values.orderTypeId !== initialData.orderTypeId?.toString()) {
        changedFields.orderTypeId = values.orderTypeId;
      }

      if (Object.keys(changedFields).length > 0) {
        await orderApi.updateOrder(orderId, changedFields);
        toast({
          title: "Успех",
          description: "Заказ успешно обновлен",
        });
        onSuccess();
      } else {
        toast({
          title: "Информация",
          description: "Нет изменений для сохранения",
        });
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                <FormLabel>Тип заказа (необязательно)</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип заказа" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Не выбрано</SelectItem>
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
                    type="text"
                    {...field}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                    }}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(value);
                    }}
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
                    type="text"
                    {...field}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                    }}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(value);
                    }}
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
                    type="text"
                    {...field}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                    }}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(value);
                    }}
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
                <FormLabel>Сумма оплаты</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                    }}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(value);
                    }}
                    disabled={isLoading}
                  />
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
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
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
                <FormLabel className="text-base">
                  Выездное мероприятие
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
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
                <Textarea
                  {...field}
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
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
                <Textarea
                  {...field}
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </form>
    </Form>
  );
}

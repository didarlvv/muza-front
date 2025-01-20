"use client";

import { useEffect, useState } from "react";
import { orderApi } from "@/lib/api";
import { Order } from "../../types/api";
import { RestaurantLayout } from "@/components/restaurant-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StorageService from "@/utils/storage";

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const user = JSON.parse(StorageService.getItem("user") || "{}");

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersData = await orderApi.getOrders();
      setOrders(
        ordersData.filter(
          (order: Order) => order.restaurantId === user.restaurantId
        )
      );
    };
    fetchOrders();
  }, [user.restaurantId]);

  const handleStatusUpdate = async (
    orderId: string,
    status: Order["status"]
  ) => {
    await orderApi.updateOrder(orderId, { status });
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Управление заказами</h1>

        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Заказ #{order.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <div className="space-y-2 mt-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>${item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <p className="font-bold mt-4">
                      Итого: $
                      {order.items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )}
                    </p>
                  </div>
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      handleStatusUpdate(order.id, value as Order["status"])
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Ожидает</SelectItem>
                      <SelectItem value="CONFIRMED">Подтвержден</SelectItem>
                      <SelectItem value="COMPLETED">Выполнен</SelectItem>
                      <SelectItem value="CANCELLED">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RestaurantLayout>
  );
}

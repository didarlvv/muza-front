"use client";

import { useState, useEffect } from "react";
import { RestaurantLayout } from "@/components/restaurant-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Clipboard,
  User,
  Percent,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderApi, orderTypeApi } from "@/lib/api";
import type { Order, OrderType } from "@/types/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomDateRangePicker from "@/components/CustomDateRangePicker/CustomDateRangePicker";
import type { DateRange } from "react-day-picker";

export default function OrderListPage() {
  const { toast } = useToast();
  const { selectedRestaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    order_direction: "DESC" as "ASC" | "DESC",
    status: "all",
    orderTypeId: "all",
    offsite: "all",
  });

  const fetchOrderTypes = async () => {
    if (!selectedRestaurant) return;
    try {
      const data = await orderTypeApi.getOrderTypes({
        restaurantId: selectedRestaurant.id,
      });
      setOrderTypes(data);
    } catch (error) {
      console.error("Failed to fetch order types:", error);
    }
  };

  const fetchOrders = async () => {
    if (!selectedRestaurant) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        order_by: "date",
        order_direction: filters.order_direction,
        restaurantId: selectedRestaurant.id,
      };

      if (searchQuery) params.search = searchQuery;
      if (dateRange?.from)
        params.minDate = format(dateRange.from, "yyyy-MM-dd");
      if (dateRange?.to) params.maxDate = format(dateRange.to, "yyyy-MM-dd");
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.orderTypeId && filters.orderTypeId !== "all")
        params.orderTypeId = Number.parseInt(filters.orderTypeId);
      if (filters.offsite && filters.offsite !== "all")
        params.offsite = filters.offsite === "true";

      const data = await orderApi.getOrders(params);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Ошибка",
        description:
          "Не удалось загрузить заказы. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurant) {
      fetchOrderTypes();
      fetchOrders();
    }
  }, [selectedRestaurant, dateRange, filters, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500 hover:bg-green-700";
      case "rejected":
        return "bg-red-500 hover:bg-red-700";
      case "prepayment":
        return "bg-yellow-500 hover:bg-yellow-700";
      default:
        return "bg-gray-500 hover:bg-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Принят";
      case "rejected":
        return "Отклонен";
      case "prepayment":
        return "Предоплата";
      default:
        return status;
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      orders.map((order) => {
        const totalCost = order.price * order.chairCount;
        const discountAmount = totalCost * (order.discount / 100);
        const finalCost = totalCost - discountAmount;
        const remainingPayment = Math.max(0, finalCost - order.totalPayment);
        return {
          "ФИО клиента": order.fullName,
          Дата: format(parseISO(order.date), "dd.MM.yyyy"),
          "Тип заказа": order.orderTypeName,
          Место: order.offsite ? "Выездное" : "В ресторане",
          Гости: order.chairCount,
          Телефон: order.phonenumber,
          Цена: order.price,
          Скидка: order.discount,
          "Общая сумма": finalCost.toFixed(2),
          "Сумма оплаты": remainingPayment.toFixed(2),
          Статус: getStatusText(order.status),
        };
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // ФИО клиента
      { wch: 12 }, // Дата
      { wch: 15 }, // Тип заказа
      { wch: 15 }, // Место
      { wch: 8 }, // Гости
      { wch: 15 }, // Телефон
      { wch: 10 }, // Цена
      { wch: 10 }, // Скидка
      { wch: 15 }, // Общая сумма
      { wch: 18 }, // Сумма оплаты
      { wch: 12 }, // Статус
    ];
    worksheet["!cols"] = columnWidths;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.xlsx";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!selectedRestaurant) {
    return <div>Пожалуйста, выберите ресторан</div>;
  }

  return (
    <RestaurantLayout>
      <Card className="mb-6 bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex justify-between items-center px-6">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Список заказов
          </CardTitle>
          <Button
            onClick={exportToExcel}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Экспорт в Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <div className="col-span-full sm:col-span-1 flex items-end">
              <div className="w-full">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Поиск
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Поиск заказов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-1 flex items-end">
              <div className="w-full">
                <label
                  htmlFor="date-range"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Период
                </label>
                <CustomDateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Статус
              </label>
              <Select
                id="status"
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="accepted">Принят</SelectItem>
                  <SelectItem value="rejected">Отклонен</SelectItem>
                  <SelectItem value="prepayment">Предоплата</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="order-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Тип заказа
              </label>
              <Select
                id="order-type"
                value={filters.orderTypeId}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, orderTypeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {orderTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Место проведения
              </label>
              <Select
                id="location"
                value={filters.offsite}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, offsite: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все места" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Выездное</SelectItem>
                  <SelectItem value="false">В ресторане</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО клиента</TableHead>
                    <TableHead
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          order_direction:
                            prev.order_direction === "DESC" ? "ASC" : "DESC",
                        }))
                      }
                      className="cursor-pointer"
                    >
                      Дата {filters.order_direction === "DESC" ? "↓" : "↑"}
                    </TableHead>
                    <TableHead>Тип заказа</TableHead>
                    <TableHead>Место</TableHead>
                    <TableHead className="text-right">Гости</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-right">Скидка</TableHead>
                    <TableHead className="text-right">Сумма оплаты</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.fullName}</TableCell>
                      <TableCell>
                        {format(parseISO(order.date), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell>{order.orderTypeName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3 text-red-500" />
                          {order.offsite ? "Выездное" : "В ресторане"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Users className="mr-1 h-3 w-3 text-green-500" />
                          {order.chairCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="mr-1 h-3 w-3 text-purple-500" />
                          {order.phonenumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.price}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.discount}%
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalCost = order.price * order.chairCount;
                          const discountAmount =
                            totalCost * (order.discount / 100);
                          const finalCost = totalCost - discountAmount;
                          const remainingPayment = Math.max(
                            0,
                            finalCost - order.totalPayment
                          );
                          return remainingPayment > 0 ? (
                            <span className="text-amber-600">
                              {remainingPayment.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-green-600">0</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(
                            order.status
                          )} text-white transition-colors duration-200`}
                        >
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </RestaurantLayout>
  );
}

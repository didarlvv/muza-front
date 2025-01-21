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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { orderTypeApi } from "@/lib/api";
import type { OrderType, PaginationParams } from "@/types/api";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CreateOrderTypeForm } from "@/components/create-order-type-form";
import { EditOrderTypeForm } from "@/components/edit-order-type-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function OrderTypesPage() {
  const { toast } = useToast();
  const { user, selectedRestaurant } = useAuth();
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [params, setParams] = useState<PaginationParams>({
    limit: 20,
    page: 1,
    order_direction: "DESC",
    order_by: "id",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [editingOrderType, setEditingOrderType] = useState<OrderType | null>(
    null
  );

  const fetchOrderTypes = async () => {
    if (!selectedRestaurant) return;
    setIsLoading(true);
    try {
      const data = await orderTypeApi.getOrderTypes({
        ...params,
        search: searchQuery || undefined,
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurant) {
      fetchOrderTypes();
    }
  }, [params, searchQuery, selectedRestaurant]);

  const handleSort = (column: string) => {
    setParams((prev) => ({
      ...prev,
      order_by: column,
      order_direction:
        prev.order_by === column && prev.order_direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
  };

  const handleStatusChange = async (id: number, isActive: boolean) => {
    if (!selectedRestaurant) return;
    try {
      await orderTypeApi.updateOrderType(id, {
        isActive,
        restaurantId: selectedRestaurant.id,
      });
      setOrderTypes(
        orderTypes.map((type) =>
          type.id === id ? { ...type, isActive } : type
        )
      );
      toast({
        title: "Успех",
        description: "Статус типа заказа обновлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDrawerOpen(false);
    fetchOrderTypes();
  };

  const handleEditSuccess = () => {
    setEditingOrderType(null);
    fetchOrderTypes();
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (params.order_by !== column) return null;
    return params.order_direction === "DESC" ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  if (!user || !selectedRestaurant) {
    return <div>Выберите ресторан</div>;
  }

  return (
    <RestaurantLayout>
      <Card className="mb-6 bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Типы заказов
          </CardTitle>
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Добавить тип
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск типов заказов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={String(params.limit)}
              onValueChange={(value) =>
                setParams((prev) => ({ ...prev, limit: Number(value) }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Строк на странице" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 строк</SelectItem>
                <SelectItem value="20">20 строк</SelectItem>
                <SelectItem value="50">50 ст��ок</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        Название
                        <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("price")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        Цена
                        <SortIcon column="price" />
                      </div>
                    </TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : orderTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Типы заказов не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderTypes.map((type) => (
                      <TableRow key={type.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {type.name}
                        </TableCell>
                        <TableCell>{type.price}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Switch
                              checked={type.isActive}
                              onCheckedChange={(checked) =>
                                handleStatusChange(type.id, checked)
                              }
                              className="mr-2"
                            />
                            <Badge
                              className={
                                type.isActive ? "bg-green-500" : "bg-red-500"
                              }
                            >
                              {type.isActive ? "Активный" : "Неактивный"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Открыть меню</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Действия</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setEditingOrderType(type)}
                              >
                                Редактировать
                              </DropdownMenuItem>
                              {/* Add more actions as needed */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setParams((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={params.page === 1}
            >
              Предыдущая
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setParams((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Следующая
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Order Type Drawer */}
      <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Добавить тип заказа</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedRestaurant && (
              <CreateOrderTypeForm
                restaurantId={selectedRestaurant.id}
                onSuccess={handleCreateSuccess}
                onCancel={() => setIsCreateDrawerOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Order Type Drawer */}
      <Sheet
        open={editingOrderType !== null}
        onOpenChange={(open) => !open && setEditingOrderType(null)}
      >
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Редактировать тип заказа</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingOrderType && selectedRestaurant && (
              <EditOrderTypeForm
                orderTypeId={editingOrderType.id}
                initialData={editingOrderType}
                restaurantId={selectedRestaurant.id}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingOrderType(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </RestaurantLayout>
  );
}

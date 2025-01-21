"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restaurantApi } from "@/lib/api";
import type { Restaurant, PaginationParams } from "@/types/api";
import { CreateRestaurantForm } from "@/components/create-restaurant-form";
import { EditRestaurantForm } from "@/components/edit-restaurant-form";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [params, setParams] = useState<PaginationParams>({
    limit: 20,
    page: 1,
    order_direction: "DESC",
    order_by: "id",
  });

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const data = await restaurantApi.getRestaurants({
        ...params,
        search: searchQuery || undefined,
      });
      setRestaurants(data);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [params, searchQuery]);

  const handleCreateSuccess = () => {
    setIsCreateDrawerOpen(false);
    fetchRestaurants();
  };

  const handleEditSuccess = () => {
    setEditingRestaurant(null);
    fetchRestaurants();
  };

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

  const SortIcon = ({ column }: { column: string }) => {
    if (params.order_by !== column) return null;
    return params.order_direction === "DESC" ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  return (
    <AdminLayout>
      <Card className="mb-6 bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Рестораны
          </CardTitle>
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Добавить ресторан
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск ресторанов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
            <div className="flex items-center gap-4">
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
                  <SelectItem value="50">50 строк</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Изображение</TableHead>
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
                      onClick={() => handleSort("slug")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        Slug
                        <SortIcon column="slug" />
                      </div>
                    </TableHead>
                    <TableHead>Администратор</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : restaurants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Рестораны не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    restaurants.map((restaurant) => (
                      <TableRow
                        key={restaurant.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <Image
                            src={`http://srv694284.hstgr.cloud:4040/${restaurant.file.path}`}
                            alt={restaurant.name}
                            width={50}
                            height={50}
                            className="rounded-full"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {restaurant.name}
                        </TableCell>
                        <TableCell>{restaurant.slug}</TableCell>
                        <TableCell>{`${restaurant.user.firstName} ${restaurant.user.lastName}`}</TableCell>
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
                                onClick={() => setEditingRestaurant(restaurant)}
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

          <div className="flex items-center justify-end space-x-2 py-4">
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

      {/* Create Restaurant Drawer */}
      <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Добавить ресторан</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CreateRestaurantForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDrawerOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Restaurant Drawer */}
      <Sheet
        open={editingRestaurant !== null}
        onOpenChange={(open) => !open && setEditingRestaurant(null)}
      >
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Редактировать ресторан</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingRestaurant && (
              <EditRestaurantForm
                restaurantId={editingRestaurant.id}
                initialData={editingRestaurant}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingRestaurant(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface RestaurantSelectorProps {
  onSelect: (restaurantId: number) => void;
}

export function RestaurantSelector({ onSelect }: RestaurantSelectorProps) {
  const { user, selectedRestaurant } = useAuth();

  if (!user || !user.restaurants || user.restaurants.length === 0) {
    return null;
  }

  return (
    <Select
      onValueChange={(value) => onSelect(Number(value))}
      value={selectedRestaurant?.id.toString()}
    >
      <SelectTrigger className="w-full bg-white border-gray-200 text-sm">
        <SelectValue placeholder="Выберите ресторан" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 rounded-md shadow-md z-[1001]">
        {user.restaurants.map((restaurant) => (
          <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
            {restaurant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

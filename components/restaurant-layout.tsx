"use client";

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User } from "lucide-react";
import { Logo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface RestaurantLayoutProps {
  children: React.ReactNode;
}

export function RestaurantLayout({ children }: RestaurantLayoutProps) {
  const { logout, user, selectedRestaurant, setSelectedRestaurant } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    if (
      user?.restaurants &&
      user.restaurants.length > 0 &&
      !selectedRestaurant
    ) {
      setSelectedRestaurant(user.restaurants[0]);
    }
  }, [user, selectedRestaurant, setSelectedRestaurant]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center space-x-4">
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-0 text-base hover:bg-transparent hover:text-primary focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
                    >
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="pl-1 pr-0">
                    <div className="px-7">
                      <MainNav
                        isAdmin={false}
                        className="flex flex-col space-x-0 space-y-2"
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <Logo className="h-8 w-auto text-primary" />
                <span className="text-xl font-bold hidden sm:inline">
                  Restaurant Panel
                </span>
              </div>
              <div className="flex items-center sm:hidden">
                <UserMenu
                  user={user}
                  onLogout={handleLogout}
                  selectedRestaurant={selectedRestaurant}
                  setSelectedRestaurant={setSelectedRestaurant}
                />
              </div>
            </div>
            <div className="hidden lg:block flex-1 px-4">
              <MainNav isAdmin={false} />
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <UserMenu
                user={user}
                onLogout={handleLogout}
                selectedRestaurant={selectedRestaurant}
                setSelectedRestaurant={setSelectedRestaurant}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="bg-white border-t py-6 px-4 mt-8">
        <div className="container mx-auto text-center text-sm text-gray-600">
          © 2023 Restaurant Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function UserMenu({
  user,
  onLogout,
  selectedRestaurant,
  setSelectedRestaurant,
}: {
  user: any;
  onLogout: () => void;
  selectedRestaurant: any;
  setSelectedRestaurant: (restaurant: any) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt={user?.firstName} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Выбрать ресторан</DropdownMenuLabel>
        {user?.restaurants.map((restaurant: any) => (
          <DropdownMenuItem
            key={restaurant.id}
            onSelect={() => setSelectedRestaurant(restaurant)}
          >
            {restaurant.name} {selectedRestaurant?.id === restaurant.id && "✓"}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Роль:{" "}
            {user?.role === "customer" ? "Администратор ресторана" : user?.role}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Телефон: {user?.phonenumber}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Статус: {user?.status}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Действителен до:{" "}
            {new Date(user?.validUntil || "").toLocaleDateString("ru-RU")}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

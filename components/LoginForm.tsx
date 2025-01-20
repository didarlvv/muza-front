"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Logo } from "./Logo";
import StorageService from "@/utils/storage";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("63744444");
  const [password, setPassword] = useState("User@123");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (loginSuccess) {
      const redirectTimer = setTimeout(() => {
        const userRole = StorageService.getItem("userRole");
        console.log("Attempting redirect based on role:", userRole);
        if (userRole === "admin") {
          console.log("Redirecting to admin dashboard");
          router.push("/admin/users");
        } else if (userRole === "customer") {
          console.log("Redirecting to restaurant orders");
          router.push("/restaurant/orders");
        }
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [loginSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login...");
      const userData = await authApi.login(username, password);
      console.log("Login successful, user data:", userData);

      login(userData.tokens.access.token, {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        email: userData.email,
        phonenumber: userData.phonenumber,
        isSuperUser: userData.isSuperUser,
        validUntil: userData.validUntil,
        restaurants: userData.restaurants,
      });

      console.log("Setting cookies and localStorage...");
      document.cookie = `token=${userData.tokens.access.token}; path=/;`;
      document.cookie = `user=${JSON.stringify({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        email: userData.email,
        phonenumber: userData.phonenumber,
        isSuperUser: userData.isSuperUser,
        validUntil: userData.validUntil,
        restaurants: userData.restaurants,
      })}; path=/;`;

      StorageService.setItem("userRole", userData.role);
      console.log("Cookies and localStorage set");

      setLoginSuccess(true);
      console.log("Login process completed, waiting for redirect...");
    } catch (err) {
      console.error("Login error:", err);
      setError("Неверные учетные данные");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary/10 to-primary/5 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex justify-center mb-6">
            <Logo className="h-16 w-auto text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Вход в систему
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Введите свои учетные данные для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="p-4 text-sm text-red-800 rounded-lg bg-red-50"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Имя пользователя
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Пароль
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

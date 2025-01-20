'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { userApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { User } from '@/types/api'

const formSchema = z.object({
  firstName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  lastName: z.string().min(2, 'Фамилия должна быть не менее 2 символов'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional(),
  phonenumber: z.string().min(8, 'Введите корректный номер телефона'),
  validUntil: z.string().min(1, 'Выберите дату'),
  role: z.string().min(1, 'Выберите роль'),
  status: z.string().min(1, 'Выберите статус'),
})

interface EditUserFormProps {
  userId: number
  initialData: User
  onSuccess: () => void
  onCancel: () => void
}

export function EditUserForm({ userId, initialData, onSuccess, onCancel }: EditUserFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      email: initialData.email,
      phonenumber: initialData.phonenumber.toString(),
      validUntil: new Date(initialData.validUntil).toISOString().split('T')[0],
      role: initialData.role.toLowerCase(),
      status: initialData.status.toLowerCase(),
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const changedFields = Object.entries(values).reduce((acc, [key, value]) => {
      if (key === 'password' && value === '') {
        return acc; // Don't include empty password
      }
      if (key === 'phonenumber') {
        if (value !== initialData.phonenumber.toString()) {
          acc[key] = parseInt(value);
        }
      } else if (JSON.stringify(initialData[key as keyof User]) !== JSON.stringify(value)) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<z.infer<typeof formSchema>>);

    if (Object.keys(changedFields).length === 0) {
      toast({
        title: 'Информация',
        description: 'Нет изменений для сохранения',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      await userApi.updateUser(userId, changedFields);

      toast({
        title: 'Успех',
        description: 'Пользователь успешно обновлен',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить пользователя',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Фамилия</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль (оставьте пустым, чтобы не менять)</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isLoading} />
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
                <Input type="tel" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="validUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Действителен до</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Роль</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="customer">Администратор ресторана</SelectItem>
                </SelectContent>
              </Select>
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
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="deactive">Неактивный</SelectItem>
                  <SelectItem value="blocked">Заблокирован</SelectItem>
                </SelectContent>
              </Select>
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
  )
}


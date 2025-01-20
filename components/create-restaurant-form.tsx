'use client'

import { useState, useEffect } from 'react'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from '@/components/ui/input'
import { restaurantApi, userApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { User } from '@/types/api'
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, 'Название должно быть не менее 2 символов'),
  image: z.any().refine((file) => file instanceof File, 'Необходимо выбрать изображение'),
  userId: z.string().min(1, 'Необходимо выбрать пользователя'),
})

interface CreateRestaurantFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateRestaurantForm({ onSuccess, onCancel }: CreateRestaurantFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      userId: '',
    },
  })

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const data = await userApi.getUsers()
        setUsers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список пользователей',
          variant: 'destructive',
        })
        setUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      
      // Сначала загружаем файл
      const fileData = await restaurantApi.uploadFile(values.image)
      
      // Создаем slug из названия
      const slug = values.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
      
      // Создаем ресторан
      await restaurantApi.createRestaurant({
        name: values.name,
        slug,
        file: fileData,
        userId: parseInt(values.userId),
      })

      toast({
        title: 'Успех',
        description: 'Ресторан успешно создан',
      })
      
      onSuccess()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать ресторан',
        variant: 'destructive',
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
              <FormLabel>Название ресторана</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Администратор ресторана</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoadingUsers}
                    >
                      {field.value
                        ? users.find((user) => user.id.toString() === field.value)
                          ? `${users.find((user) => user.id.toString() === field.value)?.firstName} ${users.find((user) => user.id.toString() === field.value)?.lastName}`
                          : "Выберите администратора"
                        : "Выберите администратора"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Поиск администратора..." />
                    <CommandEmpty>Администратор не найден.</CommandEmpty>
                    <CommandGroup>
                      {isLoadingUsers ? (
                        <CommandItem disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Загрузка пользователей...
                        </CommandItem>
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <CommandItem
                            value={user.id.toString()}
                            key={user.id}
                            onSelect={() => {
                              form.setValue("userId", user.id.toString())
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                user.id.toString() === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.firstName} {user.lastName} ({user.email})
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem disabled>Нет доступных пользователей</CommandItem>
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Изображение</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      onChange(file)
                    }
                  }}
                  {...field}
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
          <Button type="submit" disabled={isLoading || isLoadingUsers}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать
          </Button>
        </div>
      </form>
    </Form>
  )
}


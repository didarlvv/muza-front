'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { User, Restaurant } from '@/types/api'
import { cn } from "@/lib/utils"
import Image from 'next/image'

const formSchema = z.object({
  name: z.string().min(2, 'Название должно быть не менее 2 символов'),
  image: z.any().optional(),
  userId: z.string().min(1, 'Необходимо выбрать пользователя'),
})

interface EditRestaurantFormProps {
  restaurantId: number;
  initialData: Restaurant;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditRestaurantForm({ restaurantId, initialData, onSuccess, onCancel }: EditRestaurantFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [originalData, setOriginalData] = useState({
    name: initialData.name,
    userId: initialData.user.id.toString(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      userId: initialData.user.id.toString(),
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

  const hasChanges = useCallback((values: z.infer<typeof formSchema>) => {
    const changes: Record<string, any> = {};
    
    if (values.name !== originalData.name) {
      changes.name = values.name;
    }
    
    if (values.userId !== originalData.userId) {
      changes.userId = parseInt(values.userId);
    }
    
    if (values.image) {
      changes.hasNewImage = true;
    }
    
    return Object.keys(changes).length > 0 ? changes : null;
  }, [originalData])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const changes = hasChanges(values);
    
    if (!changes) {
      toast({
        title: 'Информация',
        description: 'Нет изменений для сохранения',
      })
      return;
    }

    try {
      setIsLoading(true)
      
      const updateData: any = {};
      
      if (changes.name) {
        updateData.name = values.name;
        updateData.slug = values.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '');
      }
      
      if (changes.userId) {
        updateData.userId = changes.userId;
      }
      
      if (values.image) {
        const fileData = await restaurantApi.uploadFile(values.image)
        updateData.file = fileData;
      }
      
      await restaurantApi.updateRestaurant(restaurantId, updateData)

      toast({
        title: 'Успех',
        description: 'Ресторан успешно обновлен',
      })
      
      onSuccess()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить ресторан',
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
                          : initialData.user.firstName + ' ' + initialData.user.lastName
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
              <FormLabel>Изображение (необязательно)</FormLabel>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={`http://srv694284.hstgr.cloud:4040/${initialData.file.path}`}
                    alt={initialData.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <p className="text-sm text-muted-foreground">Текущее изображение</p>
                </div>
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
              </div>
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


"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/users")
      } else if (user.role === "customer") {
        router.push("/restaurant/orders")
      }
    } else {
      router.push("/login")
    }
  }, [user, router])

  return null
}


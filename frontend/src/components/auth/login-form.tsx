"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { GoogleButton } from "@/components/auth/google-button"
import { auth, getApiErrorMessage } from "@/lib/api"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"

// Destino tras iniciar sesión: el `next` que deja el proxy, solo si es una
// ruta interna del dashboard (evita redirecciones a sitios externos).
function getRedirectTarget() {
  const next = new URLSearchParams(window.location.search).get("next")
  return next?.startsWith("/dashboard") ? next : "/dashboard"
}

export function LoginForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setIsSubmitting(true)
    try {
      await auth.login(values)
      router.replace(getRedirectTarget())
    } catch (error) {
      form.setError("root", {
        message: getApiErrorMessage(error, "No se pudo iniciar sesión"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <p className="font-mono text-sm text-primary">$ login --user</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inicia sesión
        </h1>
      </div>

      <GoogleButton label="Continuar con Google" />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o con tu correo</span>
        <Separator className="flex-1" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input placeholder="tu@correo.com" {...field} />
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
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
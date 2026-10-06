import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <RegisterForm />
      </div>
    </div>
  )
}
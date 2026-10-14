import { PageHeader } from "@/components/dashboard/page-header"
import { PasswordForm } from "@/components/settings/password-form"

export default function AccountSettingsPage() {
  return (
    <>
      <PageHeader title="Cuenta" description="Cambia tu contraseña." />
      <PasswordForm />
    </>
  )
}

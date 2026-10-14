import { PageHeader } from "@/components/dashboard/page-header"
import { ProfileForm } from "@/components/settings/profile-form"

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Ajustes" description="Perfil: nombre de usuario y avatar." />
      <ProfileForm />
    </>
  )
}

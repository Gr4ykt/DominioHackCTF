import HeaderNav from "@/components/header"
import { SiteFooter } from "@/components/footer"

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HeaderNav />
      {children}
      <SiteFooter />
    </>
  )
}

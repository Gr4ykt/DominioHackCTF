import { OAuthCallback } from "@/components/auth/oauth-callback"

export default async function OAuthCallbackPage(
  props: PageProps<"/oauth/callback">
) {
  const { error } = await props.searchParams

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12 font-sans">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <OAuthCallback failed={Boolean(error)} />
      </div>
    </div>
  )
}

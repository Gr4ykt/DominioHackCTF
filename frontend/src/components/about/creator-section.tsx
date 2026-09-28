import Image from "next/image"
import {Terminal, BookOpen } from "lucide-react"

const socials = [
  { label: "GitHub", href: "https://github.com/Gr4ykt", icon: Terminal },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mriveragt4", icon: Terminal },
  { label: "Hack The Box", href: "https://app.hackthebox.com/users/351582", icon: Terminal },
  { label: "Blog", href: "https://gr4ykt.github.io/", icon: BookOpen },
]

export function CreatorSection() {
  return (
    <section className="border-b border-border py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-12 px-4 md:grid-cols-5 md:items-center md:gap-16">
        <div className="relative md:col-span-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-card">
            <Image
              src="/creator.jpeg"
              alt="Matías Rivera (gr4ykt)"
              fill
              className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </div>
          <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
            <span className="text-success">●</span> disponible para
            preguntas técnicas
          </p>
        </div>
        
        <div className="md:col-span-3">
          <p className="font-mono text-sm text-primary">$ whoami</p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Matías Rivera
          </h2>

          <p className="mt-2 font-mono text-sm text-muted-foreground">
            gr4ykt — red teamer &amp; full-stack developer
          </p>

          <p className="mt-6 text-muted-foreground sm:text-lg">
            Estudiante de Ingeniería en Informática con cerca de 10 años de
            experiencia autodidacta en desarrollo y ciberseguridad. Su
            especialidad es el hacking ético ofensivo (red team), con
            decenas de máquinas resueltas en Hack The Box y desafíos
            completados en plataformas como TryHackMe y PwnTillDawn.
          </p>

          <p className="mt-4 text-muted-foreground sm:text-lg">
            DominioHackCTF nace de esa doble experiencia: la necesidad de
            una plataforma en español que enseñe hacking ético de forma
            estructurada, uniendo teoría progresiva con laboratorios reales
            desplegados bajo demanda.
          </p>

          <ul className="mt-8 flex flex-wrap gap-3">            
            {socials.map(({ label, href, icon: Icon }) => (              
                <li key={label}>                                  
                <a 
                    href={href}                  
                    target="_blank"                  
                    rel="noopener noreferrer"                  
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >                  
                    <Icon className="h-4 w-4" />                  
                    {label}                
                </a>              
                </li>            
            ))}          
            </ul>
          
        </div>
      </div>
    </section>
  )
}
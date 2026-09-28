"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@base-ui/react";
import { ModeToggle } from "./ui/mode-toggle";

export default function HeaderNav() {
    const pathname = usePathname();

    return(
        <header className="border-b bg-card">
            <div className="container mx-auto flex h-20 items-center justify-between px-4">
                {/* Logo con Image y Link */}
                <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                    <Image 
                        src="/image.png" 
                        alt="Logo DominioHackCTF" 
                        width={45} 
                        height={45} 
                    />
                    <span>DominioHack<span className="text-primary">CTF</span></span>
                </Link>

                {/* Botón de acción */}
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Button size="sm">
                        <Link href="/login">Iniciar sesión</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};
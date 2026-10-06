export const metadata = {
  title: "Política de Privacidad — DominioHackCTF",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="font-mono text-sm text-primary">$ cat privacy.md</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última actualización: 29 de septiembre de 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:mb-3 [&_p]:leading-relaxed [&_li]:leading-relaxed">
        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            DominioHackCTF es un proyecto de título académico, desarrollado
            de forma independiente. El responsable del tratamiento de los
            datos personales recopilados a través de la Plataforma es su
            desarrollador, identificado en la sección &quot;Acerca de&quot;.
          </p>
        </section>

        <section>
          <h2>2. Datos que se recopilan</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Datos de cuenta:</strong>{" "}
              correo electrónico, nombre de usuario y contraseña (almacenada
              de forma cifrada, nunca en texto plano).
            </li>
            <li>
              <strong className="text-foreground">
                Datos de progreso:
              </strong>{" "}
              módulos completados, laboratorios resueltos, flags ingresadas
              y puntaje acumulado.
            </li>
            <li>
              <strong className="text-foreground">
                Datos técnicos y de seguridad:
              </strong>{" "}
              dirección IP, marcas de tiempo y eventos de actividad dentro de
              la Plataforma (por ejemplo, intentos fallidos de inicio de
              sesión), registrados con fines de seguridad operacional
              mediante un sistema de monitoreo (SIEM).
            </li>
            <li>
              <strong className="text-foreground">
                Configuración de VPN:
              </strong>{" "}
              claves generadas para tu conexión WireGuard personal, usadas
              exclusivamente para acceder a tu laboratorio activo.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidad del tratamiento</h2>
          <p>
            Los datos se utilizan exclusivamente para: (a) permitir el
            registro, autenticación y funcionamiento de tu cuenta; (b)
            registrar tu progreso académico dentro de la Plataforma; (c)
            generar el acceso aislado a los laboratorios mediante VPN; y (d)
            detectar y prevenir actividades anómalas o abusivas dentro del
            sistema.
          </p>
        </section>

        <section>
          <h2>4. Base legal</h2>
          <p>
            El tratamiento de tus datos se basa en tu consentimiento,
            otorgado al momento de crear una cuenta en la Plataforma, en los
            términos de la Ley N.º 19.628 sobre Protección de la Vida
            Privada.
          </p>
        </section>

        <section>
          <h2>5. Conservación de los datos</h2>
          <p>
            Tus datos de cuenta y progreso se conservan mientras tu cuenta
            permanezca activa. Los registros técnicos de seguridad se
            conservan por un periodo acotado, suficiente para fines de
            auditoría, tras el cual son eliminados o anonimizados.
          </p>
        </section>

        <section>
          <h2>6. Compartición con terceros</h2>
          <p>
            Los datos no se venden ni se comparten con fines comerciales o
            publicitarios. Se almacenan en la infraestructura de
            alojamiento (VPS) utilizada para operar la Plataforma. No se
            comparten con terceros adicionales, salvo obligación legal.
          </p>
        </section>

        <section>
          <h2>7. Tus derechos</h2>
          <p>
            De acuerdo con la legislación chilena, puedes ejercer tus
            derechos de acceso, rectificación, cancelación y oposición
            (derechos ARCO) sobre tus datos personales, incluyendo la
            eliminación de tu cuenta y la información asociada a ella,
            contactando a través de los canales indicados en la sección
            &quot;Acerca de&quot;.
          </p>
        </section>

        <section>
          <h2>8. Almacenamiento local en el navegador</h2>
          <p>
            La Plataforma utiliza almacenamiento local del navegador para
            guardar tu sesión (token de acceso) y tu preferencia de tema
            (claro/oscuro). No se utilizan cookies de seguimiento con fines
            publicitarios ni de terceros.
          </p>
        </section>

        <section>
          <h2>9. Seguridad de la información</h2>
          <p>
            Se aplican medidas técnicas razonables para proteger tus datos,
            incluyendo cifrado de contraseñas, aislamiento de red por
            usuario para los laboratorios (mediante contenedores y VPN
            independiente) y monitoreo de seguridad de la infraestructura.
            Ninguna plataforma puede garantizar seguridad absoluta.
          </p>
        </section>

        <section>
          <h2>10. Menores de edad</h2>
          <p>
            La Plataforma no está dirigida a menores de 14 años. Los
            usuarios entre 14 y 18 años deben contar con autorización de su
            madre, padre o tutor legal.
          </p>
        </section>

        <section>
          <h2>11. Cambios a esta política</h2>
          <p>
            Esta política puede actualizarse en cualquier momento. Los
            cambios relevantes se reflejarán en la fecha de última
            actualización indicada al inicio de este documento.
          </p>
        </section>

        <section>
          <h2>12. Contacto</h2>
          <p>
            Para consultas o solicitudes relacionadas con tus datos
            personales, puedes contactar a través de los canales indicados
            en la sección &quot;Acerca de&quot; de la Plataforma.
          </p>
        </section>
      </div>
    </main>
  )
}
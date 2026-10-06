export const metadata = {
  title: "Términos y Condiciones — DominioHackCTF",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <p className="font-mono text-sm text-primary">$ cat terms.md</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última actualización: 29 de septiembre de 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:mb-3 [&_p]:leading-relaxed [&_li]:leading-relaxed">
        <section>
          <h2>1. Objeto y aceptación</h2>
          <p>
            DominioHackCTF (en adelante, &quot;la Plataforma&quot;) es un
            proyecto educativo, desarrollado como proyecto de título de la
            carrera de Ingeniería en Informática, que ofrece módulos teóricos
            de ciberseguridad y laboratorios prácticos tipo CTF (Capture The
            Flag) en entornos aislados. Al registrarte y utilizar la
            Plataforma, aceptas íntegramente estos Términos y Condiciones. Si
            no estás de acuerdo con alguno de sus puntos, debes abstenerte de
            usar el servicio.
          </p>
        </section>

        <section>
          <h2>2. Naturaleza del servicio</h2>
          <p>
            La Plataforma es un proyecto académico sin fines de lucro,
            operado con fines educativos y de práctica de ciberseguridad
            ofensiva de forma controlada y ética. No se cobra por el acceso
            a los contenidos ni a los laboratorios en su versión actual. La
            disponibilidad, continuidad y soporte del servicio no están
            garantizados y pueden interrumpirse sin previo aviso, dado su
            carácter no comercial.
          </p>
        </section>

        <section>
          <h2>3. Cuenta de usuario</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Para acceder a los módulos y laboratorios es necesario crear
              una cuenta, proporcionando un correo electrónico válido y una
              contraseña.
            </li>
            <li>
              Eres responsable de mantener la confidencialidad de tus
              credenciales y de toda actividad realizada bajo tu cuenta.
            </li>
            <li>
              Debes notificar de inmediato cualquier uso no autorizado de tu
              cuenta.
            </li>
            <li>
              La Plataforma no está dirigida a menores de 14 años. Si tienes
              entre 14 y 18 años, declaras contar con autorización de tu
              madre, padre o tutor legal para su uso.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Uso permitido de los laboratorios</h2>
          <p>
            Los laboratorios son entornos aislados y efímeros, desplegados
            exclusivamente para fines de aprendizaje. Al utilizar la
            Plataforma, te comprometes a:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Utilizar las técnicas de hacking ético{" "}
              <strong className="text-foreground">
                únicamente dentro de los laboratorios provistos por la
                Plataforma
              </strong>
              , accedidos a través de la conexión VPN asignada a tu cuenta.
            </li>
            <li>
              No utilizar la infraestructura, credenciales de acceso o
              conocimientos adquiridos para atacar sistemas de terceros,
              reales o ajenos a la Plataforma, sin autorización explícita de
              sus propietarios.
            </li>
            <li>
              No intentar vulnerar la infraestructura de la propia
              Plataforma (escape de contenedores, ataques a otros usuarios,
              acceso no autorizado a la red de otro laboratorio) fuera del
              alcance definido de cada máquina.
            </li>
            <li>
              No compartir públicamente las flags, soluciones o writeups no
              oficiales de los laboratorios antes de que estos sean
              publicados o desbloqueados por el sistema para todos los
              usuarios.
            </li>
            <li>
              No utilizar herramientas automatizadas de denegación de
              servicio (DoS/DDoS) contra la infraestructura de la
              Plataforma.
            </li>
          </ul>
          <p className="mt-3">
            El incumplimiento de este punto se considera una infracción
            grave y puede derivar en la suspensión inmediata de la cuenta,
            sin perjuicio de las acciones legales que correspondan según la
            legislación chilena aplicable, incluyendo la Ley N.º 19.223 sobre
            delitos informáticos.
          </p>
        </section>

        <section>
          <h2>5. Propiedad intelectual</h2>
          <p>
            El contenido teórico, el diseño de los laboratorios, las flags,
            los writeups oficiales y el código de la Plataforma son de
            autoría del desarrollador del proyecto o se utilizan bajo
            licencias que permiten su uso educativo. Queda prohibida la
            reproducción, distribución o explotación comercial de estos
            materiales sin autorización previa.
          </p>
        </section>

        <section>
          <h2>6. Suspensión y terminación de cuenta</h2>
          <p>
            La Plataforma se reserva el derecho de suspender o eliminar
            cuentas que incumplan estos Términos, incluyendo el uso indebido
            de los laboratorios, comportamiento abusivo hacia otros usuarios,
            o intentos de comprometer la infraestructura del sistema.
          </p>
        </section>

        <section>
          <h2>7. Limitación de responsabilidad</h2>
          <p>
            La Plataforma se ofrece &quot;tal cual&quot;, sin garantías de
            disponibilidad continua, ausencia de errores o idoneidad para un
            propósito específico. Al ser un proyecto académico, no se
            garantiza soporte técnico permanente. El uso de los
            conocimientos adquiridos fuera del entorno de la Plataforma es
            de exclusiva responsabilidad del usuario.
          </p>
        </section>

        <section>
          <h2>8. Modificaciones</h2>
          <p>
            Estos Términos pueden actualizarse en cualquier momento. Los
            cambios relevantes se reflejarán en la fecha de última
            actualización indicada al inicio de este documento.
          </p>
        </section>

        <section>
          <h2>9. Ley aplicable</h2>
          <p>
            Estos Términos se rigen por las leyes de la República de Chile.
            Cualquier controversia derivada de su interpretación o
            aplicación se someterá a los tribunales competentes de Chile.
          </p>
        </section>

        <section>
          <h2>10. Contacto</h2>
          <p>
            Para consultas sobre estos Términos, puedes contactar a través
            de los canales indicados en la sección &quot;Acerca de&quot; de
            la Plataforma.
          </p>
        </section>
      </div>
    </main>
  )
}
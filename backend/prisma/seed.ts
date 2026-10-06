// Datos de desarrollo. No crea usuarios: el primer registro recibe el rol superuser.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { generateFlagSalt, hashFlag } from '../src/flags/flag-hash.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

// Máquina de prueba para validar el motor de labs (corre estable bajo runsc).
// Flags solo de desarrollo; las máquinas reales traen las suyas en la imagen.
const DEV_MACHINE = {
  slug: 'juice-shop',
  name: 'OWASP Juice Shop',
  description:
    'Aplicación web deliberadamente vulnerable. Máquina de prueba del entorno de desarrollo.',
  difficulty: 'easy',
  points: 30,
  dockerImage: 'bkimminich/juice-shop:latest',
  dockerInternalPort: 3000,
  category: 'web',
  writeupEs: '# Juice Shop\n\nWriteup de ejemplo (desarrollo).',
  writeupEn: '# Juice Shop\n\nSample writeup (development).',
} as const;

const DEV_FLAGS = [
  { type: 'user', value: 'DHCTF{dev_user_flag}', points: 10 },
  { type: 'root', value: 'DHCTF{dev_root_flag}', points: 20 },
] as const;

async function main() {
  const machine = await prisma.machine.upsert({
    where: { slug: DEV_MACHINE.slug },
    update: {},
    create: DEV_MACHINE,
  });

  for (const flag of DEV_FLAGS) {
    const salt = generateFlagSalt();
    await prisma.flag.upsert({
      where: { machineId_type: { machineId: machine.id, type: flag.type } },
      update: {},
      create: {
        machineId: machine.id,
        type: flag.type,
        salt,
        value: hashFlag(flag.value, salt),
        points: flag.points,
      },
    });
  }

  const moduleCount = await prisma.learningModule.count();
  if (moduleCount === 0) {
    await prisma.learningModule.create({
      data: {
        titleEs: 'Introducción a SQL Injection',
        titleEn: 'Introduction to SQL Injection',
        contentEs:
          '# SQL Injection\n\nContenido de ejemplo para el entorno de desarrollo.',
        contentEn:
          '# SQL Injection\n\nSample content for the development environment.',
        category: 'SQLi',
        order: 1,
        isActive: true,
        questions: {
          create: [
            {
              questionEs:
                '¿Qué carácter suele usarse para cerrar una cadena en una inyección SQL?',
              questionEn:
                'Which character is commonly used to close a string in a SQL injection?',
              type: 'multiple_choice',
              order: 1,
              options: {
                create: [
                  {
                    textEs: "Comilla simple (')",
                    textEn: "Single quote (')",
                    isCorrect: true,
                  },
                  { textEs: 'Arroba (@)', textEn: 'At sign (@)' },
                  { textEs: 'Numeral (#)', textEn: 'Hash (#)' },
                ],
              },
            },
          ],
        },
      },
    });
  }

  console.log(
    `Seed listo: máquina "${machine.slug}", ${DEV_FLAGS.length} flags, módulos: ${await prisma.learningModule.count()}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

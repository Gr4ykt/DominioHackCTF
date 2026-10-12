// Datos de desarrollo. No crea usuarios: el primer registro recibe el rol superuser.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { generateFlagSalt, hashFlag } from '../src/flags/flag-hash.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

// Catálogo de desarrollo. Las flags en texto plano viven solo aquí y en la
// imagen de cada máquina; en BD se guarda su hash + salt.
const MACHINES = [
  {
    slug: 'vulneraweb',
    name: 'VulneraWeb',
    description:
      'Aplicación web administrativa legacy con SQLi, LFI y escalada a root. Dificultad Easy.',
    difficulty: 'easy',
    points: 30,
    dockerImage: 'vulneraweb:latest',
    dockerInternalPort: 80,
    category: 'web',
    writeupEs: '# VulneraWeb\n\nWriteup oficial (pendiente de redactar).',
    writeupEn: '# VulneraWeb\n\nOfficial writeup (to be written).',
    flags: [
      { type: 'user', value: 'DHCTF{vuln3r4web_us3r_4cc3ss}', points: 10 },
      { type: 'root', value: 'DHCTF{vuln3r4web_r00t_pwn3d}', points: 20 },
    ],
  },
  {
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
    flags: [
      { type: 'user', value: 'DHCTF{dev_user_flag}', points: 10 },
      { type: 'root', value: 'DHCTF{dev_root_flag}', points: 20 },
    ],
  },
] as const;

async function main() {
  for (const { flags, ...machineData } of MACHINES) {
    const machine = await prisma.machine.upsert({
      where: { slug: machineData.slug },
      update: {},
      create: machineData,
    });
    for (const flag of flags) {
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
    `Seed listo: ${MACHINES.length} máquinas, ${await prisma.learningModule.count()} módulos`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

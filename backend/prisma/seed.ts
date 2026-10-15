// Datos de desarrollo. No crea usuarios: el primer registro recibe el rol superuser.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { generateFlagSalt, hashFlag } from '../src/flags/flag-hash.js';
import { SEED_MODULES } from './modules-seed.js';

const connectionString = process.env['DATABASE_URL'];
// RDS exige conexión cifrada; en local (Postgres del compose) no hay SSL.
const useSsl = /\.rds\.amazonaws\.com/.test(connectionString ?? '');
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  }),
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

  // Módulos de aprendizaje: se crean/actualizan por slug y se reemplazan sus
  // preguntas en cada corrida (así el contenido del seed se mantiene al día).
  for (const mod of SEED_MODULES) {
    const module = await prisma.learningModule.upsert({
      where: { slug: mod.slug },
      update: {
        titleEs: mod.title_es,
        titleEn: mod.title_en,
        contentEs: mod.content_es,
        contentEn: mod.content_en,
        category: mod.category,
        order: mod.order,
        isActive: mod.is_active,
      },
      create: {
        slug: mod.slug,
        titleEs: mod.title_es,
        titleEn: mod.title_en,
        contentEs: mod.content_es,
        contentEn: mod.content_en,
        category: mod.category,
        order: mod.order,
        isActive: mod.is_active,
      },
    });

    await prisma.moduleQuestion.deleteMany({ where: { moduleId: module.id } });
    for (const q of mod.questions) {
      await prisma.moduleQuestion.create({
        data: {
          moduleId: module.id,
          questionEs: q.question_es,
          questionEn: q.question_en,
          type: q.type,
          order: q.order,
          answer: q.type === 'fill_blank' ? q.answer : null,
          options:
            q.type === 'multiple_choice' && q.options
              ? {
                  create: q.options.map((o) => ({
                    textEs: o.text_es,
                    textEn: o.text_en,
                    isCorrect: o.is_correct,
                  })),
                }
              : undefined,
        },
      });
    }
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

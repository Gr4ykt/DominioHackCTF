import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  LearningModule,
  ModuleQuestion,
  UserModuleProgress,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateModuleDto } from './dto/create-module.dto.js';
import type { QuestionInputDto } from './dto/set-questions.dto.js';
import type { UpdateModuleDto } from './dto/update-module.dto.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Lang = 'es' | 'en';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- Usuario ----------------

  /** Módulos publicados con el progreso del usuario. */
  async listForUser(userId: string, lang: Lang) {
    const [modules, progress] = await Promise.all([
      this.prisma.learningModule.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { questions: true } } },
      }),
      this.prisma.userModuleProgress.findMany({ where: { userId } }),
    ]);
    const byModule = new Map(progress.map((p) => [p.moduleId, p]));
    return modules.map((m) => {
      const p = byModule.get(m.id);
      return {
        id: m.id,
        slug: m.slug,
        title: lang === 'en' ? m.titleEn : m.titleEs,
        category: m.category,
        order: m.order,
        total_questions: m._count.questions,
        is_complete: p?.isComplete ?? false,
        score: p?.score ?? 0,
      };
    });
  }

  /** Contenido del módulo (según idioma) + progreso. */
  async getForUser(idOrSlug: string, userId: string, lang: Lang) {
    const module = await this.resolve(idOrSlug);
    if (!module.isActive) throw new NotFoundException('Módulo no disponible');
    const [count, progress] = await Promise.all([
      this.prisma.moduleQuestion.count({ where: { moduleId: module.id } }),
      this.progressFor(userId, module.id),
    ]);
    return {
      id: module.id,
      slug: module.slug,
      title: lang === 'en' ? module.titleEn : module.titleEs,
      content: lang === 'en' ? module.contentEn : module.contentEs,
      category: module.category,
      total_questions: count,
      is_complete: progress?.isComplete ?? false,
      score: progress?.score ?? 0,
    };
  }

  /** Preguntas del módulo SIN revelar la respuesta correcta. */
  async getQuestionsForUser(idOrSlug: string, userId: string, lang: Lang) {
    const module = await this.resolve(idOrSlug);
    if (!module.isActive) throw new NotFoundException('Módulo no disponible');
    const [questions, progress] = await Promise.all([
      this.prisma.moduleQuestion.findMany({
        where: { moduleId: module.id },
        orderBy: { order: 'asc' },
        include: { options: true },
      }),
      this.progressFor(userId, module.id),
    ]);
    const done = new Set(progress?.correctQuestionIds ?? []);
    return questions.map((q) => ({
      id: q.id,
      question: lang === 'en' ? q.questionEn : q.questionEs,
      type: q.type,
      answered_correct: done.has(q.id),
      options:
        q.type === 'multiple_choice'
          ? q.options.map((o) => ({
              id: o.id,
              text: lang === 'en' ? o.textEn : o.textEs,
            }))
          : undefined,
    }));
  }

  /** Valida una respuesta, guarda el progreso y completa el módulo si aplica. */
  async answer(
    idOrSlug: string,
    userId: string,
    questionId: string,
    answer: string,
  ) {
    const module = await this.resolve(idOrSlug);
    if (!module.isActive) throw new NotFoundException('Módulo no disponible');
    const question = await this.prisma.moduleQuestion.findFirst({
      where: { id: questionId, moduleId: module.id },
      include: { options: true },
    });
    if (!question) throw new BadRequestException('Pregunta inválida');

    const correct = this.isCorrect(question, answer);

    // Lee/crea el progreso y recalcula.
    const existing = await this.progressFor(userId, module.id);
    const correctIds = new Set(existing?.correctQuestionIds ?? []);
    if (correct) correctIds.add(questionId);

    const total = await this.prisma.moduleQuestion.count({
      where: { moduleId: module.id },
    });
    const allQuestionIds = (
      await this.prisma.moduleQuestion.findMany({
        where: { moduleId: module.id },
        select: { id: true },
      })
    ).map((q) => q.id);
    const isComplete =
      total > 0 && allQuestionIds.every((id) => correctIds.has(id));

    await this.prisma.userModuleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId: module.id } },
      create: {
        userId,
        moduleId: module.id,
        attempts: 1,
        score: correctIds.size,
        correctQuestionIds: [...correctIds],
        isComplete,
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        attempts: { increment: 1 },
        score: correctIds.size,
        correctQuestionIds: [...correctIds],
        isComplete,
        completedAt: isComplete ? (existing?.completedAt ?? new Date()) : null,
      },
    });

    return {
      correct,
      module_complete: isComplete,
      score: correctIds.size,
      total,
    };
  }

  // ---------------- Administración ----------------

  async listAllForAdmin() {
    const modules = await this.prisma.learningModule.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { questions: true } } },
    });
    return modules.map((m) => ({
      id: m.id,
      slug: m.slug,
      title_es: m.titleEs,
      title_en: m.titleEn,
      category: m.category,
      order: m.order,
      is_active: m.isActive,
      total_questions: m._count.questions,
      created_at: m.createdAt,
    }));
  }

  /** Módulo completo con preguntas y respuestas (para editar). */
  async getFullForAdmin(idOrSlug: string) {
    const module = await this.resolve(idOrSlug);
    const questions = await this.prisma.moduleQuestion.findMany({
      where: { moduleId: module.id },
      orderBy: { order: 'asc' },
      include: { options: true },
    });
    return {
      id: module.id,
      slug: module.slug,
      title_es: module.titleEs,
      title_en: module.titleEn,
      content_es: module.contentEs,
      content_en: module.contentEn,
      category: module.category,
      order: module.order,
      is_active: module.isActive,
      questions: questions.map((q) => ({
        question_es: q.questionEs,
        question_en: q.questionEn,
        type: q.type,
        order: q.order,
        answer: q.answer,
        options: q.options.map((o) => ({
          text_es: o.textEs,
          text_en: o.textEn,
          is_correct: o.isCorrect,
        })),
      })),
    };
  }

  create(dto: CreateModuleDto) {
    return this.prisma.learningModule.create({
      data: {
        slug: dto.slug,
        titleEs: dto.title_es,
        titleEn: dto.title_en,
        contentEs: dto.content_es,
        contentEn: dto.content_en,
        category: dto.category,
        order: dto.order,
      },
    });
  }

  async update(idOrSlug: string, dto: UpdateModuleDto) {
    const module = await this.resolve(idOrSlug);
    return this.prisma.learningModule.update({
      where: { id: module.id },
      data: {
        slug: dto.slug,
        titleEs: dto.title_es,
        titleEn: dto.title_en,
        contentEs: dto.content_es,
        contentEn: dto.content_en,
        category: dto.category,
        order: dto.order,
      },
    });
  }

  async toggle(idOrSlug: string) {
    const module = await this.resolve(idOrSlug);
    return this.prisma.learningModule.update({
      where: { id: module.id },
      data: { isActive: !module.isActive },
    });
  }

  async remove(idOrSlug: string) {
    const module = await this.resolve(idOrSlug);
    await this.prisma.learningModule.delete({ where: { id: module.id } });
  }

  /** Reemplaza TODAS las preguntas del módulo (borra y recrea). */
  async setQuestions(idOrSlug: string, questions: QuestionInputDto[]) {
    const module = await this.resolve(idOrSlug);
    for (const q of questions) {
      if (q.type === 'multiple_choice') {
        const correct = (q.options ?? []).filter((o) => o.is_correct).length;
        if (!q.options || q.options.length < 2 || correct !== 1) {
          throw new BadRequestException(
            'Cada pregunta de opción múltiple requiere ≥2 opciones y exactamente 1 correcta',
          );
        }
      } else if (!q.answer || q.answer.trim().length === 0) {
        throw new BadRequestException(
          'Las preguntas de completar requieren una respuesta',
        );
      }
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.moduleQuestion.deleteMany({ where: { moduleId: module.id } });
      for (const q of questions) {
        await tx.moduleQuestion.create({
          data: {
            moduleId: module.id,
            questionEs: q.question_es,
            questionEn: q.question_en,
            type: q.type,
            order: q.order,
            answer: q.type === 'fill_blank' ? q.answer : null,
            options:
              q.type === 'multiple_choice'
                ? {
                    create: (q.options ?? []).map((o) => ({
                      textEs: o.text_es,
                      textEn: o.text_en,
                      isCorrect: o.is_correct,
                    })),
                  }
                : undefined,
          },
        });
      }
    });
    return this.getFullForAdmin(module.id);
  }

  // ---------------- internos ----------------

  private isCorrect(
    question: ModuleQuestion & {
      options: { id: string; isCorrect: boolean }[];
    },
    answer: string,
  ): boolean {
    if (question.type === 'multiple_choice') {
      return question.options.some((o) => o.id === answer && o.isCorrect);
    }
    return (
      !!question.answer &&
      answer.trim().toLowerCase() === question.answer.trim().toLowerCase()
    );
  }

  private progressFor(
    userId: string,
    moduleId: string,
  ): Promise<UserModuleProgress | null> {
    return this.prisma.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
  }

  private async resolve(idOrSlug: string): Promise<LearningModule> {
    const where = UUID_RE.test(idOrSlug)
      ? { id: idOrSlug }
      : { slug: idOrSlug };
    const module = await this.prisma.learningModule.findUnique({ where });
    if (!module) throw new NotFoundException('Módulo no encontrado');
    return module;
  }
}

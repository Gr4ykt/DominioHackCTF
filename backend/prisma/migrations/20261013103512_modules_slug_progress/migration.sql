-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "slug" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "user_module_progress" ADD COLUMN     "correct_question_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");


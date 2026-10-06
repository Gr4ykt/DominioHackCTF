-- CreateEnum
CREATE TYPE "role" AS ENUM ('superuser', 'admin', 'user');

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "machine_os" AS ENUM ('linux');

-- CreateEnum
CREATE TYPE "flag_type" AS ENUM ('user', 'root');

-- CreateEnum
CREATE TYPE "lab_status" AS ENUM ('starting', 'active', 'expired', 'stopped', 'error');

-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('multiple_choice', 'fill_blank');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "provider" "auth_provider" NOT NULL DEFAULT 'local',
    "google_id" VARCHAR(255),
    "role" "role" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "difficulty" NOT NULL,
    "os" "machine_os" NOT NULL DEFAULT 'linux',
    "points" INTEGER NOT NULL,
    "docker_image" VARCHAR(255) NOT NULL,
    "docker_internal_port" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "writeup_es" TEXT,
    "writeup_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flags" (
    "id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "type" "flag_type" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "salt" VARCHAR(64) NOT NULL,
    "points" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "container_id" VARCHAR(255),
    "container_name" VARCHAR(255),
    "status" "lab_status" NOT NULL DEFAULT 'starting',
    "network_name" VARCHAR(255),
    "subnet_index" INTEGER,
    "assigned_ip" VARCHAR(20),
    "wireguard_ip" VARCHAR(20),
    "extensions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),

    CONSTRAINT "lab_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_flags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "flag_id" UUID NOT NULL,
    "type" "flag_type" NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_machines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "user_flag_obtained" BOOLEAN NOT NULL DEFAULT false,
    "root_flag_obtained" BOOLEAN NOT NULL DEFAULT false,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "writeup_unlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wireguard_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "assigned_ip" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "wireguard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "title_es" VARCHAR(255) NOT NULL,
    "title_en" VARCHAR(255) NOT NULL,
    "content_es" TEXT NOT NULL,
    "content_en" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_questions" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "question_es" TEXT NOT NULL,
    "question_en" TEXT NOT NULL,
    "type" "question_type" NOT NULL,
    "answer" VARCHAR(255),
    "order" INTEGER NOT NULL,

    CONSTRAINT "module_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "text_es" VARCHAR(500) NOT NULL,
    "text_en" VARCHAR(500) NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "module_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_total_points_idx" ON "users"("total_points" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "machines_slug_key" ON "machines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "flags_machine_id_type_key" ON "flags"("machine_id", "type");

-- CreateIndex
CREATE INDEX "lab_sessions_user_id_status_idx" ON "lab_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "lab_sessions_status_expires_at_idx" ON "lab_sessions"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_flags_user_id_flag_id_key" ON "user_flags"("user_id", "flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_machines_user_id_machine_id_key" ON "user_machines"("user_id", "machine_id");

-- CreateIndex
CREATE UNIQUE INDEX "wireguard_configs_user_id_key" ON "wireguard_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wireguard_configs_public_key_key" ON "wireguard_configs"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "wireguard_configs_assigned_ip_key" ON "wireguard_configs"("assigned_ip");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_progress_user_id_module_id_key" ON "user_module_progress"("user_id", "module_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_sessions" ADD CONSTRAINT "lab_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_sessions" ADD CONSTRAINT "lab_sessions_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flags" ADD CONSTRAINT "user_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flags" ADD CONSTRAINT "user_flags_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flags" ADD CONSTRAINT "user_flags_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_machines" ADD CONSTRAINT "user_machines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_machines" ADD CONSTRAINT "user_machines_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wireguard_configs" ADD CONSTRAINT "wireguard_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_questions" ADD CONSTRAINT "module_questions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_options" ADD CONSTRAINT "module_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "module_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

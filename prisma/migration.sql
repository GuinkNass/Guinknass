-- Migration SQL: Studio 13Point Tattoo & GuinkNass
-- Adiciona suporte a retenção estrita de sinal, anamnese com assinatura digital e uploads

-- 1. Atualizar ou criar o ENUM de Status com CANCELLED_DEPOSIT_FORFEITED
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE "AppointmentStatus" AS ENUM (
      'PENDING_PAYMENT',
      'CONFIRMED',
      'CANCELLED',
      'CANCELLED_DEPOSIT_FORFEITED',
      'COMPLETED'
    );
  ELSE
    ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_DEPOSIT_FORFEITED';
  END IF;
END $$;

-- 2. Atualizar tabela quotes com campos de penalidade de cancelamento
ALTER TABLE "quotes" 
ADD COLUMN IF NOT EXISTS "has_cancellation_penalty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "reschedule_fee_due" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 3. Atualizar tabela appointments com retenção, consentimento, uploads e quitação
ALTER TABLE "appointments" 
ADD COLUMN IF NOT EXISTS "is_fully_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "balance_paid_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "balance_order_id" TEXT,
ADD COLUMN IF NOT EXISTS "deposit_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deposit_forfeited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT,
ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "skin_photo_url" TEXT,
ADD COLUMN IF NOT EXISTS "reference_images" JSONB;

-- 4. Criar tabela de Termos de Anamnese com Assinatura Digital
CREATE TABLE IF NOT EXISTS "anamnese_terms" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointment_id" TEXT NOT NULL UNIQUE,
  "client_cpf" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "has_allergies" BOOLEAN NOT NULL DEFAULT false,
  "allergies_details" TEXT,
  "has_healing_problems" BOOLEAN NOT NULL DEFAULT false,
  "uses_anticoagulants" BOOLEAN NOT NULL DEFAULT false,
  "has_diabetes" BOOLEAN NOT NULL DEFAULT false,
  "is_pregnant_or_lactating" BOOLEAN NOT NULL DEFAULT false,
  "has_skin_diseases" BOOLEAN NOT NULL DEFAULT false,
  "skin_diseases_details" TEXT,
  "signature_base64" TEXT NOT NULL,
  "ip_address" TEXT,
  "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_anamnese_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_anamnese_client_cpf" ON "anamnese_terms"("client_cpf");

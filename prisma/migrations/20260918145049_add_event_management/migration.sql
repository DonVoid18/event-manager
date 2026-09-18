-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GRATUITO', 'PAGO');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDIENTE', 'ENVIADA', 'CONFIRMADA');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('ACCESO', 'DOCUMENTACION', 'PAGO', 'TECNICA', 'OTRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'COLABORADOR';

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "type" "EventType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendees" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "payment_amount" DOUBLE PRECISION,
    "payment_reference" TEXT,
    "payment_receipt_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "attendee_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_status_history" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "attendee_id" TEXT NOT NULL,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "attendee_id" TEXT,
    "description" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_code_key" ON "events"("code");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_event_id_document_id_key" ON "attendees"("event_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_event_id_email_key" ON "attendees"("event_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_attendee_id_key" ON "invitations"("attendee_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_code_key" ON "invitations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_attendee_id_key" ON "check_ins"("attendee_id");

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_status_history" ADD CONSTRAINT "invitation_status_history_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "attendees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

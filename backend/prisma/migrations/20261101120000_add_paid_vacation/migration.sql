-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('paid_vacation');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "vacationCarryOverHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vacationCarryOverYear" INTEGER,
ADD COLUMN     "vacationHoursPerYear" DECIMAL(6,2);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'paid_vacation',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "weekdays" INTEGER[],
    "minutesPerDay" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Leave_jobId_startDate_idx" ON "Leave"("jobId", "startDate");

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

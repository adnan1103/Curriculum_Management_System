-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'COMPLETED');

-- AlterTable
ALTER TABLE "_SubjectToTeacher" ADD CONSTRAINT "_SubjectToTeacher_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SubjectToTeacher_AB_unique";

-- CreateTable
CREATE TABLE "ElectiveCourse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "semester" TEXT,
    "schedule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "ElectiveCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveEnrollment" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "electiveCourseId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',

    CONSTRAINT "ElectiveEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveCourse_code_key" ON "ElectiveCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveEnrollment_studentId_electiveCourseId_key" ON "ElectiveEnrollment"("studentId", "electiveCourseId");

-- AddForeignKey
ALTER TABLE "ElectiveCourse" ADD CONSTRAINT "ElectiveCourse_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveEnrollment" ADD CONSTRAINT "ElectiveEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveEnrollment" ADD CONSTRAINT "ElectiveEnrollment_electiveCourseId_fkey" FOREIGN KEY ("electiveCourseId") REFERENCES "ElectiveCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

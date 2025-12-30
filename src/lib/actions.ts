"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  electiveCourseSchema,
  electiveEnrollmentSchema
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    (await clerkClient()).users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


type ElectiveCourseState = {
  success: boolean;
  error: boolean;
  message?: string;
};



// CREATE ELECTIVE COURSE (Admin Only)
export const createElectiveCourse = async (
  currentState: ElectiveCourseState,
  data: FormData
): Promise<ElectiveCourseState> => {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const formData = Object.fromEntries(data.entries());
    const validatedData = electiveCourseSchema.parse({
      ...formData,
      isActive: formData.isActive === "true" || formData.isActive === "on",
    });

    await prisma.electiveCourse.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
        capacity: validatedData.capacity,
        credits: validatedData.credits,
        semester: validatedData.semester || null,
        schedule: validatedData.schedule || null,
        isActive: validatedData.isActive,
        teacherId: validatedData.teacherId || null,
      },
    });

    revalidatePath("/list/elective-courses");
    return { success: true, error: false, message: "Course created successfully!" };
  } catch (err: any) {
    console.error(err);
    return { 
      success: false, 
      error: true, 
      message: err.code === "P2002" ? "Course code already exists!" : "Failed to create course" 
    };
  }
};

// UPDATE ELECTIVE COURSE (Admin Only)
export const updateElectiveCourse = async (
  currentState: ElectiveCourseState,
  data: FormData
): Promise<ElectiveCourseState> => {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const formData = Object.fromEntries(data.entries());
    const validatedData = electiveCourseSchema.parse({
      ...formData,
      isActive: formData.isActive === "true" || formData.isActive === "on",
    });

    await prisma.electiveCourse.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
        capacity: validatedData.capacity,
        credits: validatedData.credits,
        semester: validatedData.semester || null,
        schedule: validatedData.schedule || null,
        isActive: validatedData.isActive,
        teacherId: validatedData.teacherId || null,
      },
    });

    revalidatePath("/list/elective-courses");
    return { success: true, error: false, message: "Course updated successfully!" };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: true, message: "Failed to update course" };
  }
};

// DELETE ELECTIVE COURSE (Admin Only)
export const deleteElectiveCourse = async (
  currentState: ElectiveCourseState,
  data: FormData
): Promise<ElectiveCourseState> => {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: true, message: "Unauthorized" };
    }

    const id = data.get("id") as string;

    // First delete all enrollments for this course
    await prisma.electiveEnrollment.deleteMany({
      where: { electiveCourseId: parseInt(id) },
    });

    // Then delete the course
    await prisma.electiveCourse.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/list/elective-courses");
    return { success: true, error: false, message: "Course deleted successfully!" };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to delete course" };
  }
};

// ==================== ELECTIVE ENROLLMENT ACTIONS ====================

type EnrollmentState = {
  success: boolean;
  error: boolean;
  message?: string;
};

// ENROLL IN ELECTIVE COURSE (Student)
export const enrollInElectiveCourse = async (
  currentState: EnrollmentState,
  data: FormData
): Promise<EnrollmentState> => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: true, message: "You must be logged in!" };
    }

    const electiveCourseId = parseInt(data.get("electiveCourseId") as string);

    // Get the course with current enrollment count
    const course = await prisma.electiveCourse.findUnique({
      where: { id: electiveCourseId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: "ENROLLED" }
            }
          }
        }
      }
    });

    if (!course) {
      return { success: false, error: true, message: "Course not found!" };
    }

    if (!course.isActive) {
      return { success: false, error: true, message: "This course is not available for enrollment!" };
    }

    // Check if course is full
    if (course._count.enrollments >= course.capacity) {
      return { success: false, error: true, message: "Sorry! This course is full. No seats available." };
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.electiveEnrollment.findUnique({
      where: {
        studentId_electiveCourseId: {
          studentId: userId,
          electiveCourseId: electiveCourseId,
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "ENROLLED") {
        return { success: false, error: true, message: "You are already enrolled in this course!" };
      } else {
        // Re-enroll if previously dropped
        await prisma.electiveEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ENROLLED", enrolledAt: new Date() }
        });
        revalidatePath("/list/my-electives");
        revalidatePath("/student");
        return { success: true, error: false, message: "Successfully re-enrolled in the course!" };
      }
    }

    // Create new enrollment
    await prisma.electiveEnrollment.create({
      data: {
        studentId: userId,
        electiveCourseId: electiveCourseId,
        status: "ENROLLED",
      }
    });

    revalidatePath("/list/my-electives");
    revalidatePath("/student");
    return { success: true, error: false, message: "Successfully enrolled in the course!" };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: true, message: "Failed to enroll. Please try again." };
  }
};

// DROP ELECTIVE COURSE (Student)
export const dropElectiveCourse = async (
  currentState: EnrollmentState,
  data: FormData
): Promise<EnrollmentState> => {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: true, message: "You must be logged in!" };
    }

    const electiveCourseId = parseInt(data.get("electiveCourseId") as string);

    const enrollment = await prisma.electiveEnrollment.findUnique({
      where: {
        studentId_electiveCourseId: {
          studentId: userId,
          electiveCourseId: electiveCourseId,
        }
      }
    });

    if (!enrollment) {
      return { success: false, error: true, message: "Enrollment not found!" };
    }

    await prisma.electiveEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "DROPPED" }
    });

    revalidatePath("/list/my-electives");
    revalidatePath("/student");
    return { success: true, error: false, message: "Successfully dropped the course!" };
  } catch (err) {
    console.error(err);
    return { success: false, error: true, message: "Failed to drop course. Please try again." };
  }
};

// GET AVAILABLE ELECTIVE COURSES
export const getAvailableElectiveCourses = async () => {
  try {
    const courses = await prisma.electiveCourse.findMany({
      where: { isActive: true },
      include: {
        teacher: {
          select: {
            name: true,
            surname: true,
          }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: "ENROLLED" }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return courses.map(course => ({
      ...course,
      enrolledCount: course._count.enrollments,
      availableSeats: course.capacity - course._count.enrollments,
      isFull: course._count.enrollments >= course.capacity,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
};

// GET STUDENT'S ENROLLED COURSES
export const getStudentEnrollments = async (studentId: string) => {
  try {
    const enrollments = await prisma.electiveEnrollment.findMany({
      where: { 
        studentId: studentId,
        status: "ENROLLED"
      },
      include: {
        electiveCourse: {
          include: {
            teacher: {
              select: {
                name: true,
                surname: true,
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: "desc" }
    });

    return enrollments;
  } catch (err) {
    console.error(err);
    return [];
  }
};

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ElectiveCourseCard from "@/components/ElectiveCourseCard";

const MyElectivesPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-xl font-semibold text-red-500">Access Denied</h1>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  // Get all active elective courses with enrollment counts
  const courses = await prisma.electiveCourse.findMany({
    where: { isActive: true },
    include: {
      teacher: {
        select: {
          name: true,
          surname: true,
        },
      },
      _count: {
        select: {
          enrollments: {
            where: { status: "ENROLLED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get student's current enrollments
  const studentEnrollments = await prisma.electiveEnrollment.findMany({
    where: {
      studentId: userId,
      status: "ENROLLED",
    },
    select: {
      electiveCourseId: true,
    },
  });

  const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.electiveCourseId));

  // Transform courses data
  const coursesWithDetails = courses.map((course) => ({
    ...course,
    enrolledCount: course._count.enrollments,
    availableSeats: course.capacity - course._count.enrollments,
    isFull: course._count.enrollments >= course.capacity,
  }));

  // Separate enrolled and available courses
  const enrolledCourses = coursesWithDetails.filter((c) => enrolledCourseIds.has(c.id));
  const availableCourses = coursesWithDetails.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Elective Courses</h1>
        <p className="text-gray-600 mt-2">
          Browse and enroll in available elective courses. Each course has limited seats.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-600 font-medium">
              {availableCourses.length} Available
            </span>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <span className="text-green-600 font-medium">
              {enrolledCourses.length} Enrolled
            </span>
          </div>
        </div>
      </div>

      {/* My Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📚 My Enrolled Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <ElectiveCourseCard
                key={course.id}
                course={course}
                isEnrolled={true}
                studentId={userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🎓 Available Courses
        </h2>
        {availableCourses.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600">No courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <ElectiveCourseCard
                key={course.id}
                course={course}
                isEnrolled={false}
                studentId={userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyElectivesPage;
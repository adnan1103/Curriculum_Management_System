import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import BigCalendar from "@/components/BigCalender";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

const StudentPage = async () => {
  const { userId } = await auth();

  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId! } },
    },
  });

  // Get student's elective enrollments
  const electiveEnrollments = await prisma.electiveEnrollment.findMany({
    where: {
      studentId: userId!,
      status: "ENROLLED",
    },
    include: {
      electiveCourse: {
        include: {
          teacher: {
            select: { name: true, surname: true },
          },
        },
      },
    },
    take: 3,
  });

  // Get available courses count
  const availableCoursesCount = await prisma.electiveCourse.count({
    where: {
      isActive: true,
      enrollments: {
        none: {
          studentId: userId!,
          status: "ENROLLED",
        },
      },
    },
  });

  console.log(classItem);
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule (4A)</h1>
          {/* <BigCalendarContainer type="classId" id={classItem[0]?.id} /> */}

          {classItem.length > 0 ? (
            <BigCalendarContainer type="classId" id={classItem[0].id} />
          ) : (
            <div className="p-4 text-red-500">
              No class assigned. Please contact your administrator.
            </div>
          )}
        </div>

        {/* Elective Courses Section */}
        <div className="bg-white p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">My Elective Courses</h2>
            <Link
              href="/list/my-electives"
              className="text-blue-500 text-sm hover:underline"
            >
              View All →
            </Link>
          </div>

          {electiveEnrollments.length > 0 ? (
            <div className="space-y-3">
              {electiveEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">
                      {enrollment.electiveCourse.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {enrollment.electiveCourse.teacher
                        ? `${enrollment.electiveCourse.teacher.name} ${enrollment.electiveCourse.teacher.surname}`
                        : "TBA"}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Enrolled
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">
                You haven't enrolled in any elective courses yet.
              </p>
              <Link
                href="/list/my-electives"
                className="text-blue-500 hover:underline text-sm"
              >
                Browse available courses →
              </Link>
            </div>
          )}

          {availableCoursesCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">
                📢 {availableCoursesCount} elective course
                {availableCoursesCount > 1 ? "s" : ""} available for enrollment!
              </p>
            </div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;

import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/userCard";
import prisma from "@/lib/prisma";
import Link from "next/link";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  // Get elective course stats
  const electiveStats = await prisma.electiveCourse.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          enrollments: {
            where: { status: "ENROLLED" },
          },
        },
      },
    },
  });

  const totalCourses = electiveStats.length;
  const totalCapacity = electiveStats.reduce((acc, c) => acc + c.capacity, 0);
  const totalEnrolled = electiveStats.reduce(
    (acc, c) => acc + c._count.enrollments,
    0
  );
  const fullCourses = electiveStats.filter(
    (c) => c._count.enrollments >= c.capacity
  ).length;

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* Left Side */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* User Cards */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin" />
          <UserCard type="teacher" />
          <UserCard type="student" />
          <UserCard type="parent" />
        </div>
        {/* Elective Courses Overview */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Elective Courses Overview</h2>
            <Link
              href="/list/elective-courses"
              className="text-blue-500 text-sm hover:underline"
            >
              Manage Courses →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{totalCourses}</p>
              <p className="text-sm text-gray-600">Active Courses</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">
                {totalEnrolled}
              </p>
              <p className="text-sm text-gray-600">Total Enrollments</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {totalCapacity - totalEnrolled}
              </p>
              <p className="text-sm text-gray-600">Available Seats</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-red-600">{fullCourses}</p>
              <p className="text-sm text-gray-600">Full Courses</p>
            </div>
          </div>

          {/* Recent Courses */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Recent Courses
            </h3>
            <div className="space-y-2">
              {electiveStats.slice(0, 3).map((course) => {
                const percentage =
                  (course._count.enrollments / course.capacity) * 100;
                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">{course.name}</p>
                      <p className="text-xs text-gray-500">{course.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 100
                              ? "bg-red-500"
                              : percentage >= 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {course._count.enrollments}/{course.capacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Charts */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Count Chart */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/*Attendance Chart */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>
        {/* Bottom Charts */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>
      {/* Right Side */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;

import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { Prisma } from "@prisma/client";

type ElectiveCourseWithDetails = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  capacity: number;
  credits: number;
  semester: string | null;
  schedule: string | null;
  isActive: boolean;
  teacher: {
    name: string;
    surname: string;
  } | null;
  _count: {
    enrollments: number;
  };
};

const ElectiveCoursesListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Only admin can access this page
  if (role !== "admin") {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-xl font-semibold text-red-500">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const columns = [
    { header: "Course Name", accessor: "name" },
    { header: "Code", accessor: "code", className: "hidden md:table-cell" },
    { header: "Capacity", accessor: "capacity", className: "hidden md:table-cell" },
    { header: "Enrolled", accessor: "enrolled", className: "hidden md:table-cell" },
    { header: "Instructor", accessor: "teacher", className: "hidden lg:table-cell" },
    { header: "Status", accessor: "status", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item: ElectiveCourseWithDetails) => {
    const enrolledCount = item._count.enrollments;
    const isFull = enrolledCount >= item.capacity;
    const progressPercentage = (enrolledCount / item.capacity) * 100;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">{item.credits} Credits</p>
          </div>
        </td>
        <td className="hidden md:table-cell">{item.code}</td>
        <td className="hidden md:table-cell">{item.capacity}</td>
        <td className="hidden md:table-cell">
          <div className="flex flex-col gap-1">
            <span className={`font-medium ${isFull ? "text-red-500" : "text-green-600"}`}>
              {enrolledCount}/{item.capacity}
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  isFull ? "bg-red-500" : progressPercentage >= 80 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </td>
        <td className="hidden lg:table-cell">
          {item.teacher ? `${item.teacher.name} ${item.teacher.surname}` : "TBA"}
        </td>
        <td className="hidden md:table-cell">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="electiveCourse" type="update" data={item} />
            <FormContainer table="electiveCourse" type="delete" id={item.id} />
          </div>
        </td>
      </tr>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.ElectiveCourseWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { code: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.electiveCourse.findMany({
      where: query,
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
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.electiveCourse.count({ where: query }),
  ]);

  // Get teachers for the form
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Elective Courses Management
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormContainer
              table="electiveCourse"
              type="create"
              relatedData={{ teachers }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-blue-600 text-sm font-medium">Total Courses</h3>
          <p className="text-2xl font-bold text-blue-800">{count}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-green-600 text-sm font-medium">Active Courses</h3>
          <p className="text-2xl font-bold text-green-800">
            {data.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-yellow-600 text-sm font-medium">Total Capacity</h3>
          <p className="text-2xl font-bold text-yellow-800">
            {data.reduce((acc, c) => acc + c.capacity, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-purple-600 text-sm font-medium">Total Enrolled</h3>
          <p className="text-2xl font-bold text-purple-800">
            {data.reduce((acc, c) => acc + c._count.enrollments, 0)}
          </p>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ElectiveCoursesListPage;

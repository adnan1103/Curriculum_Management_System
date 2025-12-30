"use client";

import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { enrollInElectiveCourse, dropElectiveCourse } from "@/lib/actions";

type ElectiveCourseCardProps = {
  course: {
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
    enrolledCount: number;
    availableSeats: number;
    isFull: boolean;
  };
  isEnrolled: boolean;
  studentId: string;
};

const ElectiveCourseCard = ({ course, isEnrolled, studentId }: ElectiveCourseCardProps) => {
  const [loading, setLoading] = useState(false);

  const [enrollState, enrollAction] = useFormState(enrollInElectiveCourse, {
    success: false,
    error: false,
    message: "",
  });

  const [dropState, dropAction] = useFormState(dropElectiveCourse, {
    success: false,
    error: false,
    message: "",
  });

  useEffect(() => {
    if (enrollState.success) {
      toast.success(enrollState.message);
      setLoading(false);
    }
    if (enrollState.error) {
      toast.error(enrollState.message);
      setLoading(false);
    }
  }, [enrollState]);

  useEffect(() => {
    if (dropState.success) {
      toast.success(dropState.message);
      setLoading(false);
    }
    if (dropState.error) {
      toast.error(dropState.message);
      setLoading(false);
    }
  }, [dropState]);

  const handleEnroll = () => {
    if (course.isFull) {
      toast.error("This course is full!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("electiveCourseId", course.id.toString());
    enrollAction(formData);
  };

  const handleDrop = () => {
    if (confirm("Are you sure you want to drop this course?")) {
      setLoading(true);
      const formData = new FormData();
      formData.append("electiveCourseId", course.id.toString());
      dropAction(formData);
    }
  };

  const progressPercentage = (course.enrolledCount / course.capacity) * 100;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
      course.isFull ? "border-red-200 bg-red-50" : isEnrolled ? "border-green-200 bg-green-50" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className={`p-4 ${course.isFull ? "bg-red-500" : isEnrolled ? "bg-green-500" : "bg-blue-500"} text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{course.name}</h3>
            <p className="text-sm opacity-90">{course.code}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            course.isFull ? "bg-red-700" : isEnrolled ? "bg-green-700" : "bg-blue-700"
          }`}>
            {course.isFull ? "FULL" : isEnrolled ? "ENROLLED" : `${course.availableSeats} seats left`}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {course.description && (
          <p className="text-gray-600 text-sm mb-4">{course.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">👨‍🏫 Instructor:</span>
            <span className="font-medium">
              {course.teacher ? `${course.teacher.name} ${course.teacher.surname}` : "TBA"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📚 Credits:</span>
            <span className="font-medium">{course.credits}</span>
          </div>
          {course.semester && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📅 Semester:</span>
              <span className="font-medium">{course.semester}</span>
            </div>
          )}
          {course.schedule && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">⏰ Schedule:</span>
              <span className="font-medium">{course.schedule}</span>
            </div>
          )}
        </div>

        {/* Enrollment Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Enrollment</span>
            <span className="font-medium">{course.enrolledCount}/{course.capacity}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                progressPercentage >= 100 ? "bg-red-500" : 
                progressPercentage >= 80 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          {progressPercentage >= 80 && !course.isFull && (
            <p className="text-xs text-orange-600 mt-1">⚠️ Filling up fast!</p>
          )}
        </div>

        {/* Action Button */}
        {isEnrolled ? (
          <button
            onClick={handleDrop}
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Processing..." : "Drop Course"}
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={loading || course.isFull}
            className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
              course.isFull
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {loading ? "Processing..." : course.isFull ? "Course Full" : "Enroll Now"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ElectiveCourseCard;
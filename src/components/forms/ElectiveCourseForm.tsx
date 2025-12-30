"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { electiveCourseSchema, ElectiveCourseSchema } from "@/lib/formValidationSchemas";
import { createElectiveCourse, updateElectiveCourse } from "@/lib/actions";
import InputField from "../InputField";

type Teacher = {
  id: string;
  name: string;
  surname: string;
};

type ElectiveCourseFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData?: {
    teachers?: Teacher[];
  };
};

const ElectiveCourseForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ElectiveCourseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElectiveCourseSchema>({
    resolver: zodResolver(electiveCourseSchema),
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      code: data?.code || "",
      description: data?.description || "",
      capacity: data?.capacity || 30,
      credits: data?.credits || 3,
      semester: data?.semester || "",
      schedule: data?.schedule || "",
      isActive: data?.isActive ?? true,
      teacherId: data?.teacherId || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createElectiveCourse : updateElectiveCourse,
    { success: false, error: false, message: "" }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || `Elective course ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    });
    formAction(form);
  });

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Elective Course" : "Update Elective Course"}
      </h1>

      <div className="flex flex-wrap gap-4">
        {data && (
          <input type="hidden" {...register("id")} />
        )}

        <InputField
          label="Course Name"
          name="name"
          register={register}
          error={errors.name}
          placeholder="e.g., Advanced Web Development"
        />

        <InputField
          label="Course Code"
          name="code"
          register={register}
          error={errors.code}
          placeholder="e.g., CS-ELEC-101"
        />

        <InputField
          label="Description"
          name="description"
          register={register}
          error={errors.description}
          placeholder="Brief description of the course"
        />

        <InputField
          label="Capacity (Max Students)"
          name="capacity"
          type="number"
          register={register}
          error={errors.capacity}
          defaultValue={30}
        />

        <InputField
          label="Credits"
          name="credits"
          type="number"
          register={register}
          error={errors.credits}
          defaultValue={3}
        />

        <InputField
          label="Semester"
          name="semester"
          register={register}
          error={errors.semester}
          placeholder="e.g., Fall 2024"
        />

        <InputField
          label="Schedule"
          name="schedule"
          register={register}
          error={errors.schedule}
          placeholder="e.g., Mon/Wed 10:00-11:30 AM"
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Instructor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
          >
            <option value="">Select Instructor</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">{errors.teacherId.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-1/4">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="w-4 h-4"
            defaultChecked={data?.isActive ?? true}
          />
          <label htmlFor="isActive" className="text-sm text-gray-600">
            Active (Available for enrollment)
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        {type === "create" ? "Create Course" : "Update Course"}
      </button>
    </form>
  );
};

export default ElectiveCourseForm;
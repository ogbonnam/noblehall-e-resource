"use client";

import { useFormStatus } from "react-dom";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // Import useRouter

interface CompleteProfileFormProps {
  initialYearGroup?: string;
  initialSubjects?: string[];
  profileError?: string;
  profileSuccess?: string;
  signupSuccess?: string;
  updateProfile: (formData: FormData) => Promise<void>;
}

const yearGroups = [
  "",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
];
const subjectsList = [
  "Chemistry",
  "Physics",
  "Mathematics",
  "English",
  "Geography",
  "Economics",
  "Arts",
  "Civic Education",
  "Biology",
];

export default function CompleteProfileForm({
  initialYearGroup,
  initialSubjects,
  profileError,
  profileSuccess,
  signupSuccess,
  updateProfile,
}: CompleteProfileFormProps) {
  const { pending } = useFormStatus();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialSubjects || []
  );
  const [yearGroup, setYearGroup] = useState<string>(initialYearGroup || "");
  const router = useRouter(); // Initialize useRouter

  // Effect to update local state if initial props change
  useEffect(() => {
    if (initialYearGroup !== undefined && initialYearGroup !== yearGroup) {
      setYearGroup(initialYearGroup);
    }
    if (
      initialSubjects !== undefined &&
      JSON.stringify(initialSubjects) !== JSON.stringify(selectedSubjects)
    ) {
      setSelectedSubjects(initialSubjects);
    }
  }, [initialYearGroup, initialSubjects]);

  // useEffect to display toast and clear cookies
  useEffect(() => {
    if (profileError) {
      toast.error(profileError);
      document.cookie = `profileError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    if (profileSuccess) {
      toast.success(profileSuccess);
      document.cookie = `profileSuccess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    if (signupSuccess) {
      toast.success(signupSuccess);
      document.cookie = `signupSuccess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [profileError, profileSuccess, signupSuccess]);

  const handleSubjectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedSubjects((prev) =>
      checked ? [...prev, value] : prev.filter((subject) => subject !== value)
    );
  };

  const handleYearGroupChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setYearGroup(event.target.value);
  };

  // NEW: Handle "Remind me later" click
  const handleRemindMeLater = () => {
    toast("You can always come back to edit your profile!", {
      icon: "💡",
      duration: 3000, // Show toast for 3 seconds
    });
    // Redirect after a short delay to allow toast to be seen
    setTimeout(() => {
      router.push("/students/dashboard");
    }, 1000); // Redirect after 1 second
  };

  return (
    <div
      className="relative bg-white bg-opacity-95 p-10 rounded-3xl shadow-2xl w-full max-w-lg
                    md:w-1/2 lg:w-2/5 xl:w-1/3
                    border border-gray-100 backdrop-blur-sm transform hover:scale-102 transition-transform duration-300 ease-in-out"
    >
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight leading-tight">
        Complete Your Profile
      </h2>

      <form action={updateProfile} className="space-y-7">
        {/* Year Group Selection */}
        <div>
          <label
            htmlFor="yearGroup"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Year Group
          </label>
          <select
            id="yearGroup"
            name="yearGroup"
            value={yearGroup}
            onChange={handleYearGroupChange}
            className="mt-1 block w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm
                       focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 text-base
                       transition duration-200 ease-in-out bg-white appearance-none pr-8 cursor-pointer"
          >
            {yearGroups.map((group) => (
              <option key={group === "" ? "none" : group} value={group}>
                {group === "" ? "-- Select Year Group (Optional) --" : group}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects Selection (Checkboxes) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Subjects
          </label>
          <div className="grid grid-cols-2 gap-3 text-gray-800">
            {subjectsList.map((subject) => (
              <div key={subject} className="flex items-center">
                <input
                  type="checkbox"
                  id={subject.toLowerCase().replace(/\s/g, "-")}
                  name="subjects"
                  value={subject}
                  checked={selectedSubjects.includes(subject)}
                  onChange={handleSubjectChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor={subject.toLowerCase().replace(/\s/g, "-")}
                  className="ml-2 text-sm font-medium"
                >
                  {subject}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={pending}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg
                       text-lg font-bold text-white bg-gradient-to-r from-green-500 to-teal-600
                       hover:from-green-600 hover:to-teal-700
                       focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-green-500
                       transition duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl
                       ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {pending ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-700">
        <button
          onClick={handleRemindMeLater} // Call the new handler
          className="font-bold text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out underline"
        >
          Remind me later
        </button>
      </p>
    </div>
  );
}

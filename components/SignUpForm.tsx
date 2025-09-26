"use client"; // This component needs to be a Client Component

import { useFormStatus } from "react-dom"; // Import useFormStatus hook
import React, { useEffect } from "react"; // Import React and useEffect for clearing cookies
import toast, { Toaster } from "react-hot-toast"; // Import toast and Toaster

// Define props for the client component
interface SignupFormProps {
  signupError?: string; // Error message passed from the server component
  signupAction: (formData: FormData) => Promise<void>; // Server Action function
}

export default function SignupForm({
  signupError,
  signupAction,
}: SignupFormProps) {
  // Hook to get the submission status of the form
  const { pending } = useFormStatus();

  // useEffect to display toast and clear the signupError cookie after it's displayed
  useEffect(() => {
    if (signupError) {
      toast.error(signupError); // Show error toast
      // Create a date in the past to expire the cookie immediately
      document.cookie = `signupError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    // For success messages, they would typically be shown on the redirected page (e.g., /complete-profile)
    // as this component will unmount after a successful signup and redirect.
  }, [signupError]);

  return (
    // Form container with refined styling, centered and elevated
    <div
      className="relative bg-white bg-opacity-95 p-10 rounded-3xl shadow-2xl w-full max-w-lg
                    md:w-1/2 lg:w-2/5 xl:w-1/3
                    border border-gray-100 backdrop-blur-sm transform hover:scale-102 transition-transform duration-300 ease-in-out"
    >
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight leading-tight">
        Join Us Today
      </h2>

      {/* The error message div is now removed as toasts will handle display */}
      {/* {signupError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-3 rounded-xl relative mb-8 text-sm font-medium animate-pulse" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{signupError}</span>
        </div>
      )} */}

      <form action={signupAction} className="space-y-7">
        {/* Full Name Input */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            className="mt-1 block w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400
                       focus:outline-none focus:ring-3 focus:ring-purple-400 focus:border-purple-400 text-base
                       transition duration-200 ease-in-out"
            placeholder="Your full name"
          />
        </div>
        {/* Email Address Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400
                       focus:outline-none focus:ring-3 focus:ring-purple-400 focus:border-purple-400 text-base
                       transition duration-200 ease-in-out"
            placeholder="name@example.com"
          />
        </div>
        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400
                       focus:outline-none focus:ring-3 focus:ring-purple-400 focus:border-purple-400 text-base
                       transition duration-200 ease-in-out"
            placeholder="At least 8 characters"
          />
        </div>
        {/* Sign Up Button */}
        <div>
          <button
            type="submit"
            // Disable button when form is pending
            disabled={pending}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg
                       text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700
                       focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500
                       transition duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl
                       ${pending ? "opacity-70 cursor-not-allowed" : ""}`} // Styling for disabled state
          >
            {pending ? "Signing Up..." : "Sign Up"}{" "}
            {/* Change text when pending */}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <p className="mt-10 text-center text-sm text-gray-700">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-bold text-indigo-600 hover:text-indigo-700 transition duration-150 ease-in-out underline"
        >
          Login here
        </a>
      </p>
    </div>
  );
}

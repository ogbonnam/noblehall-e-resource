"use client";
import React, { useEffect } from "react";
import { useFormStatus } from "react-dom";
import toast, { Toaster } from "react-hot-toast"; // Import toast and Toaster
import Image from "next/image"; // ✅ Next.js Image component

// Define props for the client component
interface LoginFormProps {
  loginError?: string; // Error message passed from the server component
  loginAction: (formData: FormData) => Promise<void>; // Server Action function
}

export default function LoginForm({ loginError, loginAction }: LoginFormProps) {
  // Hook to get the submission status of the form
  const { pending } = useFormStatus();

  // useEffect to display toast for errors and clear the loginError cookie
  useEffect(() => {
    if (loginError) {
      toast.error(loginError); // Show error toast
      // Clear the cookie client-side after display
      document.cookie = `loginError=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [loginError]);

  return (
    // Form container with refined styling, centered and elevated
    <div
      className="relative bg-white bg-opacity-95 p-10 rounded-3xl shadow-2xl w-full max-w-lg
                    md:w-1/2 lg:w-2/5 xl:w-1/3
                    border border-gray-100 backdrop-blur-sm transform hover:scale-102 transition-transform duration-300 ease-in-out"
    >
      {/* 🔹 Logo + Title Section */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/icon/NH.png"
          alt="Noble Hall Logo"
          width={80}
          height={80}
          className="mb-3"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          NHERC CENTER
        </h1>
      </div>
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight leading-tight">
        Welcome Back!
      </h2>

      <form action={loginAction} className="space-y-7">
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
                       focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 text-base
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
                       focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 text-base
                       transition duration-200 ease-in-out"
            placeholder="Your password"
          />
        </div>
        {/* Login Button */}
        <div>
          <button
            type="submit"
            disabled={pending}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg
                       text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700
                       focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500
                       transition duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl
                       ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {pending ? "Logging In..." : "Login"}
          </button>
        </div>
      </form>

      {/* Signup Link */}
      <p className="mt-10 text-center text-sm text-gray-700">
        Don't have an account?{" "}
        <a
          href="/signup"
          className="font-bold text-indigo-600 hover:text-indigo-700 transition duration-150 ease-in-out underline"
        >
          Sign Up here
        </a>
      </p>
    </div>
  );
}

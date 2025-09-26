import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import auth from "@/auth"; // Assuming your auth.ts is in utils
import SignupForm from "@/components/SignUpForm"; // Import the new client component
import { signupAction } from "./action"; // The server action

// This page remains a Server Component
export default async function SignupPage() {
  // Server-side check for authenticated user
  const user = await auth.getUser();
  if (user) {
    redirect("/login"); // Redirect to home if already logged in
  }

  // Server-side reading of the signup error cookie
  const cookiesStore = await cookies();
  const signupError = cookiesStore.get("signupError")?.value;

  return (
    // Main container for the signup page with background and overlay
    <div
      className="min-h-screen flex items-center justify-center p-8 font-inter relative
                    bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600"
    >
      {/* Optional subtle pattern overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-10"></div>

      {/* Render the Client Component and pass props */}
      <SignupForm signupError={signupError} signupAction={signupAction} />
    </div>
  );
}

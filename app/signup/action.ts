"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient, ID } from "@/appwrite/appwriteClient";
import { appwriteConfig } from "@/appwrite/config";
import { Permission, Role } from "node-appwrite"; // from node-appwrite SDK


// Define the shape of expected form data for better type safety
interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
}

export async function signupAction(formData: FormData) {
  const data = Object.fromEntries(formData) as unknown as SignupFormData;
  const { fullName, email, password } = data;

  // Basic validation (you can expand this significantly)
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
    const cookiesStore = await cookies();
    cookiesStore.set("signupError", "Full name is required.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/signup");
    return;
  }
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    const cookiesStore = await cookies();
    cookiesStore.set("signupError", "A valid email is required.", {
      path: "/",
      maxAge: 5,
    });
    redirect("/signup");
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    const cookiesStore = await cookies();
    cookiesStore.set(
      "signupError",
      "Password must be at least 8 characters long.",
      { path: "/", maxAge: 5 }
    );
    redirect("/signup");
    return;
  }

  try {
    const { account, databases } = await createAdminClient();

    // 1. Create the user in Appwrite Authentication
    const newUser = await account.create(
      ID.unique(), // User ID
      email, // User email
      password, // User password
      fullName // User name
    );

    // 2. Add user profile to your custom 'users' database collection
    await databases.createDocument(
  appwriteConfig.databaseId,                 // Your Appwrite Database ID
  appwriteConfig.usersCollectionId,          // Your Users Collection ID
  ID.unique(),                               // Auto-generate document ID
  {
    userId: newUser.$id,                     // Link to Appwrite Auth user
    fullName: fullName,
    email: email,
    accountType: "student",
    createdAt: new Date().toISOString(),
  },
  [
    Permission.read(Role.user(newUser.$id)),   // Allow the user to read their own profile
    Permission.write(Role.user(newUser.$id)),  // Allow the user to update their profile
    // Optionally: add admin access or broader access here
  ]
);

    // 3. Create a session for the newly created user
    const session = await account.createEmailPasswordSession(email, password);

    // 4. Set the session cookie
    const cookiesStore = await cookies();
    cookiesStore.set("session", session.secret, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expire),
      path: "/",
    });

    // Redirect to /complete-profile for newly signed-up student users
    redirect("/complete-profile");
  } catch (error: any) {
    console.error("Signup failed:", error);
    const cookiesStore = await cookies();
    let errorMessage = "An unexpected error occurred during signup.";

    if (error && typeof error === "object" && "message" in error) {
      errorMessage = error.message;
    }

    cookiesStore.set("signupError", errorMessage, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10,
      path: "/",
    });
    redirect("/signup"); // Redirect back to signup with error
  }
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  createSessionClient,
} from "@/appwrite/appwriteClient";

// Import RequestCookie type from Next.js headers (still correct for Next.js server environment)
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

// Import Models from node-appwrite
import type { Models } from "node-appwrite"; // <--- CHANGE IS HERE

// Define the type for the User object from Appwrite
type AppwriteUser = Models.User<Models.Preferences>; // This should now correctly reference Models from node-appwrite

interface AuthState {
  user: AppwriteUser | null;
  sessionCookie: RequestCookie | undefined | null;
  getUser: () => Promise<AppwriteUser | null>;
  createSession: (formData: FormData) => Promise<void>;
  deleteSession: () => Promise<void>;
}

const auth: AuthState = {
  user: null,
  sessionCookie: null,
  getUser: async () => {
    const cookiesStore = await cookies();
    auth.sessionCookie = cookiesStore.get("session");

    try {
      if (auth.sessionCookie) {
        // createSessionClient should be set up to use node-appwrite's Client
        const { account } = await createSessionClient(auth.sessionCookie.value);
        auth.user = await account.get();
      } else {
        auth.user = null;
        auth.sessionCookie = null;
      }
    } catch (error) {
      console.error("Error fetching user session:", error);
      auth.user = null;
      auth.sessionCookie = null;
    }
    return auth.user;
  },

  createSession: async (formData) => {
    "use server";

    const data = Object.fromEntries(formData);
    const email = data.email as string;
    const password = data.password as string;

    // Basic validation
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      const cookiesStore = await cookies();
      cookiesStore.set("loginError", "Email and password are required", {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 5,
        path: "/",
      });
      redirect("/login");
      return;
    }

    // createAdminClient should be set up to use node-appwrite's Client with an API key
    const { account } = await createAdminClient();

    try {
      // createEmailPasswordSession is common across both SDKs
      const session = await account.createEmailPasswordSession(email, password);

      const cookiesStore = await cookies();
      cookiesStore.set("session", session.secret, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        expires: new Date(session.expire),
        path: "/",
      });

      redirect("/");
    } catch (error) {
      console.error("Login failed:", error);
      const cookiesStore = await cookies();
      let errorMessage = "An unknown error occurred.";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as { message: string }).message;
        // Appwrite errors often have specific codes or messages you could parse
        // e.g., if (error.code === 400) errorMessage = "Invalid credentials";
      }
      cookiesStore.set("loginError", errorMessage, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 5,
        path: "/",
      });
      redirect("/login");
    }
  },

  deleteSession: async () => {
    "use server";
    const cookiesStore = await cookies();
    auth.sessionCookie = cookiesStore.get("session");

    try {
      if (auth.sessionCookie) {
        // createSessionClient should be set up to use node-appwrite's Client
        const { account } = await createSessionClient(auth.sessionCookie.value);
        await account.deleteSession("current");
      }
    } catch (error) {
      console.error("Error deleting Appwrite session:", error);
    }

    await cookiesStore.delete("session");
    auth.user = null;
    auth.sessionCookie = null;
    redirect("/login");
  },
};

export default auth;

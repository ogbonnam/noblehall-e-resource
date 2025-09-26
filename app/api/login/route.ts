import { NextResponse } from "next/server";
import { createAdminClient } from "@/appwrite/appwriteClient";
import { Query } from "node-appwrite";
import { appwriteConfig } from "@/appwrite/config";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const { account, databases } = await createAdminClient();
    console.log("Appwrite client created");

    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created");

    // ✅ Get user info from your users collection
    const dbUser = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.usersCollectionId!,
      [Query.equal("email", [email])]
    );

    if (!dbUser.total || dbUser.documents[0].accountType !== "student") {
      return NextResponse.json(
        { error: "Only students are allowed." },
        { status: 403 }
      );
    }

    const userDoc = dbUser.documents[0];

    return NextResponse.json({
      sessionId: session.$id,
      secret: session.secret,
      expire: session.expire,
      userId: session.userId, // we get this from session
      email: userDoc.email,
      name: userDoc.name,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err.message || "Login failed" },
      { status: 500 }
    );
  }
}

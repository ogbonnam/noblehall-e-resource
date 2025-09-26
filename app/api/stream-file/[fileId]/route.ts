// app/api/stream-file/[fileId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/appwrite/appwriteClient";
import { appwriteConfig } from "@/appwrite/config";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  context: { params: { fileId: string } }
) {
  const { fileId } = context.params;

  // --- CORRECTED: Use 'await' to resolve the headers object ---
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const sessionToken = authHeader?.replace("Bearer ", "");

  // Ensure both a fileId and a session token are present
  if (!fileId || !sessionToken) {
    return NextResponse.json(
      { error: "Missing file ID or authorization token." },
      { status: 400 }
    );
  }

  try {
    // Authenticate the user's session token from the mobile app
    const { storage } = await createSessionClient(sessionToken);

    // Fetch the raw file content from Appwrite Storage
    const fileBuffer = await storage.getFileView(
      appwriteConfig.booksBucketId,
      fileId
    );

    // Fetch file metadata to get the MIME type and original file name
    const fileInfo = await storage.getFile(
      appwriteConfig.booksBucketId,
      fileId
    );

    // Set the appropriate headers for the response
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", fileInfo.mimeType);
    responseHeaders.set("Content-Length", fileInfo.sizeOriginal.toString());
    responseHeaders.set(
      "Content-Disposition",
      `inline; filename="${fileInfo.name}"`
    );

    // Stream the file buffer back to the client
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error streaming file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve book file." },
      { status: 500 }
    );
  }
}

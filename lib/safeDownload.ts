import { appwriteConfig } from "@/appwrite/config";
import { createSessionClient } from "@/appwrite/appwriteClient";

export async function getBookDownloadUrlFromToken(
  token: string,
  fileId: string
): Promise<string | null> {
  try {
    const { storage } = await createSessionClient(token);

    const downloadUrl = storage.getFileDownload(
      appwriteConfig.booksBucketId,
      fileId
    );

    return downloadUrl.toString();
  } catch (err) {
    console.error("Error generating book download URL from token:", err);
    return null;
  }
}

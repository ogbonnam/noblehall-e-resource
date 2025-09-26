// import { NextRequest, NextResponse } from "next/server";
// import { getBookDownloadUrlForMobile } from "@/app/students/dashboard/actions"; // Use the correct function name

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const fileId = searchParams.get("fileId");

//   if (!fileId) {
//     return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
//   }

//   try {
//     const signedUrl = await getBookDownloadUrlForMobile(fileId);

//     if (!signedUrl) {
//       return NextResponse.json(
//         { error: "Could not generate download URL." },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({ fileUrl: signedUrl }); // ✅ Send signed URL as JSON
//   } catch (err: any) {
//     console.error("Download URL API error:", err);
//     return NextResponse.json(
//       { error: err.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/download-book/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getBookDownloadUrlForMobile } from "@/app/students/dashboard/actions";

// export async function GET(req: NextRequest) {
//   const fileId = req.nextUrl.searchParams.get("fileId");
//   const authHeader = req.headers.get("authorization");
//   const token = authHeader?.replace("Bearer ", "");

//   if (!fileId || !token) {
//     return NextResponse.json(
//       { error: "Missing fileId or Authorization token." },
//       { status: 400 }
//     );
//   }

//   const url = await getBookDownloadUrlForMobile(fileId, token);

//   if (!url) {
//     return NextResponse.json({ error: "Could not generate download URL." }, { status: 500 });
//   }

//   return NextResponse.json({ fileUrl: url });
// }

// app/api/download-book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBookDownloadUrlForMobile } from "@/app/students/dashboard/actions";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("fileId");
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!fileId || !token) {
    return NextResponse.json(
      { error: "Missing fileId or Authorization token." },
      { status: 400 }
    );
  }

  const url = await getBookDownloadUrlForMobile(fileId, token);

  if (!url) {
    return NextResponse.json(
      { error: "Could not generate download URL." },
      { status: 500 }
    );
  }

  return NextResponse.json({ fileUrl: url }); // ✅ returns { fileUrl: "https://..." }
}

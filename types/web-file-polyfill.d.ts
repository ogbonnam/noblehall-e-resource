// src/types/web-file-polyfill.d.ts
// This file provides explicit type declarations for the 'web-file-polyfill' module.
// It helps TypeScript correctly understand the 'File' and 'Blob' classes provided by the polyfill,
// especially when the package's own 'exports' map in package.json might cause resolution issues.

declare module "web-file-polyfill" {
  // Re-declare the standard Blob interface as provided by the polyfill
  export class Blob {
    readonly size: number;
    readonly type: string;
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);
    arrayBuffer(): Promise<ArrayBuffer>;
    slice(start?: number, end?: number, contentType?: string): Blob;
    stream(): ReadableStream;
    text(): Promise<string>;
  }

  // Re-declare the standard File interface, extending Blob
  export class File extends Blob {
    readonly name: string;
    readonly lastModified: number;
    constructor(
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag
    );
  }

  // Helper types for Blob and File constructors
  interface BlobPropertyBag {
    type?: string;
    endings?: "transparent" | "native";
  }
  interface FilePropertyBag extends BlobPropertyBag {
    lastModified?: number;
  }

  // Type for parts that can compose a Blob or File
  type BlobPart = BufferSource | Blob | string;
}

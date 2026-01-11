"use client";

import { IKContext, IKUpload } from "imagekitio-react";

/**
 * Shape of image data we store in state / DB
 */
type UploadedImage = {
  url: string;
  fileId: string;
};

/**
 * Props:
 * - folder: where ImageKit should upload the image
 * - onUpload: callback after successful upload
 */
type Props = {
  folder: string;
  onUpload: (image: UploadedImage) => void;
};

export default function ImageUploader({ folder, onUpload }: Props) {
  return (
    <IKContext
      /**
       * Public config (safe to expose)
       */
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
      /**
       * Authenticator runs on client, but calls YOUR backend
       * Backend signs the upload request securely
       */
      authenticator={async () => {
        const res = await fetch("/api/imagekit/auth");
        if (!res.ok) throw new Error("ImageKit auth failed");
        return res.json();
      }}
    >
      <IKUpload
        /**
         * We upload ONE image per click
         * Multiple images = multiple uploads
         */
        multiple={false}
        /**
         * This decides the folder structure in ImageKit
         * Example:
         * /watchera/products/rolex-submariner/black/
         */
        folder={folder}
        /**
         * Called AFTER successful upload to ImageKit
         */
        onSuccess={(res) => {
          onUpload({
            url: res.url,     // CDN URL
            fileId: res.fileId, // Needed for delete later
          });
        }}
        /**
         * Upload error handling
         */
        onError={(err) => {
          console.error("Image upload failed:", err);
        }}
      />
    </IKContext>
  );
}

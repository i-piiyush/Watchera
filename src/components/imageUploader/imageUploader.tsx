"use client";

import { IKContext, IKUpload } from "imagekitio-react";

type UploadedImage = {
  url: string;
  fileId: string;
};

type Props = {
  onUpload: (image: UploadedImage) => void;
};

export default function ImageUploader({ onUpload }: Props) {
  return (
    <IKContext
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
      authenticator={async () => {
        const res = await fetch("/api/imagekit/auth");
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      }}
    >
      <IKUpload
        multiple={false} // IMPORTANT: SDK uploads ONE file per instance
        folder={"/watchera/products/"}
        onSuccess={(res) => {
          onUpload({
            url: res.url,
            fileId: res.fileId,
          });
        }}
        onError={(err) => {
          console.error("Upload failed", err);
        }}
      />
    </IKContext>
  );
}

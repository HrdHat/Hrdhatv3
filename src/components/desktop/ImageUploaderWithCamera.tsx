/**
 * ImageUploaderWithCamera Component
 *
 * Desktop-specific version of the image uploader that adds webcam support.
 * Extends ImageUploaderBase with the following additional features:
 * - Live webcam preview
 * - Ability to capture photos directly from webcam
 * - Toggle between file upload and camera modes
 * - Confirmation before image removal
 * - Constrained thumbnail preview
 * - Camera facing mode toggle
 *
 * Requires the 'react-webcam' package for camera functionality.
 * Uses the front-facing camera by default.
 */

import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  ImageUploaderBase,
  ImageUploaderBaseProps,
} from "../shared/ImageUploaderBase";
import {
  FormPhoto,
  uploadImageToFormModule,
} from "../../services/forms/uploadImageToFormModule";

type ImageUploaderWithCameraProps = ImageUploaderBaseProps & {
  onCameraError?: (error: Error) => void;
};

export const ImageUploaderWithCamera: React.FC<ImageUploaderWithCameraProps> = (
  props
) => {
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const handleTakePhoto = async () => {
    try {
      if (!webcamRef.current) return;
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      setIsCapturing(true);
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Call the same upload function directly
      const photo = await uploadImageToFormModule({
        formId: props.formId,
        formModuleId: props.formModuleId,
        file,
        uploadedBy: props.uploadedBy,
        tag: props.tag,
        source: "web",
      });

      props.onUploadSuccess?.(photo);
    } catch (err) {
      console.error("Camera upload failed:", err);
      props.onUploadError?.(err as Error);
      props.onCameraError?.(err as Error);
    } finally {
      setIsCapturing(false);
      setShowCamera(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div>
      {showCamera ? (
        <div>
          <div style={{ position: "relative" }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode,
              }}
              style={{
                width: "100%",
                maxWidth: 400,
                borderRadius: 8,
                opacity: isCapturing ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            />
            {isCapturing && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "24px",
                  color: "white",
                  textShadow: "0 0 4px black",
                }}
              >
                Capturing...
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={handleTakePhoto} disabled={isCapturing}>
              {isCapturing ? "Capturing..." : "Take Photo"}
            </button>
            <button onClick={toggleCamera}>Switch Camera</button>
            <button onClick={() => setShowCamera(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <ImageUploaderBase {...props} />
          <button onClick={() => setShowCamera(true)}>Take Photo</button>
        </div>
      )}
    </div>
  );
};

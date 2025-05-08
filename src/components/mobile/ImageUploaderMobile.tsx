/**
 * ImageUploaderMobile Component
 *
 * Mobile-specific version of the image uploader that leverages native device capabilities.
 * Extends ImageUploaderBase with the following mobile-specific features:
 * - Uses native device camera interface
 * - Defaults to back camera (environment)
 * - Optimized for mobile touch interactions
 * - Confirmation before image removal
 * - Constrained thumbnail preview
 *
 * This component uses the HTML5 capture attribute to trigger
 * the native camera interface on mobile devices.
 */

import React from "react";
import {
  ImageUploaderBase,
  ImageUploaderBaseProps,
} from "../shared/ImageUploaderBase";

export const ImageUploaderMobile: React.FC<ImageUploaderBaseProps> = (
  props
) => {
  return (
    <ImageUploaderBase
      {...props}
      fileInputProps={{
        ...props.fileInputProps,
        accept: "image/*",
        capture: "environment", // Use back camera by default
      }}
    />
  );
};

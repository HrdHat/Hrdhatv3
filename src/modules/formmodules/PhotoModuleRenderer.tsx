import React from "react";
import FormAssetPhotosModule from "./FormAssetPhotosModule";
import { FormAssetPhoto } from "../../types/formTypes";

interface PhotoModuleRendererProps {
  value?: FormAssetPhoto[];
  onChange?: (photos: FormAssetPhoto[]) => void;
  formModuleId?: string;
  uploadedBy?: string;
  module?: any;
  [key: string]: any;
}

const PhotoModuleRenderer: React.FC<PhotoModuleRendererProps> = (props) => (
  <FormAssetPhotosModule
    {...props}
    value={props.value || []}
    onChange={props.onChange || (() => {})}
    formModuleId={props.formModuleId || ""}
    uploadedBy={props.uploadedBy || ""}
    module={props.module}
  />
);

export default PhotoModuleRenderer;

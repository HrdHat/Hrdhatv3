import React from "react";
import FormAssetPhotosModule from "./FormAssetPhotosModule";
import { FormAssetPhoto } from "../../types/formTypes";

interface PhotoModuleRendererProps {
  value?: FormAssetPhoto[];
  onChange?: (photos: FormAssetPhoto[]) => void;
  formId?: string;
  formModuleId?: string;
  uploadedBy?: string;
  [key: string]: any;
}

const PhotoModuleRenderer: React.FC<PhotoModuleRendererProps> = (props) => (
  <FormAssetPhotosModule
    {...props}
    value={props.value || []}
    onChange={props.onChange || (() => {})}
    formId={props.formId || ""}
    formModuleId={props.formModuleId || ""}
    uploadedBy={props.uploadedBy || ""}
  />
);

export default PhotoModuleRenderer;

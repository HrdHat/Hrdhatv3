import React from "react";
import FormAssetPhotosModule from "./FormAssetPhotosModule";
import { FormAssetPhoto } from "../../types/formTypes";

const PhotoModuleRenderer = (props: {
  value?: FormAssetPhoto[];
  [key: string]: any;
}) => <FormAssetPhotosModule {...props} value={props.value || []} />;

export default PhotoModuleRenderer;

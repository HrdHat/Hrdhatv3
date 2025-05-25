import React from "react";
import SignatureModule from "./SignatureModule";
import { SignatureMetadata } from "../../services/forms/uploadSignatureToSupabase";

interface SignatureModuleRendererProps {
  value?: SignatureMetadata[];
  onChange?: (signatures: SignatureMetadata[]) => void;
  formId?: string;
  formModuleId?: string;
  [key: string]: any;
}

const SignatureModuleRenderer: React.FC<SignatureModuleRendererProps> = (
  props
) => (
  <SignatureModule
    {...props}
    value={props.value || []}
    onChange={props.onChange || (() => {})}
    formId={props.formId || ""}
    formModuleId={props.formModuleId || ""}
  />
);

export default SignatureModuleRenderer;

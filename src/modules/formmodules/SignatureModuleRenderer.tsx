import React from "react";
import SignatureModule from "./SignatureModule";
import { SignatureMetadata } from "../../services/forms/uploadSignatureToSupabase";

const SignatureModuleRenderer = (props: {
  value?: SignatureMetadata[];
  [key: string]: any;
}) => <SignatureModule {...props} value={props.value || []} />;

export default SignatureModuleRenderer;

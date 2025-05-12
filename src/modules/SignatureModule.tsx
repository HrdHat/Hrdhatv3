import React, { useRef, useState, useCallback, useEffect } from "react";
import { ModuleWithRenderer } from "./rendererRegistry";
import {
  uploadSignatureToSupabase,
  SignatureMetadata,
} from "../services/forms/uploadSignatureToSupabase";

interface SignatureModuleProps {
  module: ModuleWithRenderer;
  className?: string;
  formId?: string;
  onSignatureSaved?: (data: SignatureMetadata) => void;
}

export const SignatureModule: React.FC<SignatureModuleProps> = ({
  module,
  className = "",
  formId,
  onSignatureSaved,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState<SignatureMetadata[]>([]);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Setup high DPI canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    // Set canvas quality settings
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
  }, []);

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      const point = getCanvasPoint(e.nativeEvent);
      if (!point) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setIsDrawing(true);
      setLastPoint(point);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [getCanvasPoint]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing) return;

      const point = getCanvasPoint(e.nativeEvent);
      if (!point || !lastPoint) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      setLastPoint(point);
    },
    [isDrawing, getCanvasPoint, lastPoint]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const saveSignature = useCallback(
    async (name: string, role: string) => {
      if (!formId || isSaving) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsSaving(true);

      try {
        // Get blob from canvas
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });

        const timestamp = Date.now();
        const metadata: Omit<SignatureMetadata, "hash"> = {
          id: `${name}-${timestamp}`,
          name,
          role,
          timestamp,
          formId,
          moduleId: module.id,
        };

        // Upload to Supabase
        const result = await uploadSignatureToSupabase({
          formId,
          metadata,
          blob,
        });

        setSignatures((prev) => [...prev, result]);
        onSignatureSaved?.(result);

        // Clear canvas after a short delay
        setTimeout(clearSignature, 500);
      } catch (error) {
        console.error("Failed to save signature:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [clearSignature, formId, isSaving, module.id, onSignatureSaved]
  );

  const deleteSignature = useCallback((id: string) => {
    setSignatures((prev) => prev.filter((sig) => sig.id !== id));
  }, []);

  const reSign = useCallback(
    (id: string) => {
      const signature = signatures.find((sig) => sig.id === id);
      if (!signature) return;

      setSignatures((prev) => prev.filter((sig) => sig.id !== id));
      clearSignature();
    },
    [signatures, clearSignature]
  );

  return (
    <div className={className}>
      <h3>{module.label}</h3>

      {/* Signature Canvas */}
      <div>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          style={{ border: "1px solid #ccc", backgroundColor: "#fff" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button onClick={clearSignature} disabled={isSaving}>
            Clear
          </button>
          <button
            onClick={() => saveSignature("worker", "Worker")}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Worker Signature"}
          </button>
          <button
            onClick={() => saveSignature("supervisor", "Supervisor")}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Supervisor Signature"}
          </button>
        </div>
      </div>

      {/* Signature Previews */}
      {signatures.length > 0 && (
        <div>
          <h4>Saved Signatures</h4>
          <div>
            {signatures.map((signature) => (
              <div key={signature.id}>
                <p>
                  {signature.role} Signature
                  <br />
                  <small>
                    {new Date(signature.timestamp).toLocaleString()}
                  </small>
                </p>
                <img
                  src={signature.metadata?.public_url}
                  alt={`${signature.role} signature`}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    onClick={() => reSign(signature.id)}
                    disabled={isSaving}
                  >
                    Sign Again
                  </button>
                  <button
                    onClick={() => deleteSignature(signature.id)}
                    disabled={isSaving}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureModule;

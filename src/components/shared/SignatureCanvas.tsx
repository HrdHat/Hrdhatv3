import React, { useRef, useState } from "react";

interface SignatureCanvasProps {
  formId: string;
  userId: string;
  userName?: string;
  onSigned: (data: { name: string; blob: Blob }) => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ formId, userId, userName = "", onSigned }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [name, setName] = useState(userName);
  const [signed, setSigned] = useState(false);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDraw = () => setDrawing(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ("clientX" in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleSign = () => {
    if (!canvasRef.current || !name.trim()) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        setSigned(true);
        onSigned({ name: name.trim(), blob });
      }
    }, "image/png");
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  if (signed) return null;

  return (
    <div>
      <label htmlFor="sig-name">Name:</label>
      <input
        id="sig-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!!userName}
        required
      />
      <div style={{ border: "1px solid #ccc", margin: "8px 0" }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          style={{ touchAction: "none", background: "#fff", width: "100%", maxWidth: 400, height: 120 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <button onClick={handleClear} type="button">
        Clear
      </button>
      <button onClick={handleSign} disabled={!name.trim() || drawing}>
        Sign
      </button>
    </div>
  );
};

export default SignatureCanvas; 
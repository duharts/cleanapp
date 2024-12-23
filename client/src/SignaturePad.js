import React, { useRef } from 'react';

const SignaturePad = () => {
  const canvasRef = useRef(null);

  const startDrawing = (event) => {
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    canvasRef.current.isDrawing = true;
  };

  const draw = (event) => {
    if (!canvasRef.current.isDrawing) return;
    const context = canvasRef.current.getContext('2d');
    context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    canvasRef.current.isDrawing = false;
    const context = canvasRef.current.getContext('2d');
    context.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: '1px solid #000', width: '100%', height: '100px' }}
      />
      <button onClick={clearSignature}>Clear Signature</button>
    </div>
  );
};

export default SignaturePad;

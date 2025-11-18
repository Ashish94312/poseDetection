import React, { useEffect, useRef } from 'react';
import './Graphs.css';

export function Graphs({ dataHistory }) {
  const positionCanvasRef = useRef(null);
  const velocityCanvasRef = useRef(null);
  const forceCanvasRef = useRef(null);

  useEffect(() => {
    if (!dataHistory || dataHistory.length === 0) return;

    const drawGraph = (canvas, data, key, color, yMin, yMax, label) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = 40;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = padding + (height - 2 * padding) * (i / 10);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Draw data
      if (data.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const range = yMax - yMin;
        const xStep = (width - 2 * padding) / (data.length - 1);

        data.forEach((point, index) => {
          const x = padding + index * xStep;
          const normalizedY = (point[key] - yMin) / range;
          const y = height - padding - normalizedY * (height - 2 * padding);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = color;
        data.slice(-20).forEach((point, index) => {
          const actualIndex = data.length - 20 + index;
          if (actualIndex >= 0) {
            const x = padding + actualIndex * xStep;
            const normalizedY = (point[key] - yMin) / range;
            const y = height - padding - normalizedY * (height - 2 * padding);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }

      // Draw labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, width / 2, height - 10);
      
      // Draw Y-axis labels
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = yMin + (yMax - yMin) * (i / 5);
        const y = height - padding - (height - 2 * padding) * (i / 5);
        ctx.fillText(value.toFixed(1), padding - 10, y + 4);
      }
    };

    // Extract data arrays
    const positions = dataHistory.map(d => d.position || 0);
    const velocities = dataHistory.map(d => d.velocity || 0);
    const forces = dataHistory.map(d => d.force || 0);

    // Calculate ranges
    const posMin = Math.min(...positions, 0.8);
    const posMax = Math.max(...positions, 1.2);
    const velMin = Math.min(...velocities, -2);
    const velMax = Math.max(...velocities, 2);
    const forceMin = Math.min(...forces, -100);
    const forceMax = Math.max(...forces, 100);

    // Draw graphs
    drawGraph(positionCanvasRef.current, dataHistory, 'position', '#3b82f6', posMin, posMax, 'Position (m)');
    drawGraph(velocityCanvasRef.current, dataHistory, 'velocity', '#10b981', velMin, velMax, 'Velocity (m/s)');
    drawGraph(forceCanvasRef.current, dataHistory, 'force', '#f59e0b', forceMin, forceMax, 'Force (N)');
  }, [dataHistory]);

  return (
    <div className="graphs-container">
      <h2>Real-time Graphs</h2>
      <div className="graphs-grid">
        <div className="graph-card">
          <h3>Vertical Position</h3>
          <canvas
            ref={positionCanvasRef}
            width={400}
            height={200}
            className="graph-canvas"
          />
        </div>
        <div className="graph-card">
          <h3>Vertical Velocity</h3>
          <canvas
            ref={velocityCanvasRef}
            width={400}
            height={200}
            className="graph-canvas"
          />
        </div>
        <div className="graph-card">
          <h3>Force</h3>
          <canvas
            ref={forceCanvasRef}
            width={400}
            height={200}
            className="graph-canvas"
          />
        </div>
      </div>
    </div>
  );
}


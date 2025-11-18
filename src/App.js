import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { usePoseDetection } from './hooks/usePoseDetection';
import { initializePoseStream, subscribeToPoseStream } from './modules/poseStream';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [fps, setFps] = useState(30);
  const [smoothingAlpha, setSmoothingAlpha] = useState(0.5);

  const {
    isInitialized,
    isRunning,
    poseData,
    error,
    initialize,
    start,
    stop,
    subscribe,
    setTargetFPS,
    setSmoothingAlpha: updateSmoothingAlpha,
  } = usePoseDetection({
    targetFPS: fps,
    smoothingAlpha: smoothingAlpha,
  });

  // Initialize pose detection service and connect to stream module
  useEffect(() => {
    const init = async () => {
      const success = await initialize();
      if (success) {
        // The stream module will be initialized when we have the service instance
        // This is handled through the subscribe method
      }
    };
    init();
  }, [initialize]);

  // Draw pose on canvas
  useEffect(() => {
    if (!poseData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!video || !ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw landmarks
    if (poseData.landmarks) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      poseData.landmarks.forEach((landmark) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [poseData]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start pose detection once video is playing
        if (isInitialized) {
          await start(videoRef.current);
          setCameraStarted(true);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Failed to access camera. Please ensure permissions are granted.');
    }
  };

  // Stop camera and pose detection
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    stop();
    setCameraStarted(false);
  };

  // Handle FPS change
  const handleFPSChange = (newFPS) => {
    setFps(newFPS);
    setTargetFPS(newFPS);
  };

  // Handle smoothing change
  const handleSmoothingChange = (newAlpha) => {
    setSmoothingAlpha(newAlpha);
    updateSmoothingAlpha(newAlpha);
  };

  // Example: Subscribe to pose stream from another module
  useEffect(() => {
    const unsubscribe = subscribeToPoseStream((poseData) => {
      // This is how other modules can subscribe to the pose stream
      // console.log('External module received pose data:', poseData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MediaPipe BlazePose GHUM Detection</h1>
        
        <div className="controls">
          <div className="control-group">
            <label>
              Target FPS: {fps}
              <input
                type="range"
                min="10"
                max="100"
                value={fps}
                onChange={(e) => handleFPSChange(Number(e.target.value))}
                disabled={!isInitialized}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Smoothing: {smoothingAlpha.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={smoothingAlpha}
                onChange={(e) => handleSmoothingChange(Number(e.target.value))}
                disabled={!isInitialized}
              />
            </label>
          </div>

          <div className="button-group">
            {!cameraStarted ? (
              <button
                onClick={startCamera}
                disabled={!isInitialized}
                className="btn btn-primary"
              >
                {isInitialized ? 'Start Camera' : 'Initializing...'}
              </button>
            ) : (
              <button onClick={stopCamera} className="btn btn-secondary">
                Stop Camera
              </button>
            )}
          </div>
        </div>

        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ display: 'none' }}
          />
          <canvas ref={canvasRef} className="pose-canvas" />
        </div>

        {error && (
          <div className="error">
            <p>Error: {error.message || String(error)}</p>
          </div>
        )}

        {poseData && (
          <div className="pose-info">
            <h3>Pose Data</h3>
            <div className="info-grid">
              <div>
                <h4>System 1: Joint Angles (Goniometric)</h4>
                <p className="system-description">0° to 180° - Clinical flexion/extension</p>
                <ul>
                  <li>Left Elbow: {poseData.angles?.jointAngles?.leftElbow?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Elbow: {poseData.angles?.jointAngles?.rightElbow?.toFixed(1) || 'N/A'}°</li>
                  <li>Left Knee: {poseData.angles?.jointAngles?.leftKnee?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Knee: {poseData.angles?.jointAngles?.rightKnee?.toFixed(1) || 'N/A'}°</li>
                  <li>Left Shoulder: {poseData.angles?.jointAngles?.leftShoulder?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Shoulder: {poseData.angles?.jointAngles?.rightShoulder?.toFixed(1) || 'N/A'}°</li>
                  <li>Left Hip: {poseData.angles?.jointAngles?.leftHip?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Hip: {poseData.angles?.jointAngles?.rightHip?.toFixed(1) || 'N/A'}°</li>
                </ul>
              </div>
              <div>
                <h4>System 2: Segment Orientations (Functional)</h4>
                <p className="system-description">+90° to -90° - Posture & biomechanics</p>
                <ul>
                  <li>Left Thigh: {poseData.angles?.segmentOrientations?.leftThigh?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Thigh: {poseData.angles?.segmentOrientations?.rightThigh?.toFixed(1) || 'N/A'}°</li>
                  <li>Left Shank: {poseData.angles?.segmentOrientations?.leftShank?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Shank: {poseData.angles?.segmentOrientations?.rightShank?.toFixed(1) || 'N/A'}°</li>
                  <li>Left Upper Arm: {poseData.angles?.segmentOrientations?.leftUpperArm?.toFixed(1) || 'N/A'}°</li>
                  <li>Right Upper Arm: {poseData.angles?.segmentOrientations?.rightUpperArm?.toFixed(1) || 'N/A'}°</li>
                  <li>Trunk: {poseData.angles?.segmentOrientations?.trunk?.toFixed(1) || 'N/A'}°</li>
                </ul>
              </div>
              <div>
                <h4>Status</h4>
                <ul>
                  <li>Initialized: {isInitialized ? 'Yes' : 'No'}</li>
                  <li>Running: {isRunning ? 'Yes' : 'No'}</li>
                  <li>Joints Detected: {poseData.joints ? Object.keys(poseData.joints).length : 0}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

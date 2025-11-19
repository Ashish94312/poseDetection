import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { extractAllJoints } from '../utils/jointMapping';
import { calculateAllAngles } from '../utils/angleComputation';
import { PoseSmoother, AngleSmoother } from '../utils/smoothingFilters';

/**
 * Pose Detection Service
 * Handles MediaPipe BlazePose GHUM model loading and inference
 */
export class PoseDetectionService {
  constructor(options = {}) {
    this.targetFPS = options.targetFPS || 30;
    this.smoothingAlpha = options.smoothingAlpha || 0.5;
    // this.modelPath = options.modelPath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm';
    this.modelPath = options.modelPath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
    this.modelAssetPath = options.modelAssetPath || 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task';
    
    this.poseLandmarker = null;
    this.isInitialized = false;
    this.isRunning = false;
    this.videoElement = null;
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Smoothing filters
    this.poseSmoother = new PoseSmoother(this.smoothingAlpha);
    this.angleSmoother = new AngleSmoother(this.smoothingAlpha);
    
    // Callbacks
    this.onPoseDetected = options.onPoseDetected || null;
    this.onError = options.onError || null;
    
    // Stream subscribers
    this.subscribers = new Set();
    
    // Current pose data
    this.currentPoseData = null;
  }

  /**
   * Initialize and load the pose model
   */
  async initialize() {
    try {
      console.log('Initializing MediaPipe Pose Landmarker...');
      
      const vision = await FilesetResolver.forVisionTasks(this.modelPath);
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.modelAssetPath,
          delegate: 'GPU', // Use WebGPU
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });

      this.isInitialized = true;
      console.log('Pose model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error initializing pose model:', error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  /**
   * Start pose detection on a video element
   */
  async start(videoElement) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize pose detection');
      }
    }

    if (this.isRunning) {
      this.stop();
    }

    this.videoElement = videoElement;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.processFrame();
  }

  /**
   * Stop pose detection
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Process a single frame at target FPS
   */
  processFrame = () => {
    if (!this.isRunning || !this.videoElement || !this.poseLandmarker) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastFrameTime;

    if (elapsed >= this.frameInterval) {
      try {
        const startTimeMs = performance.now();
        const results = this.poseLandmarker.detectForVideo(
          this.videoElement,
          startTimeMs
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Extract joints
          const joints = extractAllJoints(landmarks);
          
          // Smooth joints
          const smoothedJoints = this.poseSmoother.update(joints);
          
          // Calculate angles
          const angles = calculateAllAngles(smoothedJoints);
          
          // Smooth angles
          const smoothedAngles = this.angleSmoother.update(angles);
          
          // Create pose data object
          const poseData = {
            landmarks,
            joints: smoothedJoints,
            angles: smoothedAngles,
            timestamp: currentTime,
            confidence: results.segmentationMasks ? results.segmentationMasks[0] : null,
          };

          // Store current pose data
          this.currentPoseData = poseData;

          // Notify subscribers
          this.notifySubscribers(poseData);

          // Call callback if provided
          if (this.onPoseDetected) {
            this.onPoseDetected(poseData);
          }
        }
      } catch (error) {
        console.error('Error processing frame:', error);
        if (this.onError) {
          this.onError(error);
        }
      }

      this.lastFrameTime = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  /**
   * Subscribe to pose detection stream
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(poseData) {
    this.subscribers.forEach((callback) => {
      try {
        callback(poseData);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Update target FPS
   */
  setTargetFPS(fps) {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }

  /**
   * Update smoothing alpha
   */
  setSmoothingAlpha(alpha) {
    this.smoothingAlpha = alpha;
    this.poseSmoother = new PoseSmoother(alpha);
    this.angleSmoother = new AngleSmoother(alpha);
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    this.poseSmoother.reset();
    this.angleSmoother.reset();
    this.subscribers.clear();
    this.poseLandmarker = null;
    this.isInitialized = false;
  }
}


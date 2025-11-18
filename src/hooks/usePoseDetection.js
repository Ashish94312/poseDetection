import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseDetectionService } from '../services/poseDetectionService';
import { initializePoseStream } from '../modules/poseStream';

/**
 * React hook for pose detection
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.targetFPS - Target frames per second (default: 30)
 * @param {number} options.smoothingAlpha - Smoothing factor 0-1 (default: 0.5)
 * @param {string} options.modelPath - Path to MediaPipe WASM files
 * @param {string} options.modelAssetPath - Path to pose model file
 * @returns {Object} Pose detection hook interface
 */
export const usePoseDetection = (options = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [poseData, setPoseData] = useState(null);
  const [error, setError] = useState(null);
  
  const serviceRef = useRef(null);
  const videoRef = useRef(null);

  // Initialize service
  useEffect(() => {
    const service = new PoseDetectionService({
      ...options,
      onPoseDetected: (data) => {
        setPoseData(data);
      },
      onError: (err) => {
        setError(err);
        console.error('Pose detection error:', err);
      },
    });

    serviceRef.current = service;
    
    // Initialize pose stream module with service instance
    initializePoseStream(service);

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
      initializePoseStream(null);
    };
  }, []);

  // Initialize model
  const initialize = useCallback(async () => {
    if (!serviceRef.current) return false;
    
    try {
      const success = await serviceRef.current.initialize();
      setIsInitialized(success);
      return success;
    } catch (err) {
      setError(err);
      setIsInitialized(false);
      return false;
    }
  }, []);

  // Start detection
  const start = useCallback(async (videoElement) => {
    if (!serviceRef.current) {
      throw new Error('Pose detection service not initialized');
    }

    if (!videoElement) {
      throw new Error('Video element is required');
    }

    try {
      videoRef.current = videoElement;
      await serviceRef.current.start(videoElement);
      setIsRunning(true);
      setError(null);
    } catch (err) {
      setError(err);
      setIsRunning(false);
      throw err;
    }
  }, []);

  // Stop detection
  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      setIsRunning(false);
    }
  }, []);

  // Subscribe to pose stream
  const subscribe = useCallback((callback) => {
    if (!serviceRef.current) {
      return () => {};
    }
    return serviceRef.current.subscribe(callback);
  }, []);

  // Update target FPS
  const setTargetFPS = useCallback((fps) => {
    if (serviceRef.current) {
      serviceRef.current.setTargetFPS(fps);
    }
  }, []);

  // Update smoothing alpha
  const setSmoothingAlpha = useCallback((alpha) => {
    if (serviceRef.current) {
      serviceRef.current.setSmoothingAlpha(alpha);
    }
  }, []);

  // Get service instance
  const getService = useCallback(() => {
    return serviceRef.current;
  }, []);

  return {
    isInitialized,
    isRunning,
    poseData,
    error,
    initialize,
    start,
    stop,
    subscribe,
    setTargetFPS,
    setSmoothingAlpha,
    getService,
    videoRef,
  };
};


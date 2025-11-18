/**
 * Pose Stream Module
 * Exposes pose detection stream to other modules
 */

let poseDetectionService = null;
let subscribers = new Set();

/**
 * Initialize the pose stream with a service instance
 */
export const initializePoseStream = (service) => {
  poseDetectionService = service;
  
  // Forward all pose detections to subscribers
  if (service) {
    service.subscribe((poseData) => {
      subscribers.forEach((callback) => {
        try {
          callback(poseData);
        } catch (error) {
          console.error('Error in pose stream subscriber:', error);
        }
      });
    });
  }
};

/**
 * Subscribe to pose detection stream
 * @param {Function} callback - Callback function that receives pose data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPoseStream = (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  subscribers.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Get current pose data (if available)
 */
export const getCurrentPoseData = () => {
  return poseDetectionService?.currentPoseData || null;
};

/**
 * Check if pose stream is active
 */
export const isPoseStreamActive = () => {
  return poseDetectionService?.isRunning || false;
};

/**
 * Get pose detection service instance
 */
export const getPoseDetectionService = () => {
  return poseDetectionService;
};

/**
 * Clear all subscribers
 */
export const clearSubscribers = () => {
  subscribers.clear();
};

/**
 * Example usage in another module:
 * 
 * import { subscribeToPoseStream, isPoseStreamActive } from './modules/poseStream';
 * 
 * // Subscribe to pose updates
 * const unsubscribe = subscribeToPoseStream((poseData) => {
 *   console.log('Pose detected:', poseData);
 *   console.log('Joints:', poseData.joints);
 *   console.log('Angles:', poseData.angles);
 * });
 * 
 * // Later, unsubscribe
 * unsubscribe();
 */


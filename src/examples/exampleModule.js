/**
 * Example Module - Demonstrates how to use the pose stream
 * 
 * This file shows how other modules can subscribe to the pose detection stream
 */

import { subscribeToPoseStream, getCurrentPoseData, isPoseStreamActive } from '../modules/poseStream';

/**
 * Example: Subscribe to pose stream and process data
 */
export class ExamplePoseProcessor {
  constructor() {
    this.unsubscribe = null;
    this.poseCount = 0;
  }

  start() {
    // Subscribe to pose stream
    this.unsubscribe = subscribeToPoseStream((poseData) => {
      this.poseCount++;
      this.processPose(poseData);
    });

    console.log('Example module subscribed to pose stream');
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('Example module unsubscribed from pose stream');
    }
  }

  processPose(poseData) {
    const { jointAngles, segmentOrientations } = poseData.angles || {};

    // SYSTEM 1: Using Joint Angles (Goniometric) - 0° to 180°
    // Example: Check if person is standing or squatting
    const leftKneeAngle = jointAngles?.leftKnee;
    const rightKneeAngle = jointAngles?.rightKnee;

    if (leftKneeAngle && rightKneeAngle) {
      const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
      // Joint angles: 180° = fully extended, 0° = fully flexed
      if (avgKneeAngle > 160) {
        console.log('Person appears to be standing (knees extended)');
      } else if (avgKneeAngle < 90) {
        console.log('Person appears to be in deep squat (knees flexed)');
      }
    }

    // Example: Check elbow flexion
    const leftElbowAngle = jointAngles?.leftElbow;
    if (leftElbowAngle && leftElbowAngle < 45) {
      console.log('Left arm is flexed (elbow angle < 45°)');
    }

    // SYSTEM 2: Using Segment Orientations - +90° to -90°
    // Example: Check squat depth using thigh orientation
    const leftThighOrientation = segmentOrientations?.leftThigh;
    const rightThighOrientation = segmentOrientations?.rightThigh;
    
    if (leftThighOrientation && rightThighOrientation) {
      const avgThighOrientation = (leftThighOrientation + rightThighOrientation) / 2;
      
      // Segment orientations: +90° = up, 0° = horizontal, -90° = down
      if (avgThighOrientation < -30) {
        console.log('Deep squat detected (thighs pointing down)');
      } else if (avgThighOrientation > 0) {
        console.log('Upright posture (thighs pointing up/forward)');
      }
    }

    // Example: Check trunk lean
    const trunkOrientation = segmentOrientations?.trunk;
    if (trunkOrientation !== null && trunkOrientation !== undefined) {
      if (trunkOrientation > 15) {
        console.log('Forward trunk lean detected');
      } else if (trunkOrientation < -15) {
        console.log('Backward trunk lean detected');
      }
    }

    // Example: Access joint positions
    const leftShoulder = poseData.joints?.LEFT_SHOULDER;
    const rightShoulder = poseData.joints?.RIGHT_SHOULDER;
    
    if (leftShoulder && rightShoulder) {
      const shoulderDistance = Math.sqrt(
        Math.pow(leftShoulder.x - rightShoulder.x, 2) +
        Math.pow(leftShoulder.y - rightShoulder.y, 2)
      );
      console.log(`Shoulder width: ${shoulderDistance.toFixed(3)}`);
    }

    // Combined analysis: Using both systems together
    // Example: Analyze squat biomechanics
    if (leftKneeAngle && leftThighOrientation) {
      console.log(`Squat analysis - Knee flexion: ${leftKneeAngle.toFixed(1)}°, Thigh orientation: ${leftThighOrientation.toFixed(1)}°`);
    }
  }

  getStats() {
    return {
      poseCount: this.poseCount,
      isActive: isPoseStreamActive(),
      currentPose: getCurrentPoseData(),
    };
  }
}

/**
 * Example: Simple function-based subscriber
 */
export function simplePoseSubscriber() {
  const unsubscribe = subscribeToPoseStream((poseData) => {
    const { jointAngles, segmentOrientations } = poseData.angles || {};
    
    console.log('Received pose data:', {
      timestamp: poseData.timestamp,
      jointAngles: jointAngles, // System 1: Goniometric (0-180°)
      segmentOrientations: segmentOrientations, // System 2: Functional (+90° to -90°)
      jointCount: Object.keys(poseData.joints || {}).length,
    });
  });

  // Return cleanup function
  return unsubscribe;
}

/**
 * Example: React hook for using pose stream in components
 */
export function usePoseStream(callback) {
  const { useEffect } = require('react');
  const { subscribeToPoseStream } = require('../modules/poseStream');

  useEffect(() => {
    if (typeof callback !== 'function') return;

    const unsubscribe = subscribeToPoseStream(callback);
    return () => {
      unsubscribe();
    };
  }, [callback]);
}


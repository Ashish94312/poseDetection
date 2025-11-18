/**
 * TypeScript type definitions for Pose Detection Data
 * Generated from MediaPipe BlazePose GHUM implementation
 */

/**
 * Landmark point from MediaPipe
 */
export interface Landmark {
  x: number;          // Normalized x coordinate (0-1)
  y: number;          // Normalized y coordinate (0-1)
  z: number;          // Normalized z coordinate (depth)
  visibility: number;  // Visibility score (0-1)
}

/**
 * Joint position with coordinates
 */
export interface Joint {
  x: number;          // Normalized x coordinate (0-1)
  y: number;          // Normalized y coordinate (0-1)
  z: number;          // Normalized z coordinate (depth)
  visibility: number; // Visibility score (0-1)
}

/**
 * System 1: Joint Angles (Goniometric)
 * Range: 0° to 180°
 * Clinical goniometer reading for flexion/extension
 */
export interface JointAngles {
  leftElbow?: number | null;      // 0-180°
  rightElbow?: number | null;     // 0-180°
  leftKnee?: number | null;       // 0-180°
  rightKnee?: number | null;      // 0-180°
  leftShoulder?: number | null;   // 0-180°
  rightShoulder?: number | null;  // 0-180°
  leftHip?: number | null;        // 0-180°
  rightHip?: number | null;       // 0-180°
}

/**
 * System 2: Segment Orientations (Functional)
 * Range: +90° to -90°
 * Functional orientation relative to vertical
 * +90° = pointing up, 0° = horizontal, -90° = pointing down
 */
export interface SegmentOrientations {
  leftUpperArm?: number | null;   // +90° to -90°
  rightUpperArm?: number | null;  // +90° to -90°
  leftForearm?: number | null;    // +90° to -90°
  rightForearm?: number | null;   // +90° to -90°
  leftThigh?: number | null;      // +90° to -90°
  rightThigh?: number | null;     // +90° to -90°
  leftShank?: number | null;      // +90° to -90°
  rightShank?: number | null;     // +90° to -90°
  trunk?: number | null;           // +90° to -90°
}

/**
 * All computed angles (both systems)
 */
export interface Angles {
  jointAngles: JointAngles;
  segmentOrientations: SegmentOrientations;
}

/**
 * Named joints map
 */
export interface Joints {
  NOSE?: Joint | null;
  LEFT_EYE_INNER?: Joint | null;
  LEFT_EYE?: Joint | null;
  LEFT_EYE_OUTER?: Joint | null;
  RIGHT_EYE_INNER?: Joint | null;
  RIGHT_EYE?: Joint | null;
  RIGHT_EYE_OUTER?: Joint | null;
  LEFT_EAR?: Joint | null;
  RIGHT_EAR?: Joint | null;
  MOUTH_LEFT?: Joint | null;
  MOUTH_RIGHT?: Joint | null;
  LEFT_SHOULDER?: Joint | null;
  RIGHT_SHOULDER?: Joint | null;
  LEFT_ELBOW?: Joint | null;
  RIGHT_ELBOW?: Joint | null;
  LEFT_WRIST?: Joint | null;
  RIGHT_WRIST?: Joint | null;
  LEFT_PINKY?: Joint | null;
  RIGHT_PINKY?: Joint | null;
  LEFT_INDEX?: Joint | null;
  RIGHT_INDEX?: Joint | null;
  LEFT_THUMB?: Joint | null;
  RIGHT_THUMB?: Joint | null;
  LEFT_HIP?: Joint | null;
  RIGHT_HIP?: Joint | null;
  LEFT_KNEE?: Joint | null;
  RIGHT_KNEE?: Joint | null;
  LEFT_ANKLE?: Joint | null;
  RIGHT_ANKLE?: Joint | null;
  LEFT_HEEL?: Joint | null;
  RIGHT_HEEL?: Joint | null;
  LEFT_FOOT_INDEX?: Joint | null;
  RIGHT_FOOT_INDEX?: Joint | null;
}

/**
 * Complete pose detection data structure
 */
export interface PoseData {
  landmarks: Landmark[];           // Raw MediaPipe landmarks (33 items)
  joints: Joints;                   // Named joint positions
  angles: Angles;                   // Computed angles (both systems)
  timestamp: number;                // Timestamp in milliseconds
  confidence?: number | null;       // Overall detection confidence (0-1)
}


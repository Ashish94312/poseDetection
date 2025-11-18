/**
 * Angle computation utilities for pose analysis
 * Implements two angle systems used by physiotherapists:
 * 1. True Joint Angle (Goniometric) - 0° to 180°
 * 2. Segment Orientation - +90° to -90°
 */

/**
 * SYSTEM 1: TRUE JOINT ANGLE (GONIOMETRIC)
 * Range: 0° to 180°
 * Clinical goniometer reading for flexion/extension
 * 
 * Formula: joint_angle = 180 - arccos(dot(v1, v2) / |v1||v2|)
 * Where:
 *   v1 = A - B (proximal to joint center)
 *   v2 = C - B (distal to joint center)
 *   A = proximal landmark
 *   B = joint center landmark
 *   C = distal landmark
 * 
 * @param {Object} proximal - {x, y} Proximal landmark
 * @param {Object} jointCenter - {x, y} Joint center landmark
 * @param {Object} distal - {x, y} Distal landmark
 * @returns {number} Joint angle in degrees (0-180°)
 */
export const calculateJointAngle = (proximal, jointCenter, distal) => {
  if (!proximal || !jointCenter || !distal) return null;

  // Vectors from joint center
  const v1 = {
    x: proximal.x - jointCenter.x,
    y: proximal.y - jointCenter.y,
  };

  const v2 = {
    x: distal.x - jointCenter.x,
    y: distal.y - jointCenter.y,
  };

  // Calculate dot product and magnitudes
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

  if (magnitude1 === 0 || magnitude2 === 0) return null;

  // Calculate raw angle
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const rawAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const rawAngleDegrees = (rawAngle * 180) / Math.PI;

  // Physio flexion/extension convention: 180 - raw_angle
  const jointAngle = 180 - rawAngleDegrees;

  return jointAngle;
};

/**
 * SYSTEM 2: SEGMENT ORIENTATION
 * Range: +90° to -90°
 * Functional orientation relative to vertical
 * 
 * Formula: orientation = atan2(segment.x, -segment.y) * (180 / PI)
 * Where:
 *   segment = distal_landmark - proximal_landmark
 *   vertical reference = (0, -1) because y increases downward in images
 * 
 * Output:
 *   +90° = segment pointing straight up
 *   0° = segment horizontal
 *   -90° = segment pointing straight down
 * 
 * @param {Object} proximal - {x, y} Proximal landmark
 * @param {Object} distal - {x, y} Distal landmark
 * @returns {number} Segment orientation in degrees (+90° to -90°)
 */
export const calculateSegmentOrientation = (proximal, distal) => {
  if (!proximal || !distal) return null;

  // Segment vector (distal - proximal)
  const segment = {
    x: distal.x - proximal.x,
    y: distal.y - proximal.y,
  };

  // Calculate orientation using atan2(x, -y)
  // -y because y increases downward in images
  const orientationRadians = Math.atan2(segment.x, -segment.y);
  const orientationDegrees = (orientationRadians * 180) / Math.PI;

  return orientationDegrees;
};

/**
 * Calculate both joint angle and segment orientation for a joint
 * @param {Object} proximal - {x, y} Proximal landmark
 * @param {Object} jointCenter - {x, y} Joint center landmark
 * @param {Object} distal - {x, y} Distal landmark
 * @returns {Object} {jointAngle, segmentOrientation}
 */
export const calculateJointMetrics = (proximal, jointCenter, distal) => {
  return {
    jointAngle: calculateJointAngle(proximal, jointCenter, distal),
    segmentOrientation: calculateSegmentOrientation(proximal, distal),
  };
};

/**
 * Calculate elbow joint angle (goniometric)
 */
export const calculateElbowJointAngle = (shoulder, elbow, wrist, side = 'left') => {
  return calculateJointAngle(shoulder, elbow, wrist);
};

/**
 * Calculate upper arm segment orientation
 */
export const calculateUpperArmOrientation = (shoulder, elbow, side = 'left') => {
  return calculateSegmentOrientation(shoulder, elbow);
};

/**
 * Calculate forearm segment orientation
 */
export const calculateForearmOrientation = (elbow, wrist, side = 'left') => {
  return calculateSegmentOrientation(elbow, wrist);
};

/**
 * Calculate knee joint angle (goniometric)
 */
export const calculateKneeJointAngle = (hip, knee, ankle, side = 'left') => {
  return calculateJointAngle(hip, knee, ankle);
};

/**
 * Calculate thigh segment orientation
 */
export const calculateThighOrientation = (hip, knee, side = 'left') => {
  return calculateSegmentOrientation(hip, knee);
};

/**
 * Calculate shank segment orientation
 */
export const calculateShankOrientation = (knee, ankle, side = 'left') => {
  return calculateSegmentOrientation(knee, ankle);
};

/**
 * Calculate shoulder joint angle (goniometric)
 */
export const calculateShoulderJointAngle = (elbow, shoulder, hip, side = 'left') => {
  return calculateJointAngle(elbow, shoulder, hip);
};

/**
 * Calculate hip joint angle (goniometric)
 */
export const calculateHipJointAngle = (shoulder, hip, knee, side = 'left') => {
  return calculateJointAngle(shoulder, hip, knee);
};

/**
 * Calculate trunk segment orientation
 */
export const calculateTrunkOrientation = (shoulder, hip) => {
  // Average of left and right shoulders for trunk
  if (shoulder && hip) {
    return calculateSegmentOrientation(hip, shoulder);
  }
  return null;
};

/**
 * Calculate all major joint angles (SYSTEM 1: Goniometric) from pose landmarks
 * Returns joint angles in range 0-180°
 */
export const calculateAllJointAngles = (joints) => {
  if (!joints) return null;

  return {
    leftElbow: calculateElbowJointAngle(
      joints.LEFT_SHOULDER,
      joints.LEFT_ELBOW,
      joints.LEFT_WRIST,
      'left'
    ),
    rightElbow: calculateElbowJointAngle(
      joints.RIGHT_SHOULDER,
      joints.RIGHT_ELBOW,
      joints.RIGHT_WRIST,
      'right'
    ),
    leftKnee: calculateKneeJointAngle(
      joints.LEFT_HIP,
      joints.LEFT_KNEE,
      joints.LEFT_ANKLE,
      'left'
    ),
    rightKnee: calculateKneeJointAngle(
      joints.RIGHT_HIP,
      joints.RIGHT_KNEE,
      joints.RIGHT_ANKLE,
      'right'
    ),
    leftShoulder: calculateShoulderJointAngle(
      joints.LEFT_ELBOW,
      joints.LEFT_SHOULDER,
      joints.LEFT_HIP,
      'left'
    ),
    rightShoulder: calculateShoulderJointAngle(
      joints.RIGHT_ELBOW,
      joints.RIGHT_SHOULDER,
      joints.RIGHT_HIP,
      'right'
    ),
    leftHip: calculateHipJointAngle(
      joints.LEFT_SHOULDER,
      joints.LEFT_HIP,
      joints.LEFT_KNEE,
      'left'
    ),
    rightHip: calculateHipJointAngle(
      joints.RIGHT_SHOULDER,
      joints.RIGHT_HIP,
      joints.RIGHT_KNEE,
      'right'
    ),
  };
};

/**
 * Calculate all segment orientations (SYSTEM 2: Functional) from pose landmarks
 * Returns segment orientations in range +90° to -90°
 */
export const calculateAllSegmentOrientations = (joints) => {
  if (!joints) return null;

  // Calculate average shoulder position for trunk
  const avgShoulder = joints.LEFT_SHOULDER && joints.RIGHT_SHOULDER
    ? {
        x: (joints.LEFT_SHOULDER.x + joints.RIGHT_SHOULDER.x) / 2,
        y: (joints.LEFT_SHOULDER.y + joints.RIGHT_SHOULDER.y) / 2,
      }
    : null;

  const avgHip = joints.LEFT_HIP && joints.RIGHT_HIP
    ? {
        x: (joints.LEFT_HIP.x + joints.RIGHT_HIP.x) / 2,
        y: (joints.LEFT_HIP.y + joints.RIGHT_HIP.y) / 2,
      }
    : null;

  return {
    // Upper body segments
    leftUpperArm: calculateUpperArmOrientation(
      joints.LEFT_SHOULDER,
      joints.LEFT_ELBOW,
      'left'
    ),
    rightUpperArm: calculateUpperArmOrientation(
      joints.RIGHT_SHOULDER,
      joints.RIGHT_ELBOW,
      'right'
    ),
    leftForearm: calculateForearmOrientation(
      joints.LEFT_ELBOW,
      joints.LEFT_WRIST,
      'left'
    ),
    rightForearm: calculateForearmOrientation(
      joints.RIGHT_ELBOW,
      joints.RIGHT_WRIST,
      'right'
    ),
    // Lower body segments
    leftThigh: calculateThighOrientation(
      joints.LEFT_HIP,
      joints.LEFT_KNEE,
      'left'
    ),
    rightThigh: calculateThighOrientation(
      joints.RIGHT_HIP,
      joints.RIGHT_KNEE,
      'right'
    ),
    leftShank: calculateShankOrientation(
      joints.LEFT_KNEE,
      joints.LEFT_ANKLE,
      'left'
    ),
    rightShank: calculateShankOrientation(
      joints.RIGHT_KNEE,
      joints.RIGHT_ANKLE,
      'right'
    ),
    // Trunk orientation
    trunk: avgShoulder && avgHip
      ? calculateTrunkOrientation(avgShoulder, avgHip)
      : null,
  };
};

/**
 * Calculate all angles (both systems) from pose landmarks
 * Returns both joint angles (goniometric) and segment orientations (functional)
 */
export const calculateAllAngles = (joints) => {
  if (!joints) return null;

  return {
    // SYSTEM 1: Joint Angles (Goniometric) - 0° to 180°
    jointAngles: calculateAllJointAngles(joints),
    // SYSTEM 2: Segment Orientations (Functional) - +90° to -90°
    segmentOrientations: calculateAllSegmentOrientations(joints),
  };
};

// Legacy function names for backward compatibility
export const calculateAngle2D = (point1, point2, point3) => {
  return calculateJointAngle(point1, point2, point3);
};

export const calculateElbowAngle = (shoulder, elbow, wrist, side = 'left') => {
  return calculateElbowJointAngle(shoulder, elbow, wrist, side);
};

export const calculateKneeAngle = (hip, knee, ankle, side = 'left') => {
  return calculateKneeJointAngle(hip, knee, ankle, side);
};

export const calculateShoulderAngle = (elbow, shoulder, hip, side = 'left') => {
  return calculateShoulderJointAngle(elbow, shoulder, hip, side);
};

export const calculateHipAngle = (shoulder, hip, knee, side = 'left') => {
  return calculateHipJointAngle(shoulder, hip, knee, side);
};

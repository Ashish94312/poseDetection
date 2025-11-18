/**
 * Joint mapping for MediaPipe BlazePose GHUM
 * Maps MediaPipe landmark indices to joint names
 */
export const JOINT_INDICES = {
  // Face
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Get joint name from index
 */
export const getJointName = (index) => {
  return Object.keys(JOINT_INDICES).find(
    (key) => JOINT_INDICES[key] === index
  ) || `UNKNOWN_${index}`;
};

/**
 * Get joint index from name
 */
export const getJointIndex = (name) => {
  return JOINT_INDICES[name] ?? -1;
};

/**
 * Extract joint coordinates from landmarks
 */
export const extractJoint = (landmarks, jointName) => {
  const index = getJointIndex(jointName);
  if (index === -1 || !landmarks || !landmarks[index]) {
    return null;
  }
  return {
    x: landmarks[index].x,
    y: landmarks[index].y,
    z: landmarks[index].z,
    visibility: landmarks[index].visibility || 1.0,
  };
};

/**
 * Extract all joints as a map
 */
export const extractAllJoints = (landmarks) => {
  const joints = {};
  Object.keys(JOINT_INDICES).forEach((jointName) => {
    joints[jointName] = extractJoint(landmarks, jointName);
  });
  return joints;
};


# Pose Detection API Documentation

## Data Structure

The pose detection system outputs data in the following JSON structure:

### Root Object: `PoseData`

```json
{
  "landmarks": [...],
  "joints": {...},
  "angles": {...},
  "timestamp": 1234567890.123,
  "confidence": 0.94
}
```

## Field Descriptions

### `landmarks` (Array, Required)
Raw MediaPipe landmarks array containing 33 landmark points.

**Structure:**
```json
[
  {
    "x": 0.512,        // Normalized x coordinate (0-1)
    "y": 0.234,        // Normalized y coordinate (0-1)
    "z": -0.123,       // Normalized z coordinate (depth)
    "visibility": 0.98 // Visibility score (0-1)
  },
  ...
]
```

### `joints` (Object, Required)
Named joint positions extracted from landmarks. Contains 33 joints.

**Available Joints:**
- Face: `NOSE`, `LEFT_EYE`, `RIGHT_EYE`, `LEFT_EAR`, `RIGHT_EAR`, `MOUTH_LEFT`, `MOUTH_RIGHT`
- Upper Body: `LEFT_SHOULDER`, `RIGHT_SHOULDER`, `LEFT_ELBOW`, `RIGHT_ELBOW`, `LEFT_WRIST`, `RIGHT_WRIST`, `LEFT_PINKY`, `RIGHT_PINKY`, `LEFT_INDEX`, `RIGHT_INDEX`, `LEFT_THUMB`, `RIGHT_THUMB`
- Lower Body: `LEFT_HIP`, `RIGHT_HIP`, `LEFT_KNEE`, `RIGHT_KNEE`, `LEFT_ANKLE`, `RIGHT_ANKLE`, `LEFT_HEEL`, `RIGHT_HEEL`, `LEFT_FOOT_INDEX`, `RIGHT_FOOT_INDEX`

**Structure:**
```json
{
  "LEFT_SHOULDER": {
    "x": 0.456,
    "y": 0.345,
    "z": -0.089,
    "visibility": 0.95
  },
  ...
}
```

### `angles` (Object, Required)
Computed angles using two systems: goniometric and functional.

#### `angles.jointAngles` (System 1: Goniometric)
**Range:** 0° to 180°  
**Description:** Clinical goniometer reading for flexion/extension

**Properties:**
- `leftElbow` (number | null): Left elbow joint angle
- `rightElbow` (number | null): Right elbow joint angle
- `leftKnee` (number | null): Left knee joint angle
- `rightKnee` (number | null): Right knee joint angle
- `leftShoulder` (number | null): Left shoulder joint angle
- `rightShoulder` (number | null): Right shoulder joint angle
- `leftHip` (number | null): Left hip joint angle
- `rightHip` (number | null): Right hip joint angle

**Example:**
```json
{
  "jointAngles": {
    "leftElbow": 145.3,
    "rightElbow": 142.7,
    "leftKnee": 168.2,
    "rightKnee": 169.1,
    "leftShoulder": 175.4,
    "rightShoulder": 176.8,
    "leftHip": 172.3,
    "rightHip": 173.5
  }
}
```

#### `angles.segmentOrientations` (System 2: Functional)
**Range:** +90° to -90°  
**Description:** Functional orientation relative to vertical
- +90° = segment pointing straight up
- 0° = segment horizontal
- -90° = segment pointing straight down

**Properties:**
- `leftUpperArm` (number | null): Left upper arm orientation
- `rightUpperArm` (number | null): Right upper arm orientation
- `leftForearm` (number | null): Left forearm orientation
- `rightForearm` (number | null): Right forearm orientation
- `leftThigh` (number | null): Left thigh orientation
- `rightThigh` (number | null): Right thigh orientation
- `leftShank` (number | null): Left shank (lower leg) orientation
- `rightShank` (number | null): Right shank (lower leg) orientation
- `trunk` (number | null): Trunk orientation

**Example:**
```json
{
  "segmentOrientations": {
    "leftUpperArm": 25.3,
    "rightUpperArm": -22.1,
    "leftForearm": 15.7,
    "rightForearm": -18.9,
    "leftThigh": 5.2,
    "rightThigh": 3.8,
    "leftShank": -2.1,
    "rightShank": -1.5,
    "trunk": 8.4
  }
}
```

### `timestamp` (Number, Required)
Timestamp in milliseconds (from `performance.now()`)

### `confidence` (Number | Null, Optional)
Overall pose detection confidence score (0-1). May be `null` if not available.

## Complete Example

```json
{
  "landmarks": [
    {
      "x": 0.512,
      "y": 0.234,
      "z": -0.123,
      "visibility": 0.98
    }
  ],
  "joints": {
    "LEFT_SHOULDER": {
      "x": 0.456,
      "y": 0.345,
      "z": -0.089,
      "visibility": 0.95
    },
    "LEFT_ELBOW": {
      "x": 0.412,
      "y": 0.456,
      "z": -0.067,
      "visibility": 0.92
    }
  },
  "angles": {
    "jointAngles": {
      "leftElbow": 145.3,
      "leftKnee": 168.2
    },
    "segmentOrientations": {
      "leftThigh": 5.2,
      "trunk": 8.4
    }
  },
  "timestamp": 1234567890.123,
  "confidence": 0.94
}
```

## Usage in Code

### JavaScript/TypeScript

```typescript
import { subscribeToPoseStream } from './modules/poseStream';

subscribeToPoseStream((poseData: PoseData) => {
  // Access joint angles (System 1)
  const leftKneeAngle = poseData.angles.jointAngles.leftKnee;
  
  // Access segment orientations (System 2)
  const trunkOrientation = poseData.angles.segmentOrientations.trunk;
  
  // Access joint positions
  const leftShoulder = poseData.joints.LEFT_SHOULDER;
});
```

### React Hook

```jsx
import { usePoseDetection } from './hooks/usePoseDetection';

function MyComponent() {
  const { poseData } = usePoseDetection();
  
  if (poseData) {
    const kneeAngle = poseData.angles.jointAngles.leftKnee;
    const thighOrientation = poseData.angles.segmentOrientations.leftThigh;
  }
}
```

## Validation

Use the provided JSON schema (`pose-data-schema.json`) to validate pose data:

```javascript
import Ajv from 'ajv';
import schema from './pose-data-schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const isValid = validate(poseData);
if (!isValid) {
  console.error(validate.errors);
}
```


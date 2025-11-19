# MediaPipe BlazePose GHUM Detection with React

This project implements real-time pose detection using MediaPipe BlazePose GHUM (WebGPU) in a React application. It includes model loading, inference at target FPS, joint mapping, angle computation, smoothing filters, and a stream API for other modules.

## Features

- ✅ **Model Loading**: Automatic initialization of MediaPipe BlazePose GHUM model with WebGPU support
- ✅ **Target FPS Control**: Configurable frame rate for inference (default: 60 FPS)
- ✅ **Joint Mapping**: Complete mapping of 33 body landmarks to named joints
- ✅ **Angle Computation**: Real-time calculation of joint angles (elbows, knees, shoulders, hips)
- ✅ **Smoothing Filters**: Multiple smoothing algorithms (EMA, One Euro Filter, Kalman Filter)
- ✅ **Stream API**: Subscribe to pose detection stream from any module

## Installation

```bash
npm install
```

## Usage

### Basic Usage in React Component

```jsx
import { usePoseDetection } from './hooks/usePoseDetection';

function MyComponent() {
  const {
    isInitialized,
    isRunning,
    poseData,
    initialize,
    start,
    stop,
  } = usePoseDetection({
    targetFPS: 60,
    smoothingAlpha: 0.5,
  });

  const handleStart = async () => {
    await initialize();
    const video = document.getElementById('video');
    await start(video);
  };

  return (
    <div>
      {poseData && (
        <div>
          <p>Left Elbow Angle: {poseData.angles?.leftElbow?.toFixed(1)}°</p>
          <p>Right Knee Angle: {poseData.angles?.rightKnee?.toFixed(1)}°</p>
        </div>
      )}
    </div>
  );
}
```

### Using the Pose Stream in Other Modules

```javascript
import { subscribeToPoseStream, getCurrentPoseData } from './modules/poseStream';

// Subscribe to pose updates
const unsubscribe = subscribeToPoseStream((poseData) => {
  console.log('Pose detected:', poseData);
  console.log('Joints:', poseData.joints);
  console.log('Angles:', poseData.angles);
});

// Get current pose data
const currentPose = getCurrentPoseData();

// Unsubscribe when done
unsubscribe();
```

### Available Joints

The system provides access to 33 body landmarks:

- **Face**: NOSE, LEFT_EYE, RIGHT_EYE, LEFT_EAR, RIGHT_EAR, etc.
- **Upper Body**: LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST
- **Lower Body**: LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE

### Computed Angles

The system automatically calculates:
- Elbow angles (left/right)
- Knee angles (left/right)
- Shoulder angles (left/right)
- Hip angles (left/right)

### Smoothing Filters

Three smoothing algorithms are available:
- **Exponential Moving Average (EMA)**: Simple and fast
- **One Euro Filter**: Adaptive smoothing based on velocity
- **Kalman Filter**: Advanced filtering for noisy data

## Project Structure

```
src/
├── services/
│   └── poseDetectionService.js    # Core pose detection service
├── hooks/
│   └── usePoseDetection.js        # React hook for pose detection
├── utils/
│   ├── jointMapping.js            # Joint name/index mapping
│   ├── angleComputation.js        # Angle calculation utilities
│   └── smoothingFilters.js       # Smoothing filter implementations
├── modules/
│   └── poseStream.js              # Stream API for other modules
└── examples/
    └── exampleModule.js           # Example usage patterns
```

## Configuration Options

### usePoseDetection Hook Options

- `targetFPS` (number): Target frames per second (default: 30)
- `smoothingAlpha` (number): Smoothing factor 0-1 (default: 0.5)
- `modelPath` (string): Path to MediaPipe WASM files
- `modelAssetPath` (string): Path to pose model file

## API Reference

### PoseDetectionService

- `initialize()`: Load the pose model
- `start(videoElement)`: Start detection on video element
- `stop()`: Stop detection
- `subscribe(callback)`: Subscribe to pose updates
- `setTargetFPS(fps)`: Update target FPS
- `setSmoothingAlpha(alpha)`: Update smoothing factor

### Pose Data Structure

```javascript
{
  landmarks: Array,        // Raw MediaPipe landmarks
  joints: Object,          // Named joint positions {x, y, z, visibility}
  angles: Object,         // Computed joint angles
  timestamp: number,      // Detection timestamp
  confidence: number      // Detection confidence
}
```

```
+-----------------------------------------------------------+
|                       React Component                     |
|-----------------------------------------------------------|
| - Renders UI                                              |
| - Provides <video> element                                |
| - Calls: start(), stop()                                  |
| - Receives: poseData, error, isRunning                    |
+---------------------------+-------------------------------+
                            |
                            v
+-----------------------------------------------------------+
|                usePoseDetection (React Hook)              |
|-----------------------------------------------------------|
| - Creates PoseDetectionService instance                   |
| - Manages React state:                                    |
|     isInitialized                                         |
|     isRunning                                             |
|     poseData                                              |
|     error                                                 |
| - Exposes: start(), stop(), initialize(), setFPS(), etc. |
| - Updates UI via setPoseData()                            |
+---------------------------+-------------------------------+
                            |
                            v
+-----------------------------------------------------------+
|                 PoseDetectionService (Engine)             |
|-----------------------------------------------------------|
| Initialization:                                           |
|   - Load WASM + model via MediaPipe                      |
|   - Configure WebGPU delegate                             |
|   - Prepare runtime                                       |
|                                                           |
| Runtime:                                                  |
|   start(video)                                            |
|     -> processFrame() loop                                |
|                                                           |
| processFrame():                                           |
|   - Throttle to targetFPS                                 |
|   - Run poseLandmarker.detectForVideo()                   |
|   - Extract joints                                        |
|   - Smooth joints (PoseSmoother)                          |
|   - Compute angles                                        |
|   - Smooth angles (AngleSmoother)                         |
|   - Build poseData packet                                 |
|   - notifySubscribers()                                   |
|   - onPoseDetected() -> sends to hook                     |
|                                                           |
| API:                                                      |
|   start(), stop(), initialize()                           |
|   subscribe(callback)                                     |
|   setTargetFPS(), setSmoothingAlpha()                     |
|   dispose()                                               |
+---------------------------+-------------------------------+
                            |
                            v
+-----------------------------------------------------------+
|                       MediaPipe Model                     |
|-----------------------------------------------------------|
| Pose Landmarker (WebGPU / WASM):                          |
|   - Returns 33 landmarks                                  |
|   - Tracking + timestamps                                 |
|   - Segmentation/confidence (optional)                    |
+---------------------------+-------------------------------+
                            |
                            v
+-----------------------------------------------------------+
|                      Subscribers (Optional)               |
|-----------------------------------------------------------|
| - Rep counter                                             |
| - Posture analysis                                        |
| - Skeleton overlay renderer                               |
| - Data logger / analytics                                 |
| Receive poseData via notifySubscribers()                  |
+-----------------------------------------------------------+

```

## System Architecture Diagram

<img src="Screenshot 2025-11-19 at 12.25.50 PM.png" alt="System Architecture Diagram" width="100%">


## Browser Requirements

- Chrome/Edge 90+ (for WebGPU support)
- Firefox 89+ (experimental WebGPU support)
- Safari 16.4+ (experimental WebGPU support)

## Troubleshooting

1. **WebGPU not available**: Ensure you're using a supported browser and have WebGPU enabled
2. **Model loading fails**: Check network connection and CDN availability
3. **Low FPS**: Reduce target FPS or use a lighter model variant

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

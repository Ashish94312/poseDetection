/**
 * Smoothing filters for pose data
 */

/**
 * Exponential Moving Average (EMA) filter
 */
export class ExponentialMovingAverage {
  constructor(alpha = 0.5) {
    this.alpha = alpha; // Smoothing factor (0-1), higher = less smoothing
    this.value = null;
  }

  update(newValue) {
    if (this.value === null) {
      this.value = newValue;
      return this.value;
    }
    this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

/**
 * One Euro Filter - adaptive smoothing based on velocity
 * Reference: https://cristal.univ-lille.fr/~casiez/1euro/
 */
export class OneEuroFilter {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = null;
    this.tPrev = null;
  }

  update(x, t) {
    if (this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = t;
      return x;
    }

    const dt = t - this.tPrev;
    if (dt <= 0) return this.xPrev;

    // Calculate velocity
    const dx = (x - this.xPrev) / dt;
    const dxFiltered = this.lowpassFilter(dx, this.dxPrev, this.dCutoff, dt);
    this.dxPrev = dxFiltered;

    // Adaptive cutoff based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(dxFiltered);

    // Filter the signal
    const xFiltered = this.lowpassFilter(x, this.xPrev, cutoff, dt);
    this.xPrev = xFiltered;
    this.tPrev = t;

    return xFiltered;
  }

  lowpassFilter(x, xPrev, cutoff, dt) {
    if (xPrev === null) return x;
    const alpha = 1 / (1 + cutoff * dt);
    return alpha * x + (1 - alpha) * xPrev;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = null;
    this.tPrev = null;
  }
}

/**
 * Kalman Filter for 1D signals
 */
export class KalmanFilter1D {
  constructor(processNoise = 0.01, measurementNoise = 0.25) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.estimatedValue = null;
    this.errorCovariance = 1.0;
  }

  update(measurement) {
    if (this.estimatedValue === null) {
      this.estimatedValue = measurement;
      return this.estimatedValue;
    }

    // Prediction
    const errorCovariancePred = this.errorCovariance + this.processNoise;

    // Update
    const kalmanGain = errorCovariancePred / (errorCovariancePred + this.measurementNoise);
    this.estimatedValue = this.estimatedValue + kalmanGain * (measurement - this.estimatedValue);
    this.errorCovariance = (1 - kalmanGain) * errorCovariancePred;

    return this.estimatedValue;
  }

  reset() {
    this.estimatedValue = null;
    this.errorCovariance = 1.0;
  }
}

/**
 * Smooth a 3D point using EMA
 */
export class Point3DSmoother {
  constructor(alpha = 0.5) {
    this.xFilter = new ExponentialMovingAverage(alpha);
    this.yFilter = new ExponentialMovingAverage(alpha);
    this.zFilter = new ExponentialMovingAverage(alpha);
  }

  update(point) {
    if (!point) return null;
    return {
      x: this.xFilter.update(point.x),
      y: this.yFilter.update(point.y),
      z: this.zFilter.update(point.z || 0),
      visibility: point.visibility || 1.0,
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }
}

/**
 * Smooth all joints in a pose
 */
export class PoseSmoother {
  constructor(alpha = 0.5) {
    this.alpha = alpha;
    this.jointFilters = {};
  }

  update(joints) {
    if (!joints) return null;

    const smoothed = {};
    Object.keys(joints).forEach((jointName) => {
      const joint = joints[jointName];
      if (!joint) {
        smoothed[jointName] = null;
        return;
      }

      if (!this.jointFilters[jointName]) {
        this.jointFilters[jointName] = new Point3DSmoother(this.alpha);
      }

      smoothed[jointName] = this.jointFilters[jointName].update(joint);
    });

    return smoothed;
  }

  reset() {
    this.jointFilters = {};
  }
}

/**
 * Smooth angles using EMA
 * Handles both flat angle objects and nested structures (jointAngles, segmentOrientations)
 */
export class AngleSmoother {
  constructor(alpha = 0.7) {
    this.alpha = alpha;
    this.angleFilters = {};
  }

  update(angles) {
    if (!angles) return null;

    // Check if this is the new nested structure (has jointAngles and/or segmentOrientations)
    if (angles.jointAngles || angles.segmentOrientations) {
      const smoothed = {};
      
      // Smooth joint angles
      if (angles.jointAngles) {
        smoothed.jointAngles = this.smoothAngleObject(angles.jointAngles, 'jointAngles.');
      }
      
      // Smooth segment orientations
      if (angles.segmentOrientations) {
        smoothed.segmentOrientations = this.smoothAngleObject(angles.segmentOrientations, 'segmentOrientations.');
      }
      
      return smoothed;
    }

    // Legacy flat structure
    return this.smoothAngleObject(angles, '');
  }

  smoothAngleObject(angleObj, prefix = '') {
    if (!angleObj || typeof angleObj !== 'object') return null;

    const smoothed = {};
    Object.keys(angleObj).forEach((angleName) => {
      const angle = angleObj[angleName];
      if (angle === null || angle === undefined) {
        smoothed[angleName] = null;
        return;
      }

      const filterKey = prefix + angleName;
      if (!this.angleFilters[filterKey]) {
        this.angleFilters[filterKey] = new ExponentialMovingAverage(this.alpha);
      }

      smoothed[angleName] = this.angleFilters[filterKey].update(angle);
    });

    return smoothed;
  }

  reset() {
    this.angleFilters = {};
  }
}


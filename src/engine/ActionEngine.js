/**
 * Action Engine - Part B
 * Handles jump detection, vertical velocity estimation, and force approximation
 */

export class ActionEngine {
    constructor(config = {}) {
      // Configuration
      this.config = {
        jumpThreshold: config.jumpThreshold || 0.15, // meters - minimum vertical displacement to detect jump
        velocityWindow: config.velocityWindow || 5, // frames for velocity calculation
        smoothingAlpha: config.smoothingAlpha || 0.3, // exponential smoothing factor
        gravity: config.gravity || 9.81, // m/s²
        massEstimate: config.massEstimate || 70, // kg - average human mass
        userHeight: config.userHeight || 1.72, // meters - from session metadata
        fps: config.fps || 30, // frames per second
        ...config
      };
  
      // State
      this.previousPositions = [];
      this.velocities = [];
      this.isJumping = false;
      this.jumpStartTime = null;
      this.jumpPeakTime = null;
      this.jumpCount = 0;
      this.maxJumpHeight = 0;
      this.currentForce = 0;
      this.baselinePosition = null; // Will be set from first frame
      
      // Statistics
      this.stats = {
        totalJumps: 0,
        maxHeight: 0,
        avgJumpHeight: 0,
        jumpHeights: [],
        airtimeHistory: []
      };
    }
  
    /**
     * Process frame data from Part A
     * Expected format: { 
     *   joints: { [jointName]: { x, y, z, conf } },
     *   angles: { [angleName]: number },
     *   metrics: { com: {x,y,z}, velocity: {vx,vy,vz}, acceleration: {ax,ay,az}, grf_N: number },
     *   actions: { jump: { state, takeoff_ts, landing_ts, airtime_s, confidence } },
     *   timestamp_ms: number,
     *   frame_index: number
     * }
     */
    processFrameData(frameData) {
      if (!frameData || !frameData.joints) {
        return null;
      }
  
      // Extract vertical position - prefer COM from metrics, otherwise calculate from joints
      let verticalPosition = null;
      if (frameData.metrics && frameData.metrics.com && frameData.metrics.com.y !== undefined) {
        // COM is in normalized coordinates (0-1), convert to meters
        verticalPosition = frameData.metrics.com.y * this.config.userHeight;
      } else {
        verticalPosition = this.extractVerticalPosition(frameData.joints);
      }
      
      if (verticalPosition === null) {
        return null;
      }
  
      // Set baseline from first frame
      if (this.baselinePosition === null) {
        this.baselinePosition = verticalPosition;
      }
  
      const timestamp = frameData.timestamp_ms || Date.now();
      const dt = this.previousPositions.length > 0 
        ? (timestamp - this.previousPositions[this.previousPositions.length - 1].timestamp) / 1000
        : 1 / this.config.fps;
  
      // Store position history
      this.previousPositions.push({
        position: verticalPosition,
        timestamp: timestamp
      });
  
      // Keep only recent positions for velocity calculation
      if (this.previousPositions.length > this.config.velocityWindow * 2) {
        this.previousPositions.shift();
      }
  
      // Use provided velocity from Part A if available, otherwise calculate
      let verticalVelocity = 0;
      if (frameData.metrics && frameData.metrics.velocity && frameData.metrics.velocity.vy !== undefined) {
        // Velocity from Part A is in m/s
        verticalVelocity = frameData.metrics.velocity.vy;
        // Apply smoothing
        if (this.velocities.length > 0) {
          const lastVelocity = this.velocities[this.velocities.length - 1];
          verticalVelocity = this.config.smoothingAlpha * verticalVelocity + (1 - this.config.smoothingAlpha) * lastVelocity;
        }
        this.velocities.push(verticalVelocity);
      } else {
        verticalVelocity = this.calculateVerticalVelocity(dt);
      }
      
      // Detect jump - integrate Part A's jump detection with our own
      const jumpState = this.detectJump(verticalPosition, verticalVelocity, frameData.actions);
      
      // Use provided GRF from Part A if available, otherwise calculate
      let force = 0;
      if (frameData.metrics && frameData.metrics.grf_N !== undefined) {
        force = frameData.metrics.grf_N;
        this.currentForce = force;
      } else {
        force = this.calculateForce(verticalVelocity, jumpState, frameData.metrics);
      }
  
      // Update statistics
      this.updateStatistics(jumpState, verticalPosition, frameData.actions);
  
      return {
        position: verticalPosition,
        velocity: verticalVelocity,
        force: force,
        jumpState: jumpState,
        timestamp: timestamp,
        frameIndex: frameData.frame_index,
        metrics: frameData.metrics ? {
          com: frameData.metrics.com,
          acceleration: frameData.metrics.acceleration,
          stabilityIndex: frameData.metrics.stability_index
        } : null,
        stats: { ...this.stats }
      };
    }
  
    /**
     * Extract vertical position from joint data
     * Joints are in normalized coordinates (0-1), convert to meters using user height
     * Uses hip joints (hip_left, hip_right) or average of key joints
     */
    extractVerticalPosition(joints) {
      // Priority: average of hip joints > chest > average of all joints
      if (joints.hip_left && joints.hip_right && 
          joints.hip_left.y !== undefined && joints.hip_right.y !== undefined) {
        const avgY = (joints.hip_left.y + joints.hip_right.y) / 2;
        // Convert normalized (0-1) to meters, where 1.0 = user height
        return avgY * this.config.userHeight;
      }
      
      if (joints.chest && joints.chest.y !== undefined) {
        return joints.chest.y * this.config.userHeight;
      }
  
      // Fallback: average of available joints with y coordinates
      const jointsWithY = Object.values(joints).filter(j => j && j.y !== undefined);
      if (jointsWithY.length === 0) {
        return null;
      }
      
      const avgY = jointsWithY.reduce((sum, joint) => sum + joint.y, 0) / jointsWithY.length;
      return avgY * this.config.userHeight;
    }
  
    /**
     * Calculate vertical velocity using position history
     */
    calculateVerticalVelocity(dt) {
      if (this.previousPositions.length < 2) {
        return 0;
      }
  
      // Use multiple points for more stable velocity estimation
      const recent = this.previousPositions.slice(-this.config.velocityWindow);
      if (recent.length < 2) {
        return 0;
      }
  
      // Linear regression for velocity estimation
      const positions = recent.map(p => p.position);
      const timestamps = recent.map(p => p.timestamp);
      
      const n = positions.length;
      const sumT = timestamps.reduce((a, b) => a + b, 0);
      const sumP = positions.reduce((a, b) => a + b, 0);
      const sumTP = timestamps.reduce((sum, t, i) => sum + t * positions[i], 0);
      const sumT2 = timestamps.reduce((sum, t) => sum + t * t, 0);
  
      const denominator = n * sumT2 - sumT * sumT;
      if (Math.abs(denominator) < 1e-10) {
        // Fallback to simple difference
        const last = recent[recent.length - 1];
        const prev = recent[recent.length - 2];
        return (last.position - prev.position) / ((last.timestamp - prev.timestamp) / 1000);
      }
  
      const velocity = (n * sumTP - sumT * sumP) / denominator;
      
      // Apply exponential smoothing
      if (this.velocities.length > 0) {
        const lastVelocity = this.velocities[this.velocities.length - 1];
        const smoothed = this.config.smoothingAlpha * velocity + (1 - this.config.smoothingAlpha) * lastVelocity;
        this.velocities.push(smoothed);
        return smoothed;
      }
  
      this.velocities.push(velocity);
      return velocity;
    }
  
    /**
     * Detect jump based on position, velocity, and Part A's jump detection
     */
    detectJump(currentPosition, velocity, partAActions) {
      if (this.previousPositions.length < 2) {
        return {
          isJumping: false,
          phase: 'grounded',
          height: 0,
          partAState: null,
          confidence: 0
        };
      }
  
      const baseline = this.baselinePosition || this.getBaselinePosition();
      const displacement = baseline - currentPosition; // Positive = upward (lower y = higher position)
      const height = Math.max(0, displacement);
  
      // Integrate Part A's jump detection if available
      let partAJumpState = null;
      let partAConfidence = 0;
      if (partAActions && partAActions.jump) {
        partAJumpState = partAActions.jump.state;
        partAConfidence = partAActions.jump.confidence || 0;
        
        // Use Part A's jump state as primary indicator if confidence is high
        if (partAConfidence > 0.7) {
          if (partAJumpState === 'takeoff' || partAJumpState === 'airborne') {
            if (!this.isJumping) {
              this.isJumping = true;
              this.jumpStartTime = partAActions.jump.takeoff_ts || this.previousPositions[this.previousPositions.length - 1].timestamp;
              this.maxJumpHeight = height;
            }
          } else if (partAJumpState === 'landed' || partAJumpState === 'grounded') {
            if (this.isJumping) {
              this.isJumping = false;
              this.jumpCount++;
              
              // Record jump statistics
              if (this.maxJumpHeight > 0) {
                this.stats.jumpHeights.push(this.maxJumpHeight);
                this.stats.totalJumps++;
                this.stats.maxHeight = Math.max(this.stats.maxHeight, this.maxJumpHeight);
                this.stats.avgJumpHeight = this.stats.jumpHeights.reduce((a, b) => a + b, 0) / this.stats.jumpHeights.length;
                
                // Record airtime if available
                if (partAActions.jump.airtime_s) {
                  this.stats.airtimeHistory.push(partAActions.jump.airtime_s);
                }
              }
              
              this.maxJumpHeight = 0;
            }
          }
        }
      }
  
      // Fallback: our own jump detection logic if Part A's confidence is low
      if (partAConfidence <= 0.7) {
        const wasJumping = this.isJumping;
        
        // Start jump: upward velocity and position rising
        if (!wasJumping && velocity > 0.3 && displacement > this.config.jumpThreshold * 0.5) {
          this.isJumping = true;
          this.jumpStartTime = this.previousPositions[this.previousPositions.length - 1].timestamp;
          this.maxJumpHeight = height;
        }
        
        // Update max height during jump
        if (this.isJumping) {
          this.maxJumpHeight = Math.max(this.maxJumpHeight, height);
          
          // End jump: back near baseline with downward velocity
          if (displacement < this.config.jumpThreshold * 0.3 && velocity < -0.1) {
            this.isJumping = false;
            this.jumpCount++;
            
            // Record jump statistics
            if (this.maxJumpHeight > 0) {
              this.stats.jumpHeights.push(this.maxJumpHeight);
              this.stats.totalJumps++;
              this.stats.maxHeight = Math.max(this.stats.maxHeight, this.maxJumpHeight);
              this.stats.avgJumpHeight = this.stats.jumpHeights.reduce((a, b) => a + b, 0) / this.stats.jumpHeights.length;
            }
            
            this.maxJumpHeight = 0;
          }
        }
      } else {
        // Update max height during jump (when using Part A's detection)
        if (this.isJumping) {
          this.maxJumpHeight = Math.max(this.maxJumpHeight, height);
        }
      }
  
      // Determine jump phase
      let phase = 'grounded';
      if (this.isJumping) {
        if (partAJumpState === 'takeoff') {
          phase = 'takeoff';
        } else if (partAJumpState === 'airborne') {
          if (velocity > 0.1) {
            phase = 'ascending';
          } else if (velocity < -0.1) {
            phase = 'descending';
          } else {
            phase = 'peak';
          }
        } else {
          // Fallback phase detection
          if (velocity > 0.1) {
            phase = 'ascending';
          } else if (velocity < -0.1) {
            phase = 'descending';
          } else {
            phase = 'peak';
          }
        }
      }
  
      return {
        isJumping: this.isJumping,
        phase: phase,
        height: height,
        maxHeight: this.maxJumpHeight,
        partAState: partAJumpState,
        confidence: partAConfidence,
        airtime: partAActions?.jump?.airtime_s || null
      };
    }
  
    /**
     * Get baseline position (ground level) from recent history
     */
    getBaselinePosition() {
      if (this.baselinePosition !== null) {
        return this.baselinePosition;
      }
      
      if (this.previousPositions.length === 0) {
        return 0;
      }
  
      // Use the maximum position from recent history as baseline
      // (lower y values = higher position, so max y = lowest position = ground)
      const recent = this.previousPositions.slice(-this.config.velocityWindow * 3);
      const positions = recent.map(p => p.position);
      return Math.max(...positions);
    }
  
    /**
     * Calculate force approximation
     * Uses F = ma, where acceleration can be from Part A or derived from velocity change
     */
    calculateForce(velocity, jumpState, partAMetrics) {
      // Use Part A's acceleration if available
      let acceleration = 0;
      if (partAMetrics && partAMetrics.acceleration && partAMetrics.acceleration.ay !== undefined) {
        acceleration = partAMetrics.acceleration.ay; // Already in m/s²
      } else {
        // Calculate acceleration from velocity change
        if (this.velocities.length < 2) {
          return this.config.massEstimate * this.config.gravity; // Return weight
        }
        
        const recentVelocities = this.velocities.slice(-2);
        const dv = recentVelocities[recentVelocities.length - 1] - recentVelocities[0];
        const dt = 1 / this.config.fps;
        acceleration = dv / dt;
      }
  
      // Net force = m * a
      // During jump, we add gravitational force
      let netForce = this.config.massEstimate * acceleration;
      
      if (jumpState.isJumping) {
        // During jump, account for gravity
        const gravitationalForce = this.config.massEstimate * this.config.gravity;
        
        if (jumpState.phase === 'ascending' || jumpState.phase === 'takeoff') {
          // Upward force needed to overcome gravity and accelerate upward
          netForce = this.config.massEstimate * (acceleration + this.config.gravity);
        } else if (jumpState.phase === 'descending') {
          // Only gravity acting (negative)
          netForce = -gravitationalForce;
        } else {
          // At peak, forces balance
          netForce = 0;
        }
      } else {
        // On ground, force is weight (mg) plus any acceleration
        netForce = this.config.massEstimate * this.config.gravity + this.config.massEstimate * acceleration;
      }
  
      // Apply smoothing
      this.currentForce = this.config.smoothingAlpha * netForce + (1 - this.config.smoothingAlpha) * this.currentForce;
      
      return this.currentForce;
    }
  
    /**
     * Update statistics
     */
    updateStatistics(jumpState, position, partAActions) {
      if (jumpState.isJumping && jumpState.height > this.stats.maxHeight) {
        this.stats.maxHeight = jumpState.height;
      }
      
      // Update airtime if available from Part A
      if (partAActions?.jump?.airtime_s && !this.stats.airtimeHistory.includes(partAActions.jump.airtime_s)) {
        // Only add if it's a new value (landing just occurred)
        if (partAActions.jump.landing_ts) {
          this.stats.airtimeHistory.push(partAActions.jump.airtime_s);
        }
      }
    }
  
    /**
     * Reset engine state
     */
    reset() {
      this.previousPositions = [];
      this.velocities = [];
      this.isJumping = false;
      this.jumpStartTime = null;
      this.jumpPeakTime = null;
      this.jumpCount = 0;
      this.maxJumpHeight = 0;
      this.currentForce = 0;
      this.baselinePosition = null;
      this.stats = {
        totalJumps: 0,
        maxHeight: 0,
        avgJumpHeight: 0,
        jumpHeights: [],
        airtimeHistory: []
      };
    }
  
    /**
     * Update configuration (e.g., from session metadata)
     */
    updateConfig(config) {
      if (config.userHeight) {
        this.config.userHeight = config.userHeight;
      }
      if (config.massEstimate) {
        this.config.massEstimate = config.massEstimate;
      }
    }
  
    /**
     * Get current statistics
     */
    getStatistics() {
      return { ...this.stats };
    }
  }
  
  
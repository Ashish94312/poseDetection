import React from 'react';
import './Dashboard.css';

export function Dashboard({ data, stats }) {
  if (!data) {
    return (
      <div className="dashboard">
        <div className="status-message">Waiting for data from Part A...</div>
      </div>
    );
  }

  const { position, velocity, force, jumpState } = data;

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Real-time Metrics */}
        <div className="metric-card">
          <h3>Vertical Position</h3>
          <div className="metric-value">
            {(position * 100).toFixed(1)} cm
          </div>
        </div>

        <div className="metric-card">
          <h3>Vertical Velocity</h3>
          <div className={`metric-value ${velocity > 0 ? 'positive' : 'negative'}`}>
            {velocity.toFixed(2)} m/s
          </div>
        </div>

        <div className="metric-card">
          <h3>Force</h3>
          <div className="metric-value">
            {force.toFixed(1)} N
          </div>
        </div>

        {/* Jump Status */}
        <div className={`jump-status-card ${jumpState.isJumping ? 'jumping' : 'grounded'}`}>
          <h3>Jump Status</h3>
          <div className="jump-indicator">
            <div className={`jump-badge ${jumpState.isJumping ? 'active' : ''}`}>
              {jumpState.isJumping ? 'JUMPING' : 'GROUNDED'}
            </div>
            <div className="jump-phase">{jumpState.phase.toUpperCase()}</div>
          </div>
          {jumpState.isJumping && (
            <div className="jump-height">
              Current Height: {(jumpState.height * 100).toFixed(1)} cm
              {jumpState.maxHeight > 0 && (
                <div className="max-height">
                  Peak: {(jumpState.maxHeight * 100).toFixed(1)} cm
                </div>
              )}
              {jumpState.airtime && (
                <div className="airtime">
                  Airtime: {(jumpState.airtime * 1000).toFixed(0)} ms
                </div>
              )}
            </div>
          )}
          {jumpState.partAState && (
            <div className="part-a-info">
              Part A: {jumpState.partAState}
              {jumpState.confidence > 0 && (
                <span className="confidence"> ({Math.round(jumpState.confidence * 100)}%)</span>
              )}
            </div>
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="stats-card">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Jumps:</span>
                <span className="stat-value">{stats.totalJumps}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max Height:</span>
                <span className="stat-value">{(stats.maxHeight * 100).toFixed(1)} cm</span>
              </div>
              {stats.avgJumpHeight > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Avg Height:</span>
                  <span className="stat-value">{(stats.avgJumpHeight * 100).toFixed(1)} cm</span>
                </div>
              )}
              {stats.airtimeHistory && stats.airtimeHistory.length > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Avg Airtime:</span>
                  <span className="stat-value">
                    {(stats.airtimeHistory.reduce((a, b) => a + b, 0) / stats.airtimeHistory.length * 1000).toFixed(0)} ms
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


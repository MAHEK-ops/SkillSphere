import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar/SearchBar';
import { fetchTimeline, compareLocations } from '../api/timeline';
import './Compare.css';

const CATEGORY_COLORS = {
  WAR_BATTLE: '#ef4444',
  POLITICS: '#3b82f6',
  SCIENCE_INNOVATION: '#10b981',
  CULTURE_ART: '#8b5cf6',
  DISASTER: '#f97316',
  FAMOUS_BIRTH_DEATH: '#eab308',
  UNKNOWN: '#9ca3af',
};

const Compare = () => {
  const [loc1, setLoc1] = useState({ data: null, loading: false, error: null });
  const [loc2, setLoc2] = useState({ data: null, loading: false, error: null });
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Search handler for a specific side (side = 1 or 2)
  const handleSearch = async (side, inputStr, radiusKm) => {
    const setSide = side === 1 ? setLoc1 : setLoc2;
    setSide(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const payload = { radiusKm };
      if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(inputStr)) {
        const [lat, lng] = inputStr.split(',').map(n => parseFloat(n.trim()));
        payload.latitude = lat;
        payload.longitude = lng;
      } else {
        payload.address = inputStr;
      }

      const response = await fetchTimeline(payload);
      
      if (response && response.success) {
        setSide({ data: response.location, loading: false, error: null });
      } else {
        setSide({ data: null, loading: false, error: response.error || 'Search failed' });
      }
    } catch (err) {
      setSide({ data: null, loading: false, error: err.response?.data?.error || err.message });
    }
  };

  // Run comparison when both locations are loaded
  useEffect(() => {
    const doComparison = async () => {
      if (loc1.data?.id && loc2.data?.id) {
        setComparisonLoading(true);
        setGlobalError('');
        try {
          const res = await compareLocations(loc1.data.id, loc2.data.id);
          if (res && res.success) {
            setComparison(res.comparison);
          } else {
            setGlobalError(res.error || 'Failed to compare locations.');
          }
        } catch (err) {
          setGlobalError(err.response?.data?.error || err.message || 'Comparison error.');
        } finally {
          setComparisonLoading(false);
        }
      }
    };
    doComparison();
  }, [loc1.data, loc2.data]);

  // Renderer for a single location's stats
  const renderStatsNode = (locationData, stats) => {
    if (!stats) return null;

    return (
      <div className="stats-card">
        <h2>{stats.placeName || locationData.placeName}</h2>
        <div className="score-badge">
          Richness Score: <span>{Math.round(stats.richnessScore)}</span>
        </div>
        
        <div className="stats-meta">
          <p>Total Events: <strong>{stats.totalEvents}</strong></p>
          <p>Dominant Category: <strong>{stats.dominantCategory.replace(/_/g, ' ')}</strong></p>
          <p>Dominant Era: <strong>{stats.dominantEra.replace(/_/g, ' ')}</strong></p>
        </div>

        <div className="category-bars">
          <h3>Category Breakdown</h3>
          {Object.entries(stats.categoryBreakdown || {})
            .sort((a, b) => b[1] - a[1]) // Sort desc by count
            .map(([category, count]) => {
              const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents) * 100 : 0;
              const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.UNKNOWN;
              
              return (
                <div key={category} className="bar-row">
                  <div className="bar-label">
                    <span>{category.replace(/_/g, ' ')}</span>
                    <span>{count}</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h1>Compare Locations</h1>
        <p>Analyze historical richness side-by-side.</p>
        {globalError && <div className="error-banner">{globalError}</div>}
      </div>

      <div className="compare-grid">
        {/* --- Side 1 --- */}
        <div className="compare-side">
          <div className="search-wrapper">
            <SearchBar 
              onSearch={(str, rad) => handleSearch(1, str, rad)} 
              loading={loc1.loading} 
            />
            {loc1.error && <p className="error-text">{loc1.error}</p>}
          </div>
          
          <div className="stats-wrapper">
            {loc1.data && comparison && !comparisonLoading && renderStatsNode(loc1.data, comparison.location1)}
            {loc1.loading && <div className="loading-pulse">Resolving location...</div>}
            {loc1.data && !comparison && !comparisonLoading && (
              <div className="waiting-placeholder">Select second location to compare.</div>
            )}
          </div>
        </div>

        <div className="vs-divider">VS</div>

        {/* --- Side 2 --- */}
        <div className="compare-side">
          <div className="search-wrapper">
            <SearchBar 
              onSearch={(str, rad) => handleSearch(2, str, rad)} 
              loading={loc2.loading} 
            />
            {loc2.error && <p className="error-text">{loc2.error}</p>}
          </div>
          
          <div className="stats-wrapper">
            {loc2.data && comparison && !comparisonLoading && renderStatsNode(loc2.data, comparison.location2)}
            {loc2.loading && <div className="loading-pulse">Resolving location...</div>}
            {loc2.data && !comparison && !comparisonLoading && (
              <div className="waiting-placeholder">Select another location to compare.</div>
            )}
          </div>
        </div>
      </div>
      
      {comparisonLoading && (
        <div className="global-loader">Analyzing historical contrast...</div>
      )}
    </div>
  );
};

export default Compare;

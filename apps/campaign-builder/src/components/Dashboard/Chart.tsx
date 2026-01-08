import React from 'react';
import './Chart.css';

interface ChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line' | 'pie';
  height?: number;
}

export default function Chart({ title, data, type = 'bar', height = 200 }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (type === 'bar') {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="chart-bar" style={{ height: `${height}px` }}>
          {data.map((item, index) => (
            <div key={index} className="chart-bar-item">
              <div
                className="chart-bar-fill"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  background: `linear-gradient(180deg, var(--primary-purple), var(--primary-purple-light))`
                }}
              />
              <span className="chart-bar-label">{item.label}</span>
              <span className="chart-bar-value">{formatValue(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="chart-line" style={{ height: `${height}px` }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-svg">
            <polyline
              points={points}
              fill="none"
              stroke="var(--primary-purple)"
              strokeWidth="2"
            />
            <polygon
              points={`0,100 ${points} 100,100`}
              fill="url(#gradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-purple)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--primary-purple)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="chart-line-labels">
            {data.map((item, index) => (
              <span key={index} className="chart-line-label">{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pie chart
  let currentAngle = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    'var(--primary-purple)',
    'var(--primary-purple-light)',
    '#8ec5fc',
    '#e0c3fc',
    '#a8edea',
    '#fed6e3'
  ];

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="chart-pie" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" className="chart-svg">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;

            const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
                opacity="0.8"
              />
            );
          })}
        </svg>
        <div className="chart-pie-legend">
          {data.map((item, index) => (
            <div key={index} className="chart-pie-legend-item">
              <span
                className="chart-pie-legend-color"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>{item.label}</span>
              <span className="chart-pie-legend-value">{(item.value / total * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}


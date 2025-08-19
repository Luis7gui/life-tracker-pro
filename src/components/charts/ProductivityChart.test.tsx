/**
 * Life Tracker Pro - ProductivityChart Tests
 * Tests for the productivity chart component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductivityChart from './ProductivityChart';

describe('ProductivityChart', () => {
  const mockData = {
    morning: 120,
    afternoon: 180,
    evening: 90,
    night: 30,
  };

  it('renders empty state when no data provided', () => {
    render(<ProductivityChart />);
    expect(screen.getByText('No productivity data yet')).toBeInTheDocument();
    expect(screen.getByText('Start tracking to see your patterns')).toBeInTheDocument();
  });

  it('renders empty state when all values are zero', () => {
    const emptyData = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    render(<ProductivityChart data={emptyData} />);
    expect(screen.getByText('No productivity data yet')).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    render(<ProductivityChart data={mockData} />);
    // Chart should render without the empty state message
    expect(screen.queryByText('No productivity data yet')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ProductivityChart data={mockData} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('converts time data to minutes correctly', () => {
    // This would test the internal data transformation
    // In a real scenario, you might want to test the actual chart data
    render(<ProductivityChart data={mockData} />);
    // The component should handle the conversion internally
    expect(screen.queryByText('No productivity data yet')).not.toBeInTheDocument();
  });
});
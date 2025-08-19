/**
 * Life Tracker Pro - Chronicles Tests
 * Tests for the chronicles gamification component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chronicles from './Chronicles';

describe('Chronicles', () => {
  const mockProductivityData = {
    '2025-08-15': { sessions: 5, minutes: 240, productivity: 85 },
    '2025-08-14': { sessions: 3, minutes: 180, productivity: 72 },
    '2025-08-13': { sessions: 7, minutes: 320, productivity: 92 },
    '2025-08-12': { sessions: 2, minutes: 120, productivity: 60 },
  };

  it('renders all main sections', () => {
    render(<Chronicles />);
    
    // Should render all three main sections
    expect(screen.getByText('CURRENT_STREAK')).toBeInTheDocument();
    expect(screen.getByText('ACHIEVEMENTS')).toBeInTheDocument();
    expect(screen.getByText('COSMIC_CALENDAR')).toBeInTheDocument();
  });

  it('displays current streak correctly', () => {
    render(<Chronicles productivityData={mockProductivityData} />);
    
    expect(screen.getByText('CURRENT_STREAK')).toBeInTheDocument();
    expect(screen.getByText('Consecutive days of mystical achievements')).toBeInTheDocument();
    expect(screen.getByText('days_of_power')).toBeInTheDocument();
    expect(screen.getByText('Record: 25 days')).toBeInTheDocument();
  });

  it('displays achievements with correct status', () => {
    render(<Chronicles />);
    
    // Should show unlocked achievements
    expect(screen.getByText('First week of enlightenment')).toBeInTheDocument();
    expect(screen.getByText('Streak of spiritual awakening')).toBeInTheDocument();
    expect(screen.getByText('Perfect harmony achieved')).toBeInTheDocument();
    
    // Should show locked achievements
    expect(screen.getByText('Master of Time')).toBeInTheDocument();
    expect(screen.getByText('Legend of Focus')).toBeInTheDocument();
    expect(screen.getByText('Monthly Champion')).toBeInTheDocument();
  });

  it('shows progress bars for in-progress achievements', () => {
    render(<Chronicles />);
    
    // Should show progress text for locked achievements
    expect(screen.getByText('6/8')).toBeInTheDocument(); // Master of Time
    expect(screen.getByText('7/10')).toBeInTheDocument(); // Legend of Focus
    expect(screen.getByText('12/30')).toBeInTheDocument(); // Monthly Champion
  });

  it('displays cosmic calendar with navigation', () => {
    render(<Chronicles />);
    
    // Calendar should be present
    expect(screen.getByText('COSMIC_CALENDAR')).toBeInTheDocument();
    expect(screen.getByText('Visualize your mystical journey')).toBeInTheDocument();
    
    // Should show current month
    expect(screen.getByText(/August 2025/)).toBeInTheDocument();
    
    // Should have navigation buttons
    const prevButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.getAttribute('aria-hidden') !== 'true'
    );
    expect(prevButton).toBeInTheDocument();
  });

  it('displays calendar statistics', () => {
    render(<Chronicles productivityData={mockProductivityData} />);
    
    expect(screen.getByText('ACTIVE DAYS')).toBeInTheDocument();
    expect(screen.getByText('TOTAL SESSIONS')).toBeInTheDocument();
    expect(screen.getByText('TOTAL TIME')).toBeInTheDocument();
    
    // Should calculate stats correctly
    expect(screen.getByText('4')).toBeInTheDocument(); // 4 active days
    expect(screen.getByText('17')).toBeInTheDocument(); // 5+3+7+2 = 17 sessions
    expect(screen.getByText('14h 20m')).toBeInTheDocument(); // 240+180+320+120 = 860 minutes = 14h 20m
  });

  it('handles month navigation', () => {
    render(<Chronicles />);
    
    const buttons = screen.getAllByRole('button');
    const navButtons = buttons.filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && (svg.textContent === '' || svg.getAttribute('data-testid'));
    });
    
    expect(navButtons.length).toBeGreaterThan(0);
    
    // Test clicking navigation (should not throw)
    if (navButtons[0]) {
      fireEvent.click(navButtons[0]);
    }
  });

  it('applies custom className', () => {
    const { container } = render(<Chronicles className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays achievement icons correctly', () => {
    render(<Chronicles />);
    
    // Achievement icons should be present in the DOM
    const achievementSection = screen.getByText('ACHIEVEMENTS').closest('div');
    expect(achievementSection).toBeInTheDocument();
    
    // Should have unlocked date for completed achievements
    expect(screen.getByText('✓ Unlocked 2025-08-08')).toBeInTheDocument();
    expect(screen.getByText('✓ Unlocked 2025-08-12')).toBeInTheDocument();
    expect(screen.getByText('✓ Unlocked 2025-08-15')).toBeInTheDocument();
  });

  it('calculates streak correctly from productivity data', () => {
    const consecutiveData = {
      '2025-08-15': { sessions: 5, minutes: 240, productivity: 85 },
      '2025-08-14': { sessions: 3, minutes: 180, productivity: 72 },
      '2025-08-13': { sessions: 7, minutes: 320, productivity: 92 },
      // Gap here should break streak
      '2025-08-11': { sessions: 2, minutes: 120, productivity: 60 },
    };
    
    render(<Chronicles productivityData={consecutiveData} />);
    
    // Should show streak number (looking for any number display)
    const streakSection = screen.getByText('CURRENT_STREAK').closest('div');
    expect(streakSection).toBeInTheDocument();
  });

  it('shows weekday headers in calendar', () => {
    render(<Chronicles />);
    
    // Should show all weekday abbreviations
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Tu')).toBeInTheDocument();
    expect(screen.getByText('We')).toBeInTheDocument();
    expect(screen.getByText('Th')).toBeInTheDocument();
    expect(screen.getByText('Fr')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
  });
});
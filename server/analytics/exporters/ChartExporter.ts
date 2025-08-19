/**
 * Life Tracker Pro - Chart Exporter
 * Generate standalone chart images for reports and presentations
 */

export interface ChartExportOptions {
  width: number;
  height: number;
  format: 'png' | 'svg' | 'pdf';
  theme: 'light' | 'dark' | 'professional';
  title?: string;
  subtitle?: string;
  showLegend: boolean;
  showGrid: boolean;
  backgroundColor?: string;
  transparent?: boolean;
}

export interface ChartDataPoint {
  x: any;
  y: number;
  label?: string;
  color?: string;
  metadata?: any;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area' | 'scatter';
  color?: string;
  style?: any;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'timeline';
  series: ChartSeries[];
  xAxis?: {
    title?: string;
    type?: 'category' | 'numeric' | 'datetime';
    labels?: string[];
  };
  yAxis?: {
    title?: string;
    min?: number;
    max?: number;
    format?: string;
  };
  annotations?: Array<{
    type: 'line' | 'area' | 'point';
    value: any;
    label?: string;
    color?: string;
  }>;
}

export class ChartExporter {

  /**
   * Generate productivity timeline chart
   */
  static async generateTimelineChart(
    timeSeriesData: any[],
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 800,
      height: 400,
      format: 'png',
      theme: 'professional',
      title: 'Productivity Timeline',
      showLegend: true,
      showGrid: true,
      ...options
    };

    const series: ChartSeries[] = [{
      name: 'Productivity Score',
      type: 'line',
      data: timeSeriesData.map(point => ({
        x: point.date,
        y: point.value,
        label: this.formatDate(point.date)
      })),
      color: '#3b82f6'
    }];

    const config: ChartConfig = {
      type: 'line',
      series,
      xAxis: {
        title: 'Date',
        type: 'datetime'
      },
      yAxis: {
        title: 'Productivity Score (%)',
        min: 0,
        max: 100,
        format: '0%'
      }
    };

    return this.renderChart(config, chartOptions);
  }

  /**
   * Generate category distribution pie chart
   */
  static async generateCategoryChart(
    categoryData: any[],
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 600,
      height: 400,
      format: 'png',
      theme: 'professional',
      title: 'Time Distribution by Category',
      showLegend: true,
      showGrid: false,
      ...options
    };

    const series: ChartSeries[] = [{
      name: 'Time Spent',
      type: 'bar', // Will be converted to pie in rendering
      data: categoryData.map(cat => ({
        x: cat.category,
        y: cat.totalTime,
        label: cat.category,
        color: this.getCategoryColor(cat.category)
      }))
    }];

    const config: ChartConfig = {
      type: 'pie',
      series
    };

    return this.renderChart(config, chartOptions);
  }

  /**
   * Generate time-of-day heatmap
   */
  static async generateHeatmapChart(
    heatmapData: any[],
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 800,
      height: 300,
      format: 'png',
      theme: 'professional',
      title: 'Productivity Heatmap - Time of Day',
      showLegend: true,
      showGrid: true,
      ...options
    };

    const series: ChartSeries[] = [{
      name: 'Productivity by Hour',
      data: heatmapData.map(point => ({
        x: point.hour,
        y: point.productivity,
        label: `${point.hour}:00`,
        metadata: { day: point.day }
      }))
    }];

    const config: ChartConfig = {
      type: 'heatmap',
      series,
      xAxis: {
        title: 'Hour of Day',
        type: 'category',
        labels: Array.from({length: 24}, (_, i) => `${i}:00`)
      },
      yAxis: {
        title: 'Day of Week',
        format: 'category'
      }
    };

    return this.renderChart(config, chartOptions);
  }

  /**
   * Generate comparison bar chart
   */
  static async generateComparisonChart(
    currentData: any[],
    previousData: any[],
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 700,
      height: 400,
      format: 'png',
      theme: 'professional',
      title: 'Period Comparison',
      showLegend: true,
      showGrid: true,
      ...options
    };

    const categories = [...new Set([
      ...currentData.map(d => d.category),
      ...previousData.map(d => d.category)
    ])];

    const series: ChartSeries[] = [
      {
        name: 'Current Period',
        type: 'bar',
        data: categories.map(cat => {
          const item = currentData.find(d => d.category === cat);
          return {
            x: cat,
            y: item?.totalTime || 0,
            label: cat
          };
        }),
        color: '#3b82f6'
      },
      {
        name: 'Previous Period',
        type: 'bar',
        data: categories.map(cat => {
          const item = previousData.find(d => d.category === cat);
          return {
            x: cat,
            y: item?.totalTime || 0,
            label: cat
          };
        }),
        color: '#6b7280'
      }
    ];

    const config: ChartConfig = {
      type: 'bar',
      series,
      xAxis: {
        title: 'Category',
        type: 'category'
      },
      yAxis: {
        title: 'Time (hours)',
        format: 'hours'
      }
    };

    return this.renderChart(config, chartOptions);
  }

  /**
   * Generate trend analysis chart with predictions
   */
  static async generateTrendChart(
    trendData: any[],
    predictions: any[] = [],
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 800,
      height: 400,
      format: 'png',
      theme: 'professional',
      title: 'Productivity Trend Analysis',
      showLegend: true,
      showGrid: true,
      ...options
    };

    const series: ChartSeries[] = [
      {
        name: 'Historical Data',
        type: 'line',
        data: trendData.map(point => ({
          x: point.date,
          y: point.value,
          label: this.formatDate(point.date)
        })),
        color: '#3b82f6'
      }
    ];

    if (predictions.length > 0) {
      series.push({
        name: 'Predictions',
        type: 'line',
        data: predictions.map(point => ({
          x: point.date,
          y: point.value,
          label: this.formatDate(point.date)
        })),
        color: '#6b7280',
        style: { strokeDasharray: '5,5' }
      });
    }

    const config: ChartConfig = {
      type: 'line',
      series,
      xAxis: {
        title: 'Date',
        type: 'datetime'
      },
      yAxis: {
        title: 'Productivity Score (%)',
        min: 0,
        max: 100,
        format: '0%'
      },
      annotations: predictions.length > 0 ? [{
        type: 'line',
        value: trendData[trendData.length - 1]?.date,
        label: 'Prediction Start',
        color: '#f59e0b'
      }] : undefined
    };

    return this.renderChart(config, chartOptions);
  }

  /**
   * Generate combined dashboard chart
   */
  static async generateDashboardChart(
    dashboardData: any,
    options: Partial<ChartExportOptions> = {}
  ): Promise<Buffer> {
    const chartOptions: ChartExportOptions = {
      width: 1200,
      height: 800,
      format: 'png',
      theme: 'professional',
      title: 'Productivity Dashboard Overview',
      showLegend: true,
      showGrid: true,
      ...options
    };

    // Create a multi-panel dashboard layout
    const series: ChartSeries[] = [
      {
        name: 'Daily Productivity',
        type: 'line',
        data: dashboardData.timeline || []
      },
      {
        name: 'Category Distribution',
        type: 'bar',
        data: dashboardData.categories || []
      }
    ];

    const config: ChartConfig = {
      type: 'timeline', // Special multi-chart type
      series
    };

    return this.renderChart(config, chartOptions);
  }

  // Private helper methods

  private static async renderChart(config: ChartConfig, options: ChartExportOptions): Promise<Buffer> {
    // In a real implementation, this would use a charting library like:
    // - Chart.js with canvas for PNG generation
    // - D3.js with SVG for vector graphics
    // - Puppeteer for PDF generation
    // - Or a server-side charting library like QuickChart

    const chartData = {
      type: config.type,
      width: options.width,
      height: options.height,
      theme: options.theme,
      title: options.title,
      subtitle: options.subtitle,
      backgroundColor: options.backgroundColor || this.getThemeBackground(options.theme),
      
      // Chart configuration
      data: {
        datasets: config.series.map(series => ({
          label: series.name,
          data: series.data,
          type: series.type || config.type,
          borderColor: series.color,
          backgroundColor: series.color ? this.addAlpha(series.color, 0.2) : undefined,
          ...series.style
        }))
      },
      
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: options.showLegend,
            position: 'top'
          }
        },
        scales: config.type !== 'pie' ? {
          x: {
            display: true,
            title: {
              display: !!config.xAxis?.title,
              text: config.xAxis?.title
            },
            grid: { display: options.showGrid }
          },
          y: {
            display: true,
            title: {
              display: !!config.yAxis?.title,
              text: config.yAxis?.title
            },
            min: config.yAxis?.min,
            max: config.yAxis?.max,
            grid: { display: options.showGrid }
          }
        } : {},
        
        // Format-specific options
        animation: options.format === 'svg' ? false : { duration: 0 },
        devicePixelRatio: options.format === 'png' ? 2 : 1
      }
    };

    // Generate image based on format
    switch (options.format) {
      case 'svg':
        return this.generateSVG(chartData);
      case 'pdf':
        return this.generatePDF(chartData);
      default:
        return this.generatePNG(chartData);
    }
  }

  private static async generatePNG(chartData: any): Promise<Buffer> {
    // Mock PNG generation - in real implementation, use Chart.js + Canvas
    const pngContent = {
      format: 'PNG',
      width: chartData.width,
      height: chartData.height,
      data: chartData,
      metadata: {
        title: chartData.title,
        generated: new Date().toISOString(),
        engine: 'Life Tracker Chart Exporter'
      }
    };

    // Return a base64 placeholder for now
    const placeholder = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return Buffer.from(placeholder, 'base64');
  }

  private static async generateSVG(chartData: any): Promise<Buffer> {
    // Mock SVG generation - in real implementation, use D3.js
    const svg = `
      <svg width="${chartData.width}" height="${chartData.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${chartData.backgroundColor}"/>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16">
          ${chartData.title || 'Chart Placeholder'}
        </text>
        <!-- Chart content would be generated here -->
      </svg>
    `;

    return Buffer.from(svg, 'utf-8');
  }

  private static async generatePDF(chartData: any): Promise<Buffer> {
    // Mock PDF generation - in real implementation, use PDFKit or Puppeteer
    const pdfContent = {
      format: 'PDF',
      pages: [{
        width: chartData.width,
        height: chartData.height,
        content: chartData
      }],
      metadata: {
        title: chartData.title,
        author: 'Life Tracker Pro',
        created: new Date()
      }
    };

    return Buffer.from(JSON.stringify(pdfContent), 'utf-8');
  }

  private static getThemeBackground(theme: string): string {
    const themes = {
      light: '#ffffff',
      dark: '#111827',
      professional: '#f8fafc'
    };
    return themes[theme as keyof typeof themes] || themes.professional;
  }

  private static getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      work: '#3b82f6',
      study: '#10b981',
      exercise: '#f59e0b',
      personal: '#8b5cf6',
      creative: '#ef4444',
      uncategorized: '#6b7280'
    };
    return colors[category.toLowerCase()] || colors.uncategorized;
  }

  private static addAlpha(color: string, alpha: number): string {
    // Convert hex color to rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  private static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Utility method to create chart configs from analytics data
   */
  static createChartConfig(
    type: ChartConfig['type'],
    data: any[],
    options: {
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
      xTitle?: string;
      yTitle?: string;
    }
  ): ChartConfig {
    const series: ChartSeries[] = [];

    if (options.seriesField) {
      // Multiple series
      const seriesGroups = this.groupBy(data, options.seriesField);
      Object.entries(seriesGroups).forEach(([seriesName, seriesData]) => {
        series.push({
          name: seriesName,
          data: (seriesData as any[]).map(item => ({
            x: item[options.xField],
            y: item[options.yField],
            label: String(item[options.xField])
          }))
        });
      });
    } else {
      // Single series
      series.push({
        name: options.yTitle || 'Data',
        data: data.map(item => ({
          x: item[options.xField],
          y: item[options.yField],
          label: String(item[options.xField])
        }))
      });
    }

    return {
      type,
      series,
      xAxis: {
        title: options.xTitle,
        type: typeof data[0]?.[options.xField] === 'number' ? 'numeric' : 'category'
      },
      yAxis: {
        title: options.yTitle,
        min: type === 'bar' || type === 'line' ? 0 : undefined
      }
    };
  }

  private static groupBy(array: any[], key: string): { [key: string]: any[] } {
    return array.reduce((groups, item) => {
      const group = item[key] || 'Other';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}
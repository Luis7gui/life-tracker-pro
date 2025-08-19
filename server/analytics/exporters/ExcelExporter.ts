/**
 * Life Tracker Pro - Excel Exporter
 * Generate comprehensive Excel reports with multiple sheets and charts
 */

export interface ExcelExportOptions {
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
  includeComparisons: boolean;
  format: 'xlsx' | 'csv';
  sheetNames?: {
    summary?: string;
    rawData?: string;
    charts?: string;
    insights?: string;
  };
}

export interface ExcelSheet {
  name: string;
  type: 'data' | 'chart' | 'summary' | 'pivot';
  headers: string[];
  rows: any[][];
  chartConfig?: {
    type: 'line' | 'bar' | 'pie' | 'scatter';
    title: string;
    xAxis: string;
    yAxis: string;
    dataRange: string;
  };
  styling?: {
    headerStyle?: any;
    dataStyle?: any;
    conditionalFormatting?: any[];
  };
}

export class ExcelExporter {

  /**
   * Generate comprehensive Excel workbook from analytics data
   */
  static async generateWorkbook(
    reportData: any,
    options: ExcelExportOptions
  ): Promise<Buffer> {
    const sheets: ExcelSheet[] = [];

    // Summary Sheet
    if (options.includeSummary) {
      sheets.push(this.createSummarySheet(reportData, options));
    }

    // Raw Data Sheet
    if (options.includeRawData) {
      sheets.push(this.createRawDataSheet(reportData, options));
    }

    // Charts Sheet
    if (options.includeCharts) {
      sheets.push(this.createChartsSheet(reportData, options));
    }

    // Insights Sheet
    sheets.push(this.createInsightsSheet(reportData, options));

    // Create workbook structure
    const workbook = {
      metadata: {
        title: reportData.title || 'Life Tracker Analytics Report',
        author: 'Life Tracker Pro',
        created: new Date(),
        subject: 'Productivity Analytics',
        keywords: ['productivity', 'analytics', 'tracking']
      },
      sheets,
      styles: this.getExcelStyles(),
      chartDefinitions: this.getChartDefinitions(reportData)
    };

    return this.createExcelBuffer(workbook, options.format);
  }

  /**
   * Generate weekly Excel report
   */
  static async generateWeeklyExcel(reportData: any): Promise<Buffer> {
    const options: ExcelExportOptions = {
      includeCharts: true,
      includeRawData: true,
      includeSummary: true,
      includeComparisons: false,
      format: 'xlsx',
      sheetNames: {
        summary: 'Weekly Summary',
        rawData: 'Session Data',
        charts: 'Charts & Visuals',
        insights: 'Insights'
      }
    };

    return this.generateWorkbook(reportData, options);
  }

  /**
   * Generate monthly Excel report
   */
  static async generateMonthlyExcel(reportData: any): Promise<Buffer> {
    const options: ExcelExportOptions = {
      includeCharts: true,
      includeRawData: true,
      includeSummary: true,
      includeComparisons: true,
      format: 'xlsx',
      sheetNames: {
        summary: 'Monthly Overview',
        rawData: 'All Sessions',
        charts: 'Trends & Charts',
        insights: 'Monthly Insights'
      }
    };

    return this.generateWorkbook(reportData, options);
  }

  /**
   * Generate CSV export for data analysis
   */
  static async generateCSV(reportData: any, dataType: 'sessions' | 'metrics' | 'categories' = 'sessions'): Promise<Buffer> {
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (dataType) {
      case 'sessions':
        headers = ['Date', 'Application', 'Category', 'Duration (min)', 'Productivity Score', 'Start Time', 'End Time'];
        rows = (reportData.sessions || []).map((session: any) => [
          this.formatDate(session.startTime),
          session.applicationName || '',
          session.category || 'Uncategorized',
          this.formatDuration(session.duration),
          session.productivityScore || 0,
          session.startTime,
          session.endTime
        ]);
        break;

      case 'metrics':
        headers = ['Date', 'Total Time', 'Productivity Score', 'Session Count', 'Top Category'];
        rows = (reportData.dailyMetrics || []).map((day: any) => [
          this.formatDate(day.date),
          this.formatDuration(day.totalTime),
          day.productivityScore,
          day.sessionCount,
          day.topCategory
        ]);
        break;

      case 'categories':
        headers = ['Category', 'Total Time', 'Session Count', 'Avg Session Length', 'Productivity Score', 'Trend'];
        rows = (reportData.categoryMetrics || []).map((cat: any) => [
          cat.category,
          this.formatDuration(cat.totalTime),
          cat.sessionCount,
          this.formatDuration(cat.avgSessionLength),
          cat.productivityScore,
          cat.trend
        ]);
        break;
    }

    const csvContent = this.arrayToCSV([headers, ...rows]);
    return Buffer.from(csvContent, 'utf-8');
  }

  // Private helper methods

  private static createSummarySheet(reportData: any, options: ExcelExportOptions): ExcelSheet {
    const sheetName = options.sheetNames?.summary || 'Summary';
    
    const summaryData = [
      ['Metric', 'Value', 'Change'],
      ['Total Time', this.formatDuration(reportData.summary?.totalTime || 0), ''],
      ['Total Sessions', reportData.summary?.totalSessions || 0, ''],
      ['Average Productivity', `${(reportData.summary?.productivityScore || 0).toFixed(1)}%`, ''],
      ['Most Productive Category', reportData.summary?.topCategory || 'N/A', ''],
      ['Consistency Score', `${(reportData.summary?.consistency || 0).toFixed(1)}%`, ''],
      [],
      ['Category Breakdown', '', ''],
      ['Category', 'Time', 'Sessions']
    ];

    // Add category data
    if (reportData.categoryMetrics) {
      reportData.categoryMetrics.forEach((cat: any) => {
        summaryData.push([
          cat.category,
          this.formatDuration(cat.totalTime),
          cat.sessionCount.toString()
        ]);
      });
    }

    return {
      name: sheetName,
      type: 'summary',
      headers: ['Metric', 'Value', 'Change'],
      rows: summaryData,
      styling: {
        headerStyle: {
          bold: true,
          backgroundColor: '#4f46e5',
          color: '#ffffff'
        },
        conditionalFormatting: [
          {
            range: 'B2:B6',
            rule: 'dataBar',
            color: '#10b981'
          }
        ]
      }
    };
  }

  private static createRawDataSheet(reportData: any, options: ExcelExportOptions): ExcelSheet {
    const sheetName = options.sheetNames?.rawData || 'Raw Data';
    
    const headers = [
      'Date',
      'Time',
      'Application',
      'Window Title',
      'Category',
      'Duration (min)',
      'Productivity Score',
      'Day of Week',
      'Hour'
    ];

    const rows = (reportData.sessions || []).map((session: any) => [
      this.formatDate(session.startTime),
      this.formatTime(session.startTime),
      session.applicationName || '',
      (session.windowTitle || '').substring(0, 50),
      session.category || 'Uncategorized',
      Math.round((session.duration || 0) / 60),
      session.productivityScore || 0,
      this.getDayOfWeek(session.startTime),
      new Date(session.startTime).getHours()
    ]);

    return {
      name: sheetName,
      type: 'data',
      headers,
      rows: [headers, ...rows],
      styling: {
        headerStyle: {
          bold: true,
          backgroundColor: '#1f2937',
          color: '#ffffff'
        }
      }
    };
  }

  private static createChartsSheet(reportData: any, options: ExcelExportOptions): ExcelSheet {
    const sheetName = options.sheetNames?.charts || 'Charts';
    
    // Prepare chart data
    const chartData = [
      ['Chart Type', 'Data Range', 'Description'],
      ['Productivity Timeline', 'A10:B40', 'Daily productivity progression'],
      ['Category Distribution', 'D10:E20', 'Time spent by category'],
      ['Time of Day Analysis', 'G10:H34', 'Productivity by hour'],
      [],
      ['Date', 'Productivity Score'],
    ];

    // Add daily productivity data
    if (reportData.dailyBreakdown) {
      reportData.dailyBreakdown.forEach((day: any) => {
        chartData.push([
          this.formatDate(day.date),
          day.productivityScore || 0
        ]);
      });
    }

    // Add category distribution data starting at column D
    const categoryStart = chartData.length + 2;
    chartData.push([], ['Category', 'Time (hours)']);
    
    if (reportData.categoryMetrics) {
      reportData.categoryMetrics.forEach((cat: any) => {
        chartData.push([
          cat.category,
          Math.round((cat.totalTime / 3600) * 10) / 10
        ]);
      });
    }

    return {
      name: sheetName,
      type: 'chart',
      headers: ['Date', 'Value'],
      rows: chartData,
      chartConfig: {
        type: 'line',
        title: 'Productivity Timeline',
        xAxis: 'Date',
        yAxis: 'Productivity Score',
        dataRange: 'A6:B36'
      }
    };
  }

  private static createInsightsSheet(reportData: any, options: ExcelExportOptions): ExcelSheet {
    const sheetName = options.sheetNames?.insights || 'Insights';
    
    const insightsData = [
      ['Type', 'Insight', 'Impact', 'Recommendation'],
      ['Header', 'Key Insights and Recommendations', '', ''],
      []
    ];

    // Add insights
    if (reportData.insights) {
      insightsData.push(['Insights', '', '', '']);
      reportData.insights.forEach((insight: string, index: number) => {
        insightsData.push([
          `Insight ${index + 1}`,
          insight,
          'Medium',
          'Review and implement suggested changes'
        ]);
      });
    }

    insightsData.push([]);

    // Add recommendations
    if (reportData.recommendations) {
      insightsData.push(['Recommendations', '', '', '']);
      reportData.recommendations.forEach((rec: string, index: number) => {
        insightsData.push([
          `Rec ${index + 1}`,
          rec,
          'High',
          'Implement this week'
        ]);
      });
    }

    return {
      name: sheetName,
      type: 'summary',
      headers: ['Type', 'Insight', 'Impact', 'Recommendation'],
      rows: insightsData,
      styling: {
        headerStyle: {
          bold: true,
          backgroundColor: '#059669',
          color: '#ffffff'
        }
      }
    };
  }

  private static getExcelStyles() {
    return {
      header: {
        font: { bold: true, color: '#ffffff' },
        fill: { bgColor: '#4f46e5' },
        alignment: { horizontal: 'center' }
      },
      data: {
        font: { size: 10 },
        alignment: { horizontal: 'left' }
      },
      number: {
        font: { size: 10 },
        alignment: { horizontal: 'right' },
        numberFormat: '#,##0.00'
      },
      percentage: {
        font: { size: 10 },
        alignment: { horizontal: 'right' },
        numberFormat: '0.0%'
      }
    };
  }

  private static getChartDefinitions(reportData: any) {
    return [
      {
        type: 'line',
        title: 'Productivity Timeline',
        position: { x: 1, y: 1, width: 8, height: 5 },
        dataRange: 'Charts!A6:B36',
        xAxis: { title: 'Date' },
        yAxis: { title: 'Productivity Score' }
      },
      {
        type: 'pie',
        title: 'Category Distribution',
        position: { x: 10, y: 1, width: 6, height: 5 },
        dataRange: 'Charts!D6:E16',
        showLegend: true
      }
    ];
  }

  private static async createExcelBuffer(workbook: any, format: 'xlsx' | 'csv'): Promise<Buffer> {
    // In a real implementation, this would use a library like ExcelJS or SheetJS
    // For now, we'll create a structured representation
    
    if (format === 'csv') {
      // For CSV, just export the first data sheet
      const dataSheet = workbook.sheets.find((s: any) => s.type === 'data');
      if (dataSheet) {
        const csvContent = this.arrayToCSV(dataSheet.rows);
        return Buffer.from(csvContent, 'utf-8');
      }
    }

    // For XLSX, create a JSON representation that could be processed by ExcelJS
    const excelData = {
      metadata: workbook.metadata,
      sheets: workbook.sheets.map((sheet: any) => ({
        name: sheet.name,
        data: sheet.rows,
        headers: sheet.headers,
        styling: sheet.styling,
        charts: sheet.chartConfig ? [sheet.chartConfig] : []
      })),
      charts: workbook.chartDefinitions
    };

    return Buffer.from(JSON.stringify(excelData, null, 2), 'utf-8');
  }

  private static arrayToCSV(data: any[][]): string {
    return data.map(row => 
      row.map(cell => {
        const str = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
  }

  private static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private static formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private static getDayOfWeek(date: string | Date): string {
    const d = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }
}
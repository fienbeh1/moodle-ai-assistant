// web-panel/js/stats.js
// StatsManager — Chart.js visualizations for training statistics

/**
 * Handles training statistics visualization using Chart.js.
 * Responsibilities: rendering a doughnut chart of positive/negative/unrated
 * AI responses, rendering a bar chart of session activity over time, and
 * fetching updated stats from the API to keep charts current.
 */
export class StatsManager {
  /**
   * @param {string} apiBaseUrl
   * @param {string} apiKey
   */
  constructor(apiBaseUrl, apiKey) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.ratingChartInstance = null;
    this.activityChartInstance = null;
  }

  /**
   * Render a doughnut chart showing positive/negative/uncategorized ratings
   * @param {{ positiveRatings: number, negativeRatings: number, totalResponses: number }} data
   */
  renderRatingChart(data) {
    const canvas = document.getElementById('rating-chart');
    if (!canvas || !window.Chart) return;

    const rated = data.positiveRatings + data.negativeRatings;
    const unrated = Math.max(0, data.totalResponses - rated);

    const chartData = {
      labels: ['👍 Positivas', '👎 Negativas', '⬜ Sin calificar'],
      datasets: [{
        data: [data.positiveRatings, data.negativeRatings, unrated],
        backgroundColor: [
          'rgba(0, 204, 68, 0.8)',
          'rgba(248, 81, 73, 0.8)',
          'rgba(74, 85, 104, 0.5)',
        ],
        borderColor: [
          '#00cc44',
          '#f85149',
          '#2a3550',
        ],
        borderWidth: 1,
      }],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#8892b0',
            font: { size: 10 },
            boxWidth: 10,
            padding: 8,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
              return ` ${context.label}: ${context.parsed} (${pct}%)`;
            },
          },
        },
      },
    };

    if (this.ratingChartInstance) {
      // Update existing chart
      this.ratingChartInstance.data = chartData;
      this.ratingChartInstance.update();
    } else {
      // Create new chart
      this.ratingChartInstance = new window.Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: chartOptions,
      });
    }
  }

  /**
   * Render a bar chart showing sessions per day
   * @param {Array<{date: string, count: number}>} data
   */
  renderActivityChart(data) {
    const canvas = document.getElementById('activity-chart');
    if (!canvas || !window.Chart) return;

    const chartData = {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Sesiones',
        data: data.map(d => d.count),
        backgroundColor: 'rgba(26, 115, 232, 0.7)',
        borderColor: '#1a73e8',
        borderWidth: 1,
        borderRadius: 4,
      }],
    };

    const chartOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { color: '#8892b0', font: { size: 10 } },
          grid: { color: '#2a3550' },
        },
        y: {
          ticks: { color: '#8892b0', font: { size: 10 } },
          grid: { color: '#2a3550' },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { display: false },
      },
    };

    if (this.activityChartInstance) {
      this.activityChartInstance.data = chartData;
      this.activityChartInstance.update();
    } else {
      this.activityChartInstance = new window.Chart(canvas, {
        type: 'bar',
        data: chartData,
        options: chartOptions,
      });
    }
  }

  /**
   * Fetch all stats and update all charts
   */
  async updateDashboard() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/training/stats`, {
        headers: { 'X-API-KEY': this.apiKey },
      });

      if (!response.ok) return;

      const stats = await response.json();
      this.renderRatingChart(stats);

    } catch {
      // Stats not available — charts remain empty
    }
  }
}

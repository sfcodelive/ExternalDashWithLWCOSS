import LightningElementWithSLDS from '../../../lib/lightningElementWithSLDS.js';
import { api, track } from 'lwc';

export default class Chart extends LightningElementWithSLDS {
  @api sobject = '';
  @api socket;
  @api chartType = 'doughnut';

  @track events = 0;
  @track socketInitialized = false;
  @track chartInitialized = false;

  chart;

  fieldData = {};

  connectedCallback() {}

  async renderedCallback() {
    if (!this.socketInitialized && this.socket) {
      this.initializeSocket();
    }
    if (!this.chartInitialized && this.socketInitialized) {
      await this.initializeChart();
    }
  }

  initializeSocket() {
    console.log('binding chart to cdc event');
    this.socket.on('cdc', this.onMessage.bind(this));
    this.socketInitialized = true;
  }

  async initializeChart() {
    console.log('initializing chart');
    await require('chart.js');
    const ctx = this.template.querySelector('canvas.donut').getContext('2d');
    this.chart = new window.Chart(ctx, this.getInitialChartConfig());
    this.chartInitialized = true;
  }

  onMessage(data) {
    const { changeType, entityName } = data.ChangeEventHeader;

    console.log(`chart cdc event ${changeType}:${entityName}`);

    // check to make sure the change event is for the configured sobject
    if (this.sobject.toLowerCase() !== entityName.toLowerCase()) {
      return;
    }

    const fields = Object.keys(data).filter(k => k !== 'ChangeEventHeader');

    for (const f of fields) {
      console.log(`checking for field ${f}`);
      const idx = this.chart.data.labels.indexOf(f);
      if (idx === -1) {
        this.chart.data.labels.push(f);
        this.chart.data.datasets[0].data.push(1);
      } else {
        this.chart.data.datasets[0].data[idx]++;
      }
      this.chart.update();
    }

    console.log(this.fieldData);

    this.events++;
  }

  getInitialChartConfig() {
    return {
      type: this.chartType,
      data: {
        datasets: [
          {
            data: [],
            backgroundColor: [
              '#003f5c',
              '#2f4b7c',
              '#665191',
              '#a05195',
              '#d45087',
              '#f95d6a',
              '#ff7c43',
              '#ffa600'
            ],
            label: `${this.sobject} Field Updated`
          }
        ],
        labels: []
      },
      options: {
        title: {
          display: true,
          text: `${this.sobject} Field Updates`,
          fontSize: 24
        },
        responsive: true,
        legend: {
          position: 'bottom'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    };
  }
}

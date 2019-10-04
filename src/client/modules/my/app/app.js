import LightningElementWithSLDS from '../../../lib/lightningElementWithSLDS.js';
import { track } from 'lwc';

export default class App extends LightningElementWithSLDS {
  @track socket;
  @track cdcEvents = 0;
  @track socketReady = false;

  connectedCallback() {
    this.openSocket();
  }

  disconnectedCallback() {
    this.closeSocket();
  }

  async openSocket() {
    const io = await require('socket.io-client');
    this.socket = io('http://0.0.0.0:3002');
    this.socket.on('connect', () => {
      console.log('connected!');
      this.socketReady = true;

      this.socket.on('cdc', data => {
        console.log('cdc event', data);
        this.cdcEvents++;
      });
    });
  }

  async closeSocket() {
    this.socket.close();
    this.socket = null;
  }
}

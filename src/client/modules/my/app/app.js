import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    socket;

    connectedCallback() {
        this.initializeSocketIO();
    }

    async initializeSocketIO() {
        const io          = await require('socket.io-client');
              this.socket = io('http://0.0.0.0:3002');
        this.socket.on('connect', socket => {
            console.log('connected!');

            this.socket.on('newCaseInfo', data => {
                console.log(data);
            });
        });
    }
}

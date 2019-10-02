import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track socket;
    @track cdcEvents = 0;
    @track lastEvent;

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

            this.socket.on('newCaseInfo', data => {
                console.log(data);
            });

            this.socket.on('cdc', data => {
                console.log('cdc event', data);
                const { changeType, entityName } = data.ChangeEventHeader;

                this.lastEvent = `${entityName}:${changeType}`;

                this.cdcEvents++;
            });
        });
    }

    async closeSocket() {
        this.socket.close();
        this.socket = null;
    }
}

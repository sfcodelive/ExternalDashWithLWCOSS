import { LightningElement, track } from 'lwc';
import io from 'socket.io-client';

export default class App extends LightningElement {
    socket;

    connectedCallback() {
        this.initializeSocketIO();
    }

    initializeSocketIO() {
        this.socket = io('http://0.0.0.0:3002');
        console.log('foo');
        this.socket.on('connect', socket => {
            console.log('connected!');

            this.socket.on('newCaseInfo', data => {
                console.log(data);
            });
        });
    }
}

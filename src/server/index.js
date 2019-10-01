/*eslint-env node*/
require('dotenv').config();

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jsforce = require('jsforce');

const PORT = 3002;
const CHANNEL = '/data/ChangeEvents';

const { SF_USERNAME, SF_PASSWORD, SF_TOKEN, SF_LOGIN_URL } = process.env;

if (!(SF_USERNAME && SF_PASSWORD && SF_TOKEN && SF_LOGIN_URL)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

const conn = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL
});

conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, err => {
    if (err) {
        console.error(err);
        process.exit(-1);
    }

    console.log('subscribing to channel: ' + CHANNEL);
    conn.streaming.topic(CHANNEL).subscribe(data => {
        const { event, payload } = data;
        const { entityName, changeType } = payload.ChangeEventHeader;
        console.log(
            `cdc message received [${event.replayId}]: ${entityName}:${changeType}`
        );
        io.emit(`cdc`, payload);
    });

    conn.streaming.topic('CaseUpdates').subscribe(function(message) {
        console.log('Event Type : ' + message.event.type);
        console.log('Event Created : ' + message.event.createdDate);
        console.log('Object Id : ' + message.sobject.Id);
        io.emit('newCaseInfo', message);
    });
});

// log out when a client connects
io.on('connection', socket => {
    console.log(`client connected: ${socket.id}`);
});

server.listen(PORT, () => console.log(`Running server on port ${PORT}`));

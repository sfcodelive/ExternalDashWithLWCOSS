const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(3002, () => console.log('running on 3001'));

/*
 * Salesforce org connection.
 * parses the .env file for user/pass/security token and generates a connection object.
 */
const jsforce = require('jsforce');
require('dotenv').config();

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
    conn.streaming.topic('CaseUpdates').subscribe(function(message) {
        console.log('Event Type : ' + message.event.type);
        console.log('Event Created : ' + message.event.createdDate);
        console.log('Object Id : ' + message.sobject.Id);
        io.emit('newCaseInfo', message);
    });
});

// eslint-disable-next-line no-undef
//module.exports = app => {};

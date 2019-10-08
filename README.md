# ExternalDashboardWithLWCOSS

Welcome to Codetober!

Last week Kevin O'Hara and I kicked off #Codetober, a month long series of weekly #codeLive events. Kevin's a Javascript / Node development expert and I thought it'd be fun to work with him on building something with Lightning Web Components OSS. Yes, you read that right. If you've not heard, Lightning Web Components are open source! You can find out all about them here at https://lwc.dev (https://lwc.dev/) and you can catch the recording of the stream here (https://developer.salesforce.com/event/Dashboard-w-lwc). Over the course of the hour we accomplished quite a lot, but let's eat our desert first, and look at our end-product.
![Image: Overview][https://github.com/sfcodelive/externaldashwithlwcoss/blob/master/images/overviewimage.png]
Our app displays a dashboard that displays the number, and type of Change Data Capture events that have occurred. For our example, we just recorded the field(s) changed, and the number of CDC events.

Before we started

Kevin and I wanted to focus on building LWC OSS components, not on the underlying plumbing, so before we started our stream we bootstrapped a basic Node app using Express. While we could have spun that up easily enough by hand, LWC OSS comes with a very handy generator tool called create-lwc-app. We started our project with this:

npx create-lwc-app ExternalDashboardWithLWCOSS

This tool asks us to answer a few questions, before generating a package.json file for us. Out of the box, you can simply cd into your new proejct directory and use npm run watch to launch the application. However, we went ahead and added a couple of other npm packages we wanted to use. Namely:

- JSForce - Javascript library for interacting with Salesforce orgs
- Socket.io (http://socket.io/) - Javascript library for publishing and subscribing to websockets
- SalesforceLightning Design System - to make our app pretty
- Dotenv - Allows us to keep our Salesforce Org credentials in a .env file that we can keep out of git.

How it all fits together

In the beginning was the Salesforce User. They made a change to a contact. That triggered the Change Data Capture (CDC) event we configured to fire. Our dashboard server app, subscribed to the CDC Events, receives a notification indicating what object, and fields changed. This event is re-broadcast via websockets to all dashboard clients. The dashboard client displays (as seen above) two instances of a Donut chart. Each chart is listening on the websocket channel for updates. When they receive a message they adjust the data, and re-draw the chart (with pretty animations). Here's an Architecture overveiw diagram:
[Image: image.png]
So, about those LWC OSS components

Both charts are drawn by the same component, we've just put two instances on the page. To make our component re-usable, we decorated certain properties with @api. This decorator functions just like it's on-platform sibling, and allows you to declaratively pass information into the component when it's put on the page. As you can see in the code below, there are two my-chart components defined, and the sobject variable differs. This is a particularly powerful aspect to component based development, because it allows developers to re-use logic while declaring in markup the details needed for the component to function in this instance.

<div class="center">
    <template if:true={socketReady}>
      <div class="charts">
        <!-- Add more charts here -->
        <div class="slds-grid slds-gutters slds-wrap">
          <div class="slds-col">
            <my-chart sobject="Case" socket={socket}></my-chart>
          </div>
          <div class="slds-col">
            <my-chart sobject="Contact" socket={socket}></my-chart>
          </div>
        </div>
      </div>
    </template>
  </div>

Chart.js

This is where the logic of our chart-drawing component lies. But it's also where things get a bit more complex. With components, it's crucial to keep their lifecycle in mind as you're developing. In our case we chose to use the renderedCallback() (https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.create_lifecycle_hooks_rendered) method. This callback method is unique to LightningWebComponents, and is triggered after the component has rendered on the page. Let's look at the code:

async renderedCallback() {
if (!this.socketInitialized && this.socket) {
this.initializeSocket();
}
if (!this.chartInitialized && this.socketInitialized) {
await this.initializeChart();
}
}

This gives us a good launching point to trigger the setup of our socket's listeners, and our chart. We only want to do this once, however, so we use @track properties as semaphores. Because they're reactive, the component will re-render when their state changes, and will thus re-execute the renderedCallback() method.

Our dashboard server app is re-broadcasting the CDC Events to the clients via websockets. Whenever a message is received by the client's websocket connection, it executes the onMessage() method, where the bulk of our component logic lives. There's a lot happening here, but most of it is self-explanatory. So I want to draw your attention to a couple of bits:

const { changeType, entityName } = data.ChangeEventHeader;

This first line is a bit of EMACSCRIPT 5 magic called destructuring. It allows us to define two constants: changeType and entityName as defined from data.ChangeEventHeader object. It allows us to access properties and child objects of the data.ChangeEventHeader object without always referencing the full object and key path like this: data.ChangeEventHeader.changeType which makes for easier to read javascript.

This line

const fields = Object.keys(data).filter(k => k !== 'ChangeEventHeader');

makes use of another EMACSRIPT 5 feature called arrow functions. Arrow functions have a concise and simple syntax but their real power, and their gotcha, is that they execute with the calling code's understanding of this. In our case, we're establishing a constant, fields defined as the filtered keys of the data object. Specifically, we're filtering out the 'ChangeEventHeader' key, as we've already destructured what we need out of it.

The rest of our method simply loops over the fields and either adds that field to the chart's dataset, or increments the count of that field's changes.

chart.html

The bulk of our chart template is standard lightning design system markup for the card the chart is based in. However, Chart.js (https://chartjs.org/) uses the html canvas element for drawing charts. This poses an interesting challenge, since LWC generally wants to be in charge of the dom. In order to cede control of the canvas element to chart.js, we need to annotate our canvas tag with lwc:dom=”manual”. With that in place core of our chart component's template is simply this:

<canvas class="donut" lwc:dom="manual"></canvas>

About the Salesforce Lightning Design System

We've used the Lightning Design System throughout our dashboard app to provide a common look and feel. However, the way included it, may not be entirely intuitive. In order to incorporate the SLDS in one location, and yet allow all of our components to access it's resources, we created a new module for our components to extend. Standard lightning web components extend LightningElement. In our case, we created a class called LightningElementSLDS and defined it like this:

export default class LightningElementWithSLDS extends LightningElement {
constructor() {
super();
const path = '/resources/assets/styles/salesforce-lightning-design-system.min.css'
const styles = document.createElement('link');
styles.href = path;
styles.rel = 'stylesheet';
this.template.appendChild(styles);
}
}

While verbose, this code effectively constructs a stylesheet link and injects it into the template's dom. Establishing this as a new class, allows all our other components to inherit not only the feature set built into LightningElement, but also the Salesforce Lightning Design System. Using our new class has two steps:

1. Import the class, providing the path to the file.
2. Ensure that the class we're defining extends LightningElementWithSLDS instead of LightningElement.

import LightningElementWithSLDS from '../../../lib/lightningElementWithSLDS.js';
import { api, track } from 'lwc';

export default class Chart extends LightningElementWithSLDS { ... }

More from #codetober

So thats how we built a dashboard with LWC OSS that displays updates in near-real-time with CDC events and styled with SLDS. The day after our stream, Trailhead released a series of three projects on building with Lightning Web Components OSS. They're absolutely fantastic, and you should head over to this trail, to learn more! (https://trailhead.salesforce.com/en/content/learn/trails/build-apps-lightning-web-components-open-source)

Remember #codetober is a month of weekly #CodeLive streams. This week, we'll be joined by Cynthia Thomas, code ninja, on building data dependent apps. We'll be working on building out a use case to rapidly clone records and allow users to edit them en-mass. Register and join us here! (https://developer.salesforce.com/event/Ref-data-dc) and seethe rest of #codetober's events here (https://trailhead.salesforce.com/calendar?types=webinar&regions=north_america&months=october&programs=developers).

## How to start?

This code relies on credentials for your Salesforce org being present in file called .env in the project root.

The contents of the .env file should be modeled after this:

```shell
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=YOUR-USERNAME-HERE
SF_PASSWORD=YOUR-PASSWORD-HERE
SF_TOKEN=YOUR-SECURITY-TOKEN-HERE
```

Once you've created the .evn file feel free to fire up the dashbaord server using `yarn watch` (or `npm run watch`, if you set up the project with `npm`). This will start the project with a local development server.

The source files are located in the [`src`](./src) folder. All web components are within the [`src/client/modules`](./src/modules) folder. The folder hierarchy also represents the naming structure of the web components. The entry file for the custom Express configuration can be found in the ['src/server'](./src/server) folder.

## Setting up your Salesforce org

The dashboard relies on Change Data Capture (CDC) events for real-time updates. You'll need to enable CDC events for any and all objects you wish to enable for your dashboard. If, for instance, you wanted to enable a chart component for Opportunity, You'd need to enable CDC for Opportunities. To enable CDC Events:

1. Login to your Org, and navigate to Setup
2. Using setup search bar in the upper left, search for Change Data Capture
3. Click on Change Data Capture.
4. Select the objects you'd like CDC events to fire for, and use the central arrow buttons to place those objects in the selected entities column on the right.
5. Click save.

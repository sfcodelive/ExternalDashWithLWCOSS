import { LightningElement } from "lwc";

export default class LightningElementSLDS extends LightningElement {
  constructor() {
    super();
    const path = '/resources/assets/styles/salesforce-lightning-design-system.min.css'
    const styles = document.createElement('link');
    styles.href = path;
    styles.rel = 'stylesheet';
    this.template.appendChild(styles);
  }
}
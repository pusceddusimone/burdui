import {ViewElement} from "./viewElement";
import {WindowGroup} from "../views/windowGroup";

class WindowGroupElement extends ViewElement {
    constructor() {
        super();
        this.buiView = new WindowGroup();
    }
    connectedCallback() {
        //Whenever a child is added to the html, pass it to the window group
        super.connectedCallback((child) => {
            this.buiView.formatChildrenToWindowChildren(child);
            this.buiView.startWindowGroupApplication();
        });
    }



}

window.customElements.define('bui-windowgroup', WindowGroupElement);

export {WindowGroupElement};

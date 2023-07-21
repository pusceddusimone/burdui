import {ViewElement} from "./viewElement";
import {WindowGroup} from "../views/windowGroup";

class WindowGroupElement extends ViewElement {
    constructor() {
        super();
        this.buiView = new WindowGroup();
        let root = new burdui.View;
        root.setBounds(new burdui.Bounds(0,0,20,20));
        root.setBackgroundColor("red");
        this.buiView.setApp(root, 0);
    }
    connectedCallback() {
        //Whenever a child is added to the html, pass it to the window group
        super.connectedCallback((child) => {
            this.buiView.formatChildrenToWindowChildren(child);
        });
    }



}

window.customElements.define('bui-windowgroup', WindowGroupElement);

export {WindowGroupElement};

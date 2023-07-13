import {ViewElement} from "./viewElement";
import {WindowGroupManager} from "../views/windowGroupManager";

class WindowGroupManagerElement extends ViewElement {
    constructor() {
        super();
        this.buiView = new WindowGroupManager();
    }
    connectedCallback() {
        super.connectedCallback();
    }



}

window.customElements.define('bui-windowgroupmanager', WindowGroupManagerElement);

export {WindowGroupManagerElement};
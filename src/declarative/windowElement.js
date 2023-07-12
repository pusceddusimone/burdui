import {ViewElement} from "./viewElement";
import {Window} from "../views/window";

class WindowElement extends ViewElement {
    constructor() {
        super();
        this.buiView = new Window();
    }
    connectedCallback() {
        super.connectedCallback();
    }



}

window.customElements.define('bui-window', WindowElement);

export {WindowElement};
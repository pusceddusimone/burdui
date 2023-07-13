import {ViewElement} from "./viewElement";
import {WindowGroupManager} from "../views/windowGroupManager";

class WindowGroupManagerElement extends ViewElement {
    constructor() {
        super();
        this.buiView = new WindowGroupManager();
    }
    connectedCallback() {
        super.connectedCallback((child) => {
            this.onWindowGroupAdd(child);
        });
    }


    onWindowGroupAdd(child) {
        if(child.constructor.name !== "WindowGroup")
            return;
        let canvas = document.createElement("canvas");
        canvas.width = child.bounds.w+10;
        canvas.height = child.bounds.h+10;
        canvas.style.left = child.bounds.x+"px";
        canvas.style.top = child.bounds.y+"px";
        canvas.style.position="absolute";
        canvas.style.zIndex = "20";
        canvas.style.borderStyle = "1px solid black";
        canvas.style.borderWidth = child.bounds.lineWidth+"px";
        canvas.style.borderColor = child.bounds.borderColor;
        document.getElementsByClassName("canvasContainer")[0].insertBefore(canvas, document.getElementById('screen').children[0]);
        child.setWindowCanvas(canvas);
    }



}

window.customElements.define('bui-windowgroupmanager', WindowGroupManagerElement);

export {WindowGroupManagerElement};
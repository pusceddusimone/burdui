import {ViewElement} from "./viewElement";
import {WindowGroupManager} from "../views/windowGroupManager";

class WindowGroupManagerElement extends ViewElement {
    constructor() {
        super();
        this.currentId = 0;
        this.buiView = new WindowGroupManager();
    }
    connectedCallback() {
        super.connectedCallback((child) => {
            this.onWindowGroupAdd(child);
            this.buiView.formatWindowGroup(child);
        });
    }


    onWindowGroupAdd(child) {
        if(child.constructor.name !== "WindowGroup")
            return;
        child.setId(this.currentId++);
        child.setCallbackRemoved((child) => {this.callBackRemovedWindowGroup(child)});
        let canvas = document.createElement("canvas");
        canvas.width = child.bounds.w;
        canvas.height = child.bounds.h;
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

    callBackRemovedWindowGroup(child){
        this.buiView.callBackRemovedWindowGroup(child.getId());
    }



}

window.customElements.define('bui-windowgroupmanager', WindowGroupManagerElement);

export {WindowGroupManagerElement};
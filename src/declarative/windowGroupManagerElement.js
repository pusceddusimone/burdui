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
            this.onWindowGroupAdd(child); //WindowGroup has been added
            this.buiView.formatWindowGroup(child);
        });
    }


    /**
     * Creates a canvas for the newly added windowgroup
     * @param child windowgroup just added
     */
    onWindowGroupAdd(child) {
        if(child.constructor.name !== "WindowGroup")
            return;
        let childId = this.currentId++;
        child.setId(childId);
        child.setCallbackRemoved((child) => {this.callBackRemovedWindowGroup(child)});
        child.setCallbackReduced((child) => {this.callBackReduceWindowGroup(child)});
        child.setParentBounds(this.buiView.bounds);
        let canvas = document.createElement("canvas");
        let canvasContainer = document.createElement("div");
        canvasContainer.style.width = child.bounds.w+"px";
        canvasContainer.style.height = child.bounds.h+"px";
        canvasContainer.style.left = child.bounds.x+"px";
        canvasContainer.style.top = child.bounds.y+"px";
        canvasContainer.style.position="absolute";
        canvasContainer.style.zIndex = "10";

        canvas.width = child.bounds.w;
        canvas.height = child.bounds.h;
        canvas.style.background = "transparent";

        canvas.style.borderStyle = "1px solid black";
        canvas.style.borderWidth = child.bounds.lineWidth+"px";
        canvas.style.borderColor = child.bounds.borderColor;
        canvasContainer.appendChild(canvas);
        child.setCanvasContainer(canvasContainer);
        this.buiView.addWindowGroupCanvas(canvasContainer, childId);
        document.getElementsByClassName("canvasContainer")[0].insertBefore(canvasContainer, document.getElementById('screen').children[0]);
        this.buiView.setApp("input-1.html", canvas);
        child.setWindowCanvas(canvas);
    }

    /**
     * Callback called when a windowgroup has been closed
     * @param child the windowgroup
     */
    callBackRemovedWindowGroup(child){
        this.buiView.callBackRemovedWindowGroup(child.getId());
    }

    /**
     * Callback called when a windowgroup has been reduced to icon
     * @param child the windowgroup
     */
    callBackReduceWindowGroup(child){
        this.buiView.callBackReduceWindowGroup(child.getId());
    }



}

window.customElements.define('bui-windowgroupmanager', WindowGroupManagerElement);

export {WindowGroupManagerElement};
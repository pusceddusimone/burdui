import {View} from "./view";
import {Bounds} from "../layout/bounds";
import {Border} from "../layout/border";
import {Background} from "../layout/background";
import {Window} from "./window";
import {Button} from "./button";

/**
 * Constructor for the WindowGroup
 * @param bounds bounds of the window group
 * @constructor
 */
function WindowGroup(bounds){
    View.call(this);
    this.bounds = bounds || new Bounds();
    this.border = new Border();
    this.background = new Background();
    this.windowChildren = [];
    this.selectedWindow = 0;
    this.windowMap = [];
    this.canvas = null;
    this.callBackRemoved = null;
    this.callBackReduced = null;
    this.canvasMap = {};
    this.canvasContainer = null;
    this.tabsToAdd = [];
    this.visibleCanvas = null;
    this.appsToStart = [];
}


WindowGroup.prototype = Object.assign( Object.create( View.prototype ), {

    constructor: WindowGroup,

    setBounds: function(bounds){
        this.bounds = bounds;
        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
        this.background.setBounds(new Bounds(
            this.border.lineWidth/2,
            this.border.lineWidth/2,
            this.bounds.w,
            this.bounds.h));
            for(let canvasKey of Object.keys(this.canvasMap)){
                this.canvasMap[canvasKey].width = this.bounds.w;
                this.canvasMap[canvasKey].height = this.bounds.h-40;
            }
        this.updateBounds();
        return this;
    },

    getBounds : function(){
        return this.bounds;
    },

    /**
     * Sets the callback called when we click the close button
     * @param callback function to call
     */
    setCallbackRemoved : function (callback){
      this.callBackRemoved = callback;
    },

    /**
     * Sets the callback called when we click the reduce to icon button
     * @param callback function to call
     */
    setCallbackReduced : function (callback){
        this.callBackReduced = callback;
    },

    /**
     * Function to format the initial childs of the windowGroup
     * @param child child of the windowGroup (must be window to be considered)
     */
    formatChildrenToWindowChildren(child){
        if(child.constructor.name === "Window"){
            let firstAvailableIndex = this.findFirstAvailableIndexForWindow();
            child.setId(firstAvailableIndex);
            this.windowMap.push(firstAvailableIndex);
            this.windowChildren.push(child);
        }
    },
    /**
     * Finds the first available index for a newly created window
     * @returns {number} the index for the window
     */
    findFirstAvailableIndexForWindow: function(){
        let windowIndex = 0;
        while (typeof(this.windowMap[windowIndex]) !== "undefined") {
            windowIndex++;
        }
        return windowIndex;
    },

    /**
     * Override to add a child
     * @param child child to add
     * @returns {WindowGroup}
     */
    addChild: function(child){
        View.prototype.addChild.call(this, child);

        // not optimized, we can speed-up setting the bounds of the last child.
        this.updateBounds();

        return this;
    },


    updateBounds: function(){
        let next = 0;
        for(let i in this.children) {
            let c = this.children[i];
            switch(this.style){
                case "vertical":
                    c.setBounds(new Bounds(0, next, this.bounds.w, c.bounds.h));
                    next += c.bounds.h + this.padding;
                    break;

                case "horizontal":
                    c.setBounds(new Bounds(next, 0, c.bounds.w, this.bounds.h));
                    next += c.bounds.w + this.padding;
                    break;
            }
        }
    },

    /**
     * Function to paint the children of the windowGroup
     * @param g the canvas
     * @param b the root of the windowgroup
     */
    paintChildren: function (g, b){
        let r = b || this.bounds;
        for(let c of this.children){
            if(c.constructor.name === "Window" && this.selectedWindow !== c.getId())
                continue;
            let intersection = c.bounds.intersection(r);
            if(intersection.w > 0 && intersection.h > 0){
                g.save();
                g.translate(c.bounds.x, c.bounds.y);
                intersection.setX(intersection.x - c.bounds.x);
                intersection.setY(intersection.y - c.bounds.y);
                c.paint(g, intersection);
                g.restore();
            }
        }
    },

    /**
     * Override to reset the children which are not windows
     */
    resetChildren : function (){
        let windows = this.children.filter(c => c.constructor.name === "Window");
        this.removeChildren();
        for(let window of windows)
            this.addChild(window);
    },

    /**
     * Function to switch to a new window
     * @param id the id of the window
     */
    changeWindow: function(id){
        if(id == null)
            return;
        if(this.visibleCanvas){
            let visibleCanvas = this.canvasMap[this.visibleCanvas];
            if(visibleCanvas){
                this.visibleCanvas = null;
                visibleCanvas.remove();
            }
        }
        this.selectedWindow = id;
        this.resetWindow(this.canvas);
        this.paint();
    },

    /**
     * Sets the canvas for this windowgroup
     * @param canvas
     */
    setWindowCanvas : function(canvas){
        this.canvas = canvas;
        const app = new burdui.App(canvas, this);
        app.start();
        for(let newApp of this.appsToStart){
            newApp.start();
        }
    },


    /**
     * Function to clean the window, used when we switch to a new one
     * @param screen screen to clean
     */
    resetWindow: function (screen){
        let context = screen.getContext('2d');
        context.clearRect(0,0,context.canvas.width-this.border.lineWidth,context.canvas.height-this.border.lineWidth);
    },


    /**
     * Adds a new page when we click to the '+' button
     */
    addPage: function(){
        if(!this.canvas)
            return;
        let newIndex = this.findFirstAvailableIndexForWindow();
        let newWindow = new Window();
        newWindow.setBounds(new Bounds(0,0,this.bounds.w,this.bounds.h-50));
        newWindow.setId(newIndex);
        this.windowChildren.push(newWindow);
        this.windowChildren.push();
        this.addChild(newWindow);
        this.windowMap.push(newIndex);
        let screen = this.canvas.getContext('2d');
        let root = document.getElementById('allWindows').buiView;
        this.paint(screen, root);
        this.changeWindow(newIndex);
    },



    setApp: function(app, tabNumber){
        let windowCanvas = document.createElement("canvas");
        if(!this.windowMap.includes(tabNumber)){
            this.tabsToAdd.push(tabNumber);
        }

        windowCanvas.style.position = "absolute";
        windowCanvas.style.right = "0";
        windowCanvas.style.top = "40px";
        windowCanvas.width = this.bounds.w;
        windowCanvas.height = this.bounds.h;
        this.canvasMap[tabNumber] = windowCanvas;
        let newApp = new burdui.App(windowCanvas,app);
        this.appsToStart.push(newApp);
        //newApp.start();
    },

    setCanvasContainer : function(canvasContainer){
        this.canvasContainer = canvasContainer;
    },

    /**
     * Removes a page when we click on the corresponding 'X' button
     * @param id id of the window to remove
     */
    removePage: function(id){
        if(!this.canvas)
            return;
        let newWindows = this.windowChildren.filter(window => window.getId() !== id);
        let newSelected = this.windowMap.indexOf(id);
        this.selectedWindow = this.windowMap[newSelected-1] ? this.windowMap[newSelected-1] : 0;
        let newMap = this.windowMap.filter(mapId => mapId !== id);
        this.windowChildren = newWindows;
        this.windowMap = newMap;
        this.removeChildren();
        this.changeWindow(this.selectedWindow);
    },


    /**
     * Closes this windowgroup
     */
    closeWindowGroup : function (){
        if(this.callBackRemoved)
            this.callBackRemoved(this);
    },

    /**
     * Reduces to icon this windowgroup
     */
    reduceWindowGroup : function (){
        if(this.callBackReduced)
            this.callBackReduced(this);
    },

    showCanvasOfSelectedWindow : function(selectedWindow){
      let canvasKey = Object.keys(this.canvasMap).find((key) => key == selectedWindow.getId());
      let selectedCanvas = this.canvasMap[canvasKey];
      if(selectedCanvas && this.visibleCanvas !== canvasKey){
          this.canvasContainer.appendChild(selectedCanvas);
          this.visibleCanvas = canvasKey;
      }
    },

    /**
     * Function to add as childs the tabs to switch windows
     * @param tabsWidth width of the tab
     * @param tabsHeight height of the tab
     * @param xButtonWidth width of the x button
     * @param closeWindowButtonWidth width of the x to close the window group
     */
    getTabsOfWindows: function(tabsWidth = 120, tabsHeight = 40, xButtonWidth = 20, closeWindowButtonWidth = 40){
        let windowGroupBounds = this.getBounds();
        let currentWidth = 0;
        for(let window of this.windowChildren){ //For each window children
            let button = new Button();
            let backgroundColor = "transparent";
            if(window.getId() === this.selectedWindow){ //If selected window change color to red
                backgroundColor = "red";
                this.showCanvasOfSelectedWindow(window);
            }
            //Generic tab button of a window
            button.setBounds(new Bounds(windowGroupBounds.x+currentWidth,windowGroupBounds.y+1, tabsWidth, tabsHeight)).setBackgroundColor(backgroundColor)
                .setBorderColor("#004d00")
                .setBorderLineWidth(3)
                .setFont("16px Arial")
                .setText("Tab " + (window.getId()))
                .setTextColor("#004d00")
                .setId(window.getId())
                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.changeWindow(source.getId())});
            let closeWindowButton = new Button(); //X button to close a window
            closeWindowButton.setBounds(new Bounds(windowGroupBounds.x+currentWidth+tabsWidth-xButtonWidth,windowGroupBounds.y+1, xButtonWidth, tabsHeight)).setBackgroundColor("white")
                .setBorderColor("#004d00")
                .setBorderLineWidth(3)
                .setFont("16px Arial")
                .setText("X")
                .setTextColor("#004d00")
                .setId(window.getId())
                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.removePage(source.getId())});
            this.addChild(button);
            this.addChild(closeWindowButton);
            currentWidth += tabsWidth;
        }
        let closeWindowGroupButton = new Button(); //Closes this windowgroup
        closeWindowGroupButton.setBounds(new Bounds(windowGroupBounds.x+this.bounds.w-closeWindowButtonWidth,windowGroupBounds.y+1, closeWindowButtonWidth, tabsHeight)).setBackgroundColor("white")
            .setBorderColor("#004d00")
            .setBorderLineWidth(3)
            .setFont("16px Arial")
            .setText("X")
            .setTextColor("#004d00")
            .setId(this.getId())
            .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.closeWindowGroup();});

        let reduceButton = new Button(); //Reduces to icon this window group
        reduceButton.setBounds(new Bounds(windowGroupBounds.x+this.bounds.w-closeWindowButtonWidth*2,windowGroupBounds.y+1, closeWindowButtonWidth, tabsHeight)).setBackgroundColor("white")
            .setBorderColor("#004d00")
            .setBorderLineWidth(3)
            .setFont("16px Arial")
            .setText("_")
            .setTextColor("#004d00")
            .setId(this.getId())
            .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.reduceWindowGroup();});
        //Button to add a new page
        let buttonNewPage = new Button();
        buttonNewPage.setBounds(new Bounds(windowGroupBounds.x+currentWidth-1,windowGroupBounds.y+1, 30, 40)).setBackgroundColor("white")
            .setBorderColor("#004d00")
            .setBorderLineWidth(3)
            .setFont("16px Arial")
            .setText("+")
            .setTextColor("#004d00")
            .addEventListener(burdui.EventTypes.mouseClick, () => { this.addPage()});
        this.addChild(buttonNewPage);
        this.addChild(closeWindowGroupButton)
        this.addChild(reduceButton);
    },


    /**
     * Override of the paint function
     * @param g the canvas
     * @param r the root
     */
    paint: function(g=null, r=null){
        if(!this.canvas)
            return;
        this.resetChildren();
        g = this.canvas.getContext('2d');
        r = this.bounds;
        this.bounds.x = 0;
        this.bounds.y = 0;
        this.border.paint(g, r);
        this.getTabsOfWindows(); //Adds the tabs as children
        this.paintChildren(g, r);
    },
});

export {WindowGroup};
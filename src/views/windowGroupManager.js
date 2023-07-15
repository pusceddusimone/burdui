import {View} from "./view";
import {Bounds} from "../layout/bounds";
import {Border} from "../layout/border";
import {Background} from "../layout/background";
import {Button} from "./button";

function WindowGroupManager(bounds){
    View.call(this);
    this.bounds = bounds || new Bounds();
    this.border = new Border();
    this.background = new Background();
    this.windowGroupChildren = [];
    this.wgMap = [];
    this.selectedWindows = [];
    this.canvasList = [];
}


WindowGroupManager.prototype = Object.assign( Object.create( View.prototype ), {

    constructor: WindowGroupManager,

    setBounds: function(bounds){
        this.bounds = bounds;
        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
        this.background.setBounds(new Bounds(
            this.border.lineWidth/2,
            this.border.lineWidth/2,
            this.bounds.w - this.border.lineWidth,
            this.bounds.h - this.border.lineWidth));
        this.updateBounds();
        return this;
    },

    /**
     * Sets the WindowGroup child canvas
     * @param canvas canvas of the WindowGroup child
     * @param id id of the newly created window
     */
    addWindowGroupCanvas : function (canvas, id){
      this.canvasList.push({
          id,
          canvas
      });
    },

    /**
     * Finds the first available index for a newly created window
     * @returns {number} the index for the window
     */
    findFirstAvailableIndexForWindow: function(){
        let windowIndex = 0;
        while (typeof(this.wgMap[windowIndex]) !== "undefined") {
            windowIndex++;
        }
        return windowIndex;
    },

    getBounds : function(){
        return this.bounds;
    },


    addChild: function(child){
        View.prototype.addChild.call(this, child);

        // not optimized, we can speed-up setting the bounds of the last child.
        this.updateBounds();

        return this;
    },

    /**
     * Adds a newly created windowGroup to the manager
     * @param child the windwgroup
     */
    formatWindowGroup : function(child){
        if(child.constructor.name === "WindowGroup") //If windowGroup add
        {
            let firstAvailableIndex = this.findFirstAvailableIndexForWindow();
            child.setId(firstAvailableIndex);
            this.wgMap.push(firstAvailableIndex);
            this.selectedWindows.push(firstAvailableIndex);
            this.windowGroupChildren.push(child);
        }
    },

    /**
     * Callback when a windowgroup is closed
     * @param id id of the windowgroup
     */
    callBackRemovedWindowGroup : function(id){
        let canvasObj = this.getWindowGroupCanvas(id);
        if(!canvasObj)
            return;
        let canvas = canvasObj.canvas;
        this.windowGroupChildren =  this.windowGroupChildren.filter(child => child.getId()!==id);
        this.canvasList = this.canvasList.filter(obj => obj.id !== id);
        this.selectedWindows = this.selectedWindows.filter(wgId => wgId !== id);
        let screen = document.getElementById('screen').getContext('2d');
        this.paint(screen, this.bounds);
        canvas.remove();
    },

    /**
     * Gets the canvas of the windowgroup given its id
     * @param id id of the windowgroup
     * @returns {*} the canvas
     */
    getWindowGroupCanvas : function (id){
        return this.canvasList.find(c => c.id === id);
    },

    /**
     * Callback when windowgroup is reduced to icon
     * @param id id of the windowgroup
     */
    callBackReduceWindowGroup : function(id){
        let canvasObj = this.getWindowGroupCanvas(id);
        if(!canvasObj)
            return;
        let canvas = canvasObj.canvas;
        this.selectedWindows = this.selectedWindows.filter(windowId => windowId !== id);
        let screen = document.getElementById('screen').getContext('2d');
        this.paint(screen, this.bounds);
        canvas.remove();
    },

    /**
     * Callback when windowgroup is clicked from the application tray and is not visible
     * @param id id of the clicked windowgroup
     */
    callBackShowWindowGroup : function(id){
        let canvasObj = this.getWindowGroupCanvas(id);
        if(!canvasObj)
            return;
        let canvas = canvasObj.canvas;
        this.selectedWindows.push(id);
        let screen = document.getElementById('screen').getContext('2d');
        this.paint(screen, this.bounds);
        document.getElementsByClassName("canvasContainer")[0].insertBefore(canvas, document.getElementById('screen').children[0])
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
     * Resets the windowgroupmanager window
     * @param screen
     */
    resetWindow: function (screen){
        let context = screen.getContext('2d');
        context.clearRect(0,0,context.canvas.width-this.border.lineWidth,context.canvas.height-this.border.lineWidth);
        this.removeChildren();
    },

    /**
     * Changes the visibility of a windowgroup
     * @param id id of the windowgroup
     */
    changeWindowGroup : function (id){
        if(this.selectedWindows.includes(id)) //WindowGroup is already selected
        {
            this.callBackReduceWindowGroup(id);
        }
        else //WindowGroup not selected
        {
            this.callBackShowWindowGroup(id);
        }
    },

    /**
     * Prepares the application tray depending on the windowgroups added
     * @param tabsWidth width of the tabs
     * @param tabsHeight height of the tabs
     */
    addTrayChildren : function(tabsWidth = 120, tabsHeight = 40){
        let wgmBounds = this.getBounds();
        let currentWidth = 0;
        for(let wg of this.windowGroupChildren){
            let button = new Button();
            let backgroundColor = "transparent";
            if(this.selectedWindows.includes(wg.getId()))
                backgroundColor = "red";
            button.setBounds(new Bounds(wgmBounds.x+currentWidth,wgmBounds.y+this.bounds.h-tabsHeight, tabsWidth, tabsHeight)).setBackgroundColor(backgroundColor)
                .setBorderColor("#004d00")
                .setBorderLineWidth(3)
                .setFont("16px Arial")
                .setText("Finestra " + (wg.getId()))
                .setTextColor("#004d00")
                .setId(wg.getId())
                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.changeWindowGroup(source.getId())});
            currentWidth += tabsWidth;
            this.addChild(button);
        }
    },

    /**
     * Sets the visible windowgroups as children
     */
    addVisibileWindowGroups : function(){
        for(let wg of this.windowGroupChildren)
        {
            if(this.selectedWindows.includes(wg.getId()))
            {
                this.addChild(wg);
            }
        }
    },



    /**
     * Paints the windowgroupmanager
     * @param g the canvas
     * @param r the root
     */
    paint: function(g, r){
        r = r || this.bounds;
        this.resetWindow(document.getElementById('screen'));
        this.addTrayChildren();
        this.addVisibileWindowGroups();
        this.border.paint(g, r);
        this.paintChildren(g, r);
    },
});

export {WindowGroupManager};
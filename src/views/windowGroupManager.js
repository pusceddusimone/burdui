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


    formatWindowGroup : function(child){
        if(child.constructor.name === "WindowGroup"){
            let firstAvailableIndex = this.findFirstAvailableIndexForWindow();
            child.setId(firstAvailableIndex);
            this.wgMap.push(firstAvailableIndex);
            this.selectedWindows.push(firstAvailableIndex);
            this.windowGroupChildren.push(child);
        }
    },

    changeWindowVisibility : function (id){
        if(id in this.selectedWindows) //Removal case
        {

        }
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

    resetWindow: function (screen){
        let context = screen.getContext('2d');
        context.clearRect(0,0,context.canvas.width-this.border.lineWidth,context.canvas.height-this.border.lineWidth);
    },

    addTrayChildren : function(tabsWidth = 120, tabsHeight = 40, xButtonWidth = 20){
        let wgmBounds = this.getBounds();
        let currentWidth = 0;
        for(let wg of this.windowGroupChildren){
            let button = new Button();
            let backgroundColor = "transparent";
            if(wg.getId() in this.selectedWindows)
                backgroundColor = "red";
            button.setBounds(new Bounds(wgmBounds.x+currentWidth,wgmBounds.y+this.bounds.h-tabsHeight, tabsWidth, tabsHeight)).setBackgroundColor(backgroundColor)
                .setBorderColor("#004d00")
                .setBorderLineWidth(3)
                .setFont("16px Arial")
                .setText("Finestra " + (wg.getId()))
                .setTextColor("#004d00")
                .setId(wg.getId())
                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.changeWindow(source.getId())});
            currentWidth += tabsWidth;
            this.addChild(button);
        }
    },

    addVisibileWindowGroups : function(){
        for(let wg of this.windowGroupChildren)
        {
            if(wg.getId() in this.selectedWindows)
            {
                //Setta canvas del windowgroup visibile
                this.addChild(wg);
            }
            else
            {
                //Setta canvas del windowgroup invisibile
            }
        }
    },



    /**
     * Paints the window, the window just acts as a container for the windowgroup
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
import {View} from "./view";
import {Bounds} from "../layout/bounds";
import {Border} from "../layout/border";
import {Background} from "../layout/background";

function Window(bounds){
    View.call(this);
    this.bounds = bounds || new Bounds();
    this.border = new Border();
    this.background = new Background();
}


Window.prototype = Object.assign( Object.create( View.prototype ), {

    constructor: Window,

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

    getBounds : function(){
        return this.bounds;
    },


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
     * Paints the window, the window just acts as a container for the windowgroup
     * @param g the canvas
     * @param r the root
     */
    paint: function(g, r){
        r = r || this.bounds;
        this.border.paint(g, r);
        this.paintChildren(g, r);
    },
});

export {Window};
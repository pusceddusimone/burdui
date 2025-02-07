/**
 * @author Davide Spano
 */

import {View} from "./view";
import {Border} from "../layout/border";
import {Background} from "../layout/background";
import {Bounds} from "../layout/bounds";
import {Text} from "../layout/text";

function Button(bounds){
    View.call(this);
    this.bounds = bounds || new Bounds();
    this.border = new Border();
    this.background = new Background();
    this.text = new Text();
    this.flickerCount = 0;
}

Button.prototype = Object.assign( Object.create( View.prototype ), {

    constructor: Button,

    setBounds: function(bounds){
        this.bounds = bounds;
        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
        this.background.setBounds(new Bounds(
            this.border.lineWidth/2,
            this.border.lineWidth/2,
            this.bounds.w - this.border.lineWidth,
            this.bounds.h - this.border.lineWidth));
        this.text.setAlign("center");
        this.text.setBaseline("middle");
        this.text.setPosition(
             this.bounds.w/2,
             this.bounds.h/2);
        if(this.canvasMap){

        }
        return this;
    },

    getBounds : function(){
        return this.bounds;
    },

    setTextColor: function(color){
        this.text.setColor(color);
        return this;
    },

    getTextColor: function(){
        return this.text.getColor();
    },

    setText: function(text){
        this.text.setText(text);
        return this;
    },

    getText: function(){
        return this.text.getText();
    },

    setFont: function(font){
        this.text.setFont(font);
        return this;
    },

    getFont: function(){
        return this.text.getFont();
    },

    paint: function(g, r){
        r = r || this.bounds;
        this.background.paint(g, r);
        this.border.paint(g, r);
        this.text.paint(g, r);
    },
});

export {Button};
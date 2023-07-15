(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.burdui = {}));
}(this, (function (exports) { 'use strict';

	const EventTypes = {
	    paint: 0,
	    mouseMove: 1,
	    mouseDown: 2,
	    mouseUp: 3,
	    keyDown: 4,
	    keyUp: 5,

	    mouseClick: 100,
	    mouseDoubleClick: 101,
	    mouseEnter: 102,
	    mouseLeave: 103,
	    getFocus: 104,
	    lostFocus:105,
	};

	function Event(source, type, args){
	    this.source = source;
	    this.type = type;
	    this.args = args;
	}

	Object.assign(Event.prototype, {


	    // methods
	    getSource : function(){
	        return this.source;
	    },

	    setSource : function(source) {
	        this.source = source;
	        return this;
	    },

	    getType : function(){
	        return this.type;
	    },

	    setType : function(type){
	        this.type = type;
	        return this;
	    },

	    getArgs : function(){
	        return this.args;
	    },

	    setArgs : function(args){
	        this.args = args;
	        return this;
	    },

	});

	/**
	 * @author Davide Spano
	 */

	function Bounds(x, y, w, h){
	    this.x = x || 0;
	    this.y = y || 0;
	    this.w = w || 0;
	    this.h = h || 0;
	}

	Object.assign( Bounds.prototype, {
	    set : function(x, y, w, h){
	        this.x = x;
	        this.y = y;
	        this.w = w;
	        this.h = h;
	        return this;
	    },

	    setX : function(x){
	        this.x = x;
	        return this;
	    },

	    setY : function(y){
	        this.y = y;
	        return this;
	    },

	    setW : function(w){
	        this.w = w;
	        return this;
	    },

	    setH : function(h){
	        this.h = h;
	        return this;
	    },

	    /**
	     * Calculates the intersection between two Bounds object,
	     * which is the maximum rectangular area shared by both of them.
	     * @param r the Bounds object to intersect
	     * @returns {Bounds|null} a Bounds object representing the
	     * intersection or null in case of error.
	     */
	    intersection : function(r){
	        if (! r instanceof Bounds){
	            return null;
	        }
	        let tx1 = this.x;
	        let ty1 = this.y;
	        let rx1 = r.x;
	        let ry1 = r.y;
	        let tx2 = tx1; tx2 += this.w;
	        let ty2 = ty1; ty2 += this.h;
	        let rx2 = rx1; rx2 += r.w;
	        let ry2 = ry1; ry2 += r.h;
	        if (tx1 < rx1) tx1 = rx1;
	        if (ty1 < ry1) ty1 = ry1;
	        if (tx2 > rx2) tx2 = rx2;
	        if (ty2 > ry2) ty2 = ry2;
	        tx2 -= tx1;
	        ty2 -= ty1;
	        return new Bounds(tx1, ty1, tx2, ty2);
	    },

	    /**
	     * Calculates the union between two Bounds object,
	     * which is the minimum rectangular area including  both of them.
	     * @param r the Bounds object to unite
	     * @returns {Bounds|null} a Bounds object representing the
	     * union or null in case of error.
	     */
	    union: function(r){
	        if (! r instanceof Bounds){
	            return null;
	        }
	        let tx2 = this.w;
	        let ty2 = this.h;
	        if ((tx2 | ty2) < 0) {
	            // This rectangle has negative dimensions...
	            // we return the other Bounds object
	            return new Bounds(r.x, r.y, r.w, r.h);
	        }
	        let rx2 = r.w;
	        let ry2 = r.h;
	        if ((rx2 | ry2) < 0) {
	            return new Bounds(this.x, this.y, this.w, this.h);
	        }
	        let tx1 = this.x;
	        let ty1 = this.y;
	        tx2 += tx1;
	        ty2 += ty1;
	        let rx1 = r.x;
	        let ry1 = r.y;
	        rx2 += rx1;
	        ry2 += ry1;
	        if (tx1 > rx1) tx1 = rx1;
	        if (ty1 > ry1) ty1 = ry1;
	        if (tx2 < rx2) tx2 = rx2;
	        if (ty2 < ry2) ty2 = ry2;
	        tx2 -= tx1;
	        ty2 -= ty1;
	        return new Bounds(tx1, ty1, tx2, ty2);
	    },

	    /**
	     * Checks whether a point is inside the Bounds or not
	     * @param X the x coordinate of the point
	     * @param Y the y coordinate of the point
	     * @returns {boolean} true if the point is inside, false otherwise
	     */
	    contains : function(X, Y){
	        let w = this.w;
	        let h = this.h;
	        if((w | h) < 0){
	            return false;
	        }
	        let x = this.x;
	        let y = this.y;
	        if (X < x || Y < y){
	            return false;
	        }
	        w += x;
	        h += y;
	        //      overflow || intersect
	        return ((w < x || w > X) &&
	                (h < y || h > Y));
	    },




	});

	/**
	 * @author Davide Spano
	 */

	function App(canvas, tree){
	    this.canvas = canvas;
	    this.g = canvas.getContext('2d');
	    this.tree = tree;
	    if(this.tree){
	        this.tree.parent = this;
	    }
	    this.q = [];

	    //variables for inferring events
	    this.pointer = {x: -1, y: -1};
	    this.primaryBtn = 0;
	    this.secondaryBtn = 0;


	    this.moveThreshold = 10;

	    this.buttonPressed = -1;
	    this.focus = null;

	}

	Object.assign( App.prototype, {
	    start : function(){
	        if(this.tree != null){
	            this.tree.paint(this.g);

	            // receive the input from the devices

	            this.canvas.addEventListener('mousemove', e =>{
	                let test = this.hitTest(e);
	                if(test.view){
	                    let evt = new Event(test.view, EventTypes.mouseMove, test.args);
	                    this.q.push(evt);
	                }
	            });

	            this.canvas.addEventListener('mousedown', e =>{
	                let test = this.hitTest(e);
	                if(test.view){
	                    let evt = new Event(test.view, EventTypes.mouseDown, test.args);
	                    this.q.push(evt);
	                }
	            });

	            this.canvas.addEventListener('mouseup', e => {
	                let test = this.hitTest(e);
	                if(test.view){
	                    let evt = new Event(test.view, EventTypes.mouseUp, test.args);
	                    this.q.push(evt);
	                }
	            });

	            this.canvas.addEventListener('keydown', e =>{
	                if(this.focus){
	                    let evt = new Event(this.focus, EventTypes.keyDown, e);
	                    this.q.push(evt);
	                }
	            });

	            this.canvas.addEventListener('keyup', e => {
	                if(this.focus){
	                    let evt = new Event(this.focus, EventTypes.keyUp, e);
	                    this.q.push(evt);
	                }
	            });

	            let self = this;
	            window.setInterval(function(){
	                self.flushQueue();
	            }, 100);
	        }
	    },

	    invalidate: function(r, source){
	        let evt = new Event(source, EventTypes.paint, {
	            time: new Date().getTime(),
	            bounds: r
	        });
	        this.q.push(evt);
	    },

	    flushQueue: function(){
	        let damagedArea = new Bounds(0,0,-1,-1);

	        while(this.q.length > 0){
	            let evt = this.q.shift();
	            switch(evt.type){
	                case EventTypes.paint:
	                    damagedArea = damagedArea.union(evt.args.bounds);
	                    break;

	                case EventTypes.mouseMove:
	                    evt.source.raise(evt.source, EventTypes.mouseMove, evt.args);
	                    this.pointer.x = evt.args.screenX;
	                    this.pointer.y = evt.args.screenY;
	                    break;

	                case EventTypes.mouseDown:
	                    evt.source.raise(evt.source, EventTypes.mouseDown, evt.args);
	                    if(evt.args.primaryBtn){
	                        this.primaryBtn = evt.args.time;
	                        this.buttonPressed = 1;
	                    }
	                    if(evt.args.secondaryBtn){
	                        this.secondaryBtn = evt.args.time;
	                        this.buttonPressed = 2;
	                    }
	                    break;

	                case EventTypes.mouseUp:
	                    evt.source.raise(evt.source, EventTypes.mouseUp, evt.args);
	                    if(this.buttonPressed == 1 &&
	                        Math.abs(this.pointer.x - evt.args.screenX) < this.moveThreshold &&
	                        Math.abs(this.pointer.y - evt.args.screenY) < this.moveThreshold){
	                        evt.source.raise(evt.source, EventTypes.mouseClick, evt.args);
	                        // set focus on clicked view
	                        if(this.focus){
	                            this.focus.raise(this.focus, EventTypes.lostFocus, {});
	                        }
	                        this.focus = evt.source;
	                        this.focus.raise(evt.source, EventTypes.getFocus, {});
	                    }
	                    if(this.buttonPressed == 2 &&
	                        Math.abs(this.pointer.x - evt.args.screenX) < this.moveThreshold &&
	                        Math.abs(this.pointer.y - evt.args.screenY) < this.moveThreshold){
	                        evt.source.raise(evt.source, EventTypes.mouseClick, evt.args);
	                    }
	                    this.buttonPressed = -1;
	                    break;

	                case EventTypes.keyDown:
	                    if(this.focus){
	                        this.focus.raise(evt.source, EventTypes.keyDown, evt.args);
	                    }
	                    break;
	                case EventTypes.keyUp:
	                    if(this.focus){
	                        this.focus.raise(evt.source, EventTypes.keyUp, evt.args);
	                    }
	                    break;
	            }
	        }

	        if(damagedArea.w > 0 && damagedArea.h > 0){
	            this.tree.paint(this.g, damagedArea);
	        }
	    },

	    hitTest: function(e){
	        // getting the point in the canvas coordinates
	        let rect = e.target.getBoundingClientRect();
	        let x = e.clientX - rect.left;
	        let y = e.clientY - rect.top;

	        let args = {
	            time: new Date().getTime(),
	            x : x,
	            y : y,
	            screenX : x,
	            screenY : y,
	            primaryBtn : e.buttons == 1,
	            secondaryBtn: e.buttons == 2
	        };
	        let view = this.tunnel(this.tree, x, y, 0, 0, args);
	        //console.log(`mouse (${x}, ${y}) on view ${view.name}` );
	        return {
	            view: view,
	            args: args
	        };
	    },

	    tunnel: function(view, x, y, dx, dy, e){
	        if(view == null){
	            return null;
	        }

	        let inner = null;
	        let rect = new Bounds(
	            view.bounds.x + dx,
	            view.bounds.y + dy,
	            view.bounds.w,
	            view.bounds.h
	        );
	        if(rect.contains(x, y)){
	            inner = view;
	            e.x = x - dx;
	            e.y = y - dy;
	        }else {
	            return null;
	        }

	        for(let c of view.children){
	            inner = this.tunnel(c, x , y, rect.x, rect.y, e) || inner;
	        }

	        return inner;
	    },

	});

	let Utils = {
	    createRoundedRect: function (g, rounded, b) {
	        const halfRadians = (2 * Math.PI) / 2;
	        const quarterRadians = (2 * Math.PI) / 4;
	        let bounds = new Bounds(
	            b.x + g.lineWidth,
	            b.y + g.lineWidth,
	            b.w - 2 * g.lineWidth,
	            b.h - 2 * g.lineWidth);
	        g.beginPath();
	        // top left arc
	        g.arc(rounded + bounds.x,
	            rounded + bounds.y,
	            rounded, -quarterRadians, halfRadians, true);

	        // line from top left to bottom left
	        g.lineTo(bounds.x, bounds.y + bounds.h - rounded);

	        // bottom left arc
	        g.arc(rounded + bounds.x,
	            bounds.h - rounded + bounds.y,
	            rounded, halfRadians, quarterRadians, true);

	        // line from bottom left to bottom right
	        g.lineTo(bounds.x + bounds.w - rounded,
	            bounds.y + bounds.h);

	        // bottom right arc
	        g.arc(bounds.x + bounds.w - rounded,
	            bounds.y + bounds.h - rounded,
	            rounded, quarterRadians, 0, true);

	        // line from bottom right to top right
	        g.lineTo(bounds.x + bounds.w, bounds.y + rounded);

	        // top right arc
	        g.arc(bounds.x + bounds.w - rounded,
	            bounds.y + rounded, rounded, 0, -quarterRadians, true);

	        // line from top right to top left
	        g.lineTo(bounds.x + rounded, bounds.y);
	        g.closePath();
	    },
	};

	/**
	 * @author Davide Spano
	 */

	function Background(bounds, color, rounded){
	    this.bounds = bounds || new Bounds();
	    this.color = color || "#ffffff00";
	    this.rounded = rounded || 0;
	}
	Object.assign( Background.prototype, {
	    setColor : function(color){
	        this.color = color;
	        return this;
	    },

	    getColor: function(){
	        return this.color;
	    },

	    setBounds : function(bounds){
	        this.bounds = bounds;
	        return this.bounds;
	    },

	    getBounds : function(){
	        return this.bounds;
	    },

	    setRounded : function(rounded){
	        this.rounded = rounded;
	        return this;
	    },

	    paint : function(g, r){
	        g.save();
	        g.beginPath();
	        g.rect(r.x, r.y, r.w, r.h);
	        g.closePath();
	        g.clip();
	        g.fillStyle = this.color;
	        g.beginPath();
	        Utils.createRoundedRect(g, this.rounded, this.bounds);
	        g.closePath();
	        g.fill();
	        g.restore();
	    }
	});

	/**
	 * @author Davide Spano
	 */

	function Text(text, font){
	    this.text = text || "";
	    this.font = font || "30px Arial";
	    this.align = "center";
	    this.baseline = "middle";
	    this.color = "black;";
	    this.x = 0;
	    this.y = 0;
	}

	Object.assign( Text.prototype, {
	    setText : function(text){
	        this.text = text;
	        return this;
	    },

	    getText : function(){
	        return this.text;
	    },

	    setAlign : function(align){
	        this.align = align;
	        return this;
	    },

	    getAlign : function(){
	        return this.align;
	    },

	    setBaseline : function(baseline){
	        this.baseline = baseline;
	        return this;
	    },

	    getBaseline : function(){
	        return this.baseline;
	    },

	    setFont : function(font){
	        this.font = font;
	        return this;
	    },

	    getFont : function(){
	        return this.font;
	    },

	    setPosition: function(x, y){
	        this.x = x;
	        this.y = y;
	        return this;
	    },

	    getPosition: function(){
	        return {x: this.x, y: this.y};
	    },
	    setColor : function(color){
	        this.color = color;
	        return this;
	    },

	    getColor: function(){
	        return this.color;
	    },

	    paint: function(g, r){
	        g.save();
	        g.beginPath();
	        g.rect(r.x, r.y, r.w, r.h);
	        g.clip();
	        g.font = this.font;
	        g.fillStyle = this.color;
	        g.textAlign = this.align;
	        g.textBaseline = this.baseline;
	        g.fillText(this.text, this.x, this.y);
	        g.restore();
	    }
	});

	/**
	 * @author Davide Spano
	 */

	function Border( bounds, color, lineWidth, rounded){
	    this.color = color || "#ffffff00";
	    this.bounds = bounds || new Bounds();
	    this.rounded = rounded || 0;
	    this.lineWidth = lineWidth || 0;
	}

	Object.assign( Border.prototype, {

	    setColor : function(color){
	        this.color = color;
	        return this;
	    },

	    getColor: function(){
	        return this.color;
	    },

	    setLineWidth : function(width){
	        this.lineWidth = width;
	        return this;
	    },

	    getLineWidth: function(){
	        return this.lineWidth;
	    },

	    setBounds : function(bounds){
	        this.bounds = bounds;
	        return this.bounds;
	    },

	    getBounds : function(){
	        return this.bounds;
	    },

	    setRounded : function(rounded){
	        this.rounded = rounded;
	        return this;
	    },

	    getRounded : function(){
	        return this.rounded;
	    },

	    paint : function(g, r){


	        g.save();
	        g.beginPath();
	        g.rect(r.x, r.y, r.w, r.h);
	        g.clip();
	        if(this.lineWidth >0){
	            g.strokeStyle = this.color;
	            g.lineWidth = this.lineWidth;
	            Utils.createRoundedRect(g, this.rounded, this.bounds);
	            g.stroke();
	        }

	        g.restore();
	    },

	});

	/**
	 * @author Davide Spano
	 */

	function View(){
	    this.bounds = new Bounds();
	    this.border = new Border();
	    this.background = new Background();
	    this.name = "";
	    this.children = [];
	    this.isView = true;
	    this.parent = null;
	    this.listeners = {};
	    this.id = null;
	}

	Object.assign(View.prototype, {
	    setBounds : function(bounds){
	        this.bounds = bounds;
	        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
	        this.background.setBounds(new Bounds(
	            this.border.lineWidth/2,
	            this.border.lineWidth/2,
	            this.bounds.w - this.border.lineWidth,
	            this.bounds.h - this.border.lineWidth));
	        return this;
	    },

	    getBounds : function(){
	        return this.bounds;
	    },

	    setName : function(name){
	        this.name = name;
	        return this;
	    },

	    getName : function(){
	        return name;
	    },

	    setId : function(id){
	        this.id = id;
	        return this;
	    },

	    getId : function(){
	        return this.id;
	    },

	    setBackgroundColor: function(color){
	        this.background.setColor(color);
	        return this;
	    },

	    getBackgroundColor: function(){
	        return this.background.getColor();
	    },

	    setBorderLineWidth: function(width){
	        this.border.setLineWidth(width);
	        this.background.setBounds(new Bounds(
	            this.border.lineWidth/2,
	            this.border.lineWidth/2,
	            this.bounds.w - this.border.lineWidth,
	            this.bounds.h - this.border.lineWidth));
	        return this;
	    },

	    getBorderLineWidth: function(){
	        return this.border.getLineWidth();
	    },

	    setBorderColor: function(color){
	        this.border.setColor(color);
	        return this;
	    },

	    getBorderColor: function(){
	        return this.border.getColor();
	    },

	    setBorderRounded: function(rounded){
	        this.border.setRounded(rounded);
	        this.background.setRounded(rounded);
	        return this;
	    },

	    getBorderRounded: function(){
	        return this.border.getRounded();
	    },

	    addChild: function(c){
	        if(!c){
	            return this;
	        }
	        if(c.isView){
	            this.children.push(c);
	            c.parent = this;
	        }
	        return this;
	    },

	    removeChildren: function(){
	        this.children = [];
	        return this;
	    },

	    removeChildById: function(id){
	        let newChildren = [];
	        this.children.forEach((child) => {
	            if(child.getId() !== id)
	                newChildren.push(child);
	        });
	        this.children = newChildren;
	        return this;
	    },


	    paintChildren: function(g, b){
	        let r = b || this.bounds;
	        for(let c of this.children){
	            let intersection = c.bounds.intersection(r);
	            if(intersection.w > 0 && intersection.h > 0){
	                // the children is in the damaged area
	                g.save();
	                g.translate(c.bounds.x, c.bounds.y);
	                intersection.setX(intersection.x - c.bounds.x);
	                intersection.setY(intersection.y - c.bounds.y);
	                c.paint(g, intersection);
	                g.restore();
	            }
	        }
	    },

	    paint: function(g, b){
	        let r = b || this.bounds;

	        g.save();
	        // setting the clipping region. The view cannot draw outside its bounds
	        g.beginPath();
	        g.rect(r.x, r.y, r.w, r.h);
	        g.clip();

	        this.background.paint(g, r);
	        this.border.paint(g, r);

	        // draw the children views.
	        this.paintChildren(g,r);
	        g.restore();

	    },

	    invalidate : function(r, source){
	        source = source || this;
	        r = r || new Bounds(0,0, this.bounds.w, this.bounds.h);
	        if(this.parent != null){
	            // move to the parent reference system
	            let damagedArea = new Bounds(
	                this.bounds.x + r.x,
	                this.bounds.y + r.y,
	                r.w, r.h);
	            // intersect the requested area with the current bounds
	            damagedArea = damagedArea.intersection(this.bounds);

	            // bubble up the request to the parent
	            this.parent.invalidate(damagedArea, source);
	        }
	    },

	    addEventListener : function(eventType, listener){
	        if(!this.listeners[eventType]){
	            this.listeners[eventType] = [];
	        }
	        this.listeners[eventType].push(listener);
	    },

	    raise : function(source, eventType, args){
	        if(this.listeners[eventType]){
	            for(let l of this.listeners[eventType]){
	                l(source, args);
	            }
	        }
	    },


	});

	/**
	 * @author Davide Spano
	 */

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

	/**
	 * @author Davide Spano
	 */

	function GridPanel(){
	    View.call(this);
	    this.padding = 0;
	    this.rows = 0;
	    this.cols = 0;
	}

	GridPanel.prototype = Object.assign( Object.create( View.prototype ), {

	    constructor: GridPanel,

	    setRows: function(rows){
	        this.rows = rows;
	        this.updateBounds();
	        return this;
	    },

	    getRows: function(){
	        return this.rows;
	    },

	    setCols: function(cols){
	        this.cols = cols;
	        this.updateBounds();
	        return this;
	    },

	    getCols: function(){
	        return this.cols;
	    },

	    setBounds: function (bounds){
	        View.prototype.setBounds.call(this, bounds);
	        this.updateBounds();
	        return this;
	    },

	    addChild: function(child, row, col, rowSpan, colSpan){
	        row = row || child.row || 0;
	        col = col || child.col || 0;
	        rowSpan = rowSpan || child.rowSpan || 1;
	        colSpan = colSpan || child.colSpan || 1;

	        if(row < 0) row = 0;
	        if(col < 0) col = 0;
	        if(row >= this.rows) row = this.rows -1;
	        if(col >= this.cols) col = this.cols - 1;
	        if(rowSpan < 1) rowSpan = 1;
	        if(colSpan < 1) colSpan = 1;

	        child.row = row;
	        child.col = col;
	        child.rowSpan = rowSpan;
	        child.colSpan = colSpan;

	        View.prototype.addChild.call(this, child);
	        this.updateBounds();

	        return this;
	    },


	    setPadding: function(padding){
	        this.padding = padding;
	        return this;
	    },

	    getPadding: function(){
	        return this.padding;
	    },

	    updateBounds: function(){
	        let rh = this.bounds.h / this.rows;
	        let cw = this.bounds.w / this.cols;
	        for(let i in this.children) {
	            let c = this.children[i];
	            let b = new Bounds(
	                c.col * cw,
	                c.row * rh,
	                cw * c.colSpan,
	                rh * c.rowSpan,
	            );
	            c.setBounds(b);

	        }
	    },

	});

	/**
	 * @author Davide Spano
	 */

	function Label(bounds){
	    View.call(this);
	    this.bounds = bounds || new Bounds();
	    this.border = new Border();
	    this.background = new Background();
	    this.text = new Text();
	}

	Label.prototype = Object.assign( Object.create( View.prototype ), {

	    constructor: Label,

	    setBounds: function(bounds){
	        this.bounds = bounds;
	        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
	        this.background.setBounds(new Bounds(
	            this.border.lineWidth/2,
	            this.border.lineWidth/2,
	            this.bounds.w - this.border.lineWidth,
	            this.bounds.h - this.border.lineWidth));
	        this.text.setAlign("left");
	        this.text.setBaseline("middle");
	        this.text.setPosition(
	            10,
	            this.bounds.h/2);
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

	    setBorderRounded: function(rounded){
	        this.border.setRounded(rounded);
	        this.background.setRounded(rounded);
	        return this;
	    },

	    getBorderRounded: function(){
	        return this.border.getRounded();
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

	/**
	 * @author Davide Spano
	 */

	function StackPanel(style){
	    View.call(this);
	    this.style = (style === "vertical" || style === "horizontal")? style : "vertical";
	    this.padding = 0;
	}

	StackPanel.prototype = Object.assign( Object.create( View.prototype ), {

	    constructor: StackPanel,

	    setBounds: function (bounds){
	        View.prototype.setBounds.call(this, bounds);
	        this.updateBounds();
	        return this;
	    },

	    addChild: function(child){
	        View.prototype.addChild.call(this, child);

	        // not optimized, we can speed-up setting the bounds of the last child.
	        this.updateBounds();

	        return this;
	    },

	    setStyle : function(style){
	        this.style = (style === "vertical" || style === "horizontal")? style : "vertical";
	        return this;
	    },

	    getStyle : function(){
	        return this.style;
	    },

	    setPadding: function(padding){
	        this.padding = padding;
	        return this;
	    },

	    getPadding: function(){
	        return this.padding;
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

	});

	/**
	 * @author Emanuele Concas
	 */

	function TextField(bounds){
	    View.call(this);
	    this.bounds = bounds || new Bounds();
	    this.border = new Border();
	    this.background = new Background();
	    this.text = new Text();

	    let self = this;
	    this.addEventListener(EventTypes.keyDown, function(source, args){
	        switch (args.key) {
	            case "Shift":
	            case "Meta":
	            case "ArrowLeft":
	            case "ArrowRight":
	            case "ArrowUp":
	            case "ArrowDown":
	                break;
	            case "Backspace":
	                self.setText(self.getText().slice(0, -1));
	                self.invalidate();
	                break;
	            default:
	                self.setText(self.getText() + args.key);
	                self.invalidate();
	                break;

	        }
	    });
	}

	TextField.prototype = Object.assign( Object.create( View.prototype ), {

	    constructor: TextField,

	    setBounds: function(bounds){
	        this.bounds = bounds;
	        this.border.setBounds(new Bounds(0,0, this.bounds.w, this.bounds.h));
	        this.background.setBounds(new Bounds(
	            this.border.lineWidth/2,
	            this.border.lineWidth/2,
	            this.bounds.w - this.border.lineWidth,
	            this.bounds.h - this.border.lineWidth));
	        this.text.setAlign("left");
	        this.text.setBaseline("middle");
	        this.text.setPosition(
	             10,
	             this.bounds.h/2);
	        return this;
	    },

	    getBounds : function(){
	        return this.bounds;
	    },

	    setBorderLineWidth: function(width){
	        this.border.setLineWidth(width);
	        this.background.setBounds(new Bounds(
	            this.border.lineWidth/2,
	            this.border.lineWidth/2,
	            this.bounds.w - this.border.lineWidth,
	            this.bounds.h - this.border.lineWidth));
	        return this;
	    },

	    getBorderLineWidth: function(){
	        return this.border.getLineWidth();
	    },

	    setBorderColor: function(color){
	        this.border.setColor(color);
	        return this;
	    },

	    getBorderColor: function(){
	        return this.border.getColor();
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

	    setBackgroundColor: function(color){
	        this.background.setColor(color);
	        return this;
	    },

	    getBackgroundColor: function(){
	        return this.background.getColor();
	    },

	    setBorderRounded: function(rounded){
	        this.border.setRounded(rounded);
	        return this;
	    },

	    getBorderRounded: function(){
	        return this.border.getRounded();
	    },

	    paint: function(g, r){
	        r = r || this.bounds;

	        this.background.paint(g, r);
	        this.border.paint(g, r);
	        this.text.paint(g, r);
	    },
	});

	class ViewElement extends HTMLElement{

	    constructor() {
	        super();
	        this.buiView = new View();

	    }

	    connectedCallback(callbackMutation = null){
	        const self = this;
	        var observer = new MutationObserver(function(mutations) {
	            mutations.forEach(function(mutation) {
	                //Detect <img> insertion
	                if (mutation.addedNodes.length){
	                    const child = mutation.addedNodes[0];
	                    if(child.buiView && child.buiView.isView){
	                        self.buiView.addChild(child.buiView);
	                        if(typeof(callbackMutation) === "function")
	                            callbackMutation(child.buiView);
	                    }
	                }

	            });
	        });

	        observer.observe(this, { childList: true });

	        for(let attr of this.attributes){
	            switch(attr.name){
	                case 'x':
	                    this.x = attr.value;
	                    break;
	                case 'y':
	                    this.y = attr.value;
	                    break;
	                case 'w':
	                    this.w = attr.value;
	                    break;
	                case 'h':
	                    this.h = attr.value;
	                    break;
	                case 'name':
	                    this.name = attr.value;
	                    break;

	                case 'background-color':
	                    this.backgroundColor = attr.value;
	                    break;

	                case 'border-line-width':
	                    this.borderLineWidth = attr.value;
	                    break;

	                case 'border-rounded':
	                    this.borderRounded = attr.value;
	                    break;

	                case 'border-color':
	                    this.borderColor = attr.value;
	                    break;

	                // trick for managing grid panels
	                case 'row':
	                    this.buiView.row = Number(attr.value);
	                    break;

	                case 'col':
	                    this.buiView.col = Number(attr.value);
	                    break;

	                case 'row-span':
	                    this.buiView.rowSpan = Number(attr.value);
	                    break;

	                case 'col-span':
	                    this.buiView.colSpan = Number(attr.value);
	                    break;
	            }

	        }
	    }

	    get view(){
	        return this.buiView;
	    }

	    set name(val){
	        if(val){
	            this.buiView.setName(val);
	        }
	    }

	    get name(){
	        return this.buiView.getName();
	    }

	    set x(val){
	        if(val){
	            this.buiView.getBounds().setX(Number(val));
	            this.buiView.setBounds(this.buiView.bounds);
	        }
	    }

	    get x(){
	        return this.buiView.getBounds().x;
	    }

	    set y(val){
	        if(val){
	            this.buiView.bounds.setY(Number(val));
	            this.buiView.setBounds(this.buiView.bounds);
	        }
	    }

	    get y(){
	        return this.buiView.getBounds().y;
	    }

	    set w(val){
	        if(val){
	            this.buiView.bounds.setW(Number(val));
	            this.buiView.setBounds(this.buiView.bounds);
	        }
	    }

	    get w(){
	        return this.buiView.getBounds().getW();
	    }

	    set h(val){
	        if(val){
	            this.buiView.bounds.setH(Number(val));
	            this.buiView.setBounds(this.buiView.bounds);
	        }
	    }

	    get h(){
	        return this.buiView.getBounds().h;
	    }

	    set backgroundColor(val){
	        if(val){
	            this.buiView.setBackgroundColor(val);
	        }
	    }

	    get backgroundColor(){
	        return this.buiView.getBackgroundColor();
	    }

	    set borderLineWidth(val){
	        if(val){
	            this.buiView.setBorderLineWidth(Number(val));
	        }
	    }

	    get borderLineWidth(){
	        return this.buiView.getBorderLineWidth();
	    }

	    set borderColor(val){
	        if(val){
	            this.buiView.setBorderColor(val);
	        }
	    }

	    set borderRounded(val){
	        if(val){
	            this.buiView.setBorderRounded(Number(val));
	        }
	    }

	    get borderRounded(){
	        return this.buiView.getBorderRounded();
	    }


	}

	window.customElements.define('bui-view', ViewElement);

	class ButtonElement extends ViewElement{

	    constructor() {
	        super();
	        this.buiView = new Button();
	    }

	    connectedCallback() {
	        super.connectedCallback();

	        for(let attr of this.attributes){
	            switch (attr.name) {

	                case 'font':
	                    this.font = attr.value;
	                    break;

	                case 'text':
	                    this.text = attr.value;
	                    break;

	                case 'text-color':
	                    this.textColor = attr.value;
	                    break;
	            }
	        }
	    }



	    set text(val){
	        if(val){
	            this.buiView.setText(val);
	        }
	    }

	    get text(){
	        return this.buiView.getText();
	    }

	    set textColor(val){
	        if(val){
	            this.buiView.setTextColor(val);
	        }
	    }

	    get textColor(){
	        return this.buiView.getTextColor();
	    }

	    set font(val){
	        if(val){
	            this.buiView.setFont(val);
	        }
	    }

	    get font(){
	        return this.buiView.getFont();
	    }
	}

	window.customElements.define('bui-button', ButtonElement);

	class GridPanelElement extends ViewElement{

	    constructor() {
	        super();
	        this.buiView = new GridPanel();
	    }

	    connectedCallback() {
	        super.connectedCallback();

	        for(let attr of this.attributes){
	            switch (attr.name) {
	                case 'rows':
	                    this.rows = attr.value;
	                    break;

	                case 'cols':
	                    this.cols = attr.value;
	                    break;

	                case 'padding':
	                    this.padding = attr.value;
	                    break;
	            }
	        }
	    }

	    set rows(val){
	        if(val){
	            this.buiView.setRows(Number(val));
	        }
	    }

	    get rows(){
	        return this.buiView.getRows();
	    }

	    set cols(val){
	        if(val){
	            this.buiView.setCols(Number(val));
	        }
	    }

	    get cols(){
	        return this.buiView.getCols();
	    }
	}
	window.customElements.define('bui-grid-panel', GridPanelElement);

	class LabelElement extends ViewElement{

	    constructor() {
	        super();
	        this.buiView = new Label();
	    }

	    connectedCallback() {
	        super.connectedCallback();

	        for(let attr of this.attributes){
	            switch (attr.name) {


	                case 'font':
	                    this.font = attr.value;
	                    break;

	                case 'text':
	                    this.text = attr.value;
	                    break;

	                case 'text-color':
	                    this.textColor = attr.value;
	                    break;
	            }
	        }
	    }


	    set text(val){
	        if(val){
	            this.buiView.setText(val);
	        }
	    }

	    get text(){
	        return this.buiView.getText();
	    }

	    set textColor(val){
	        if(val){
	            this.buiView.setTextColor(val);
	        }
	    }

	    get textColor(){
	        return this.buiView.getTextColor();
	    }

	    set font(val){
	        if(val){
	            this.buiView.setFont(val);
	        }
	    }

	    get font(){
	        return this.buiView.getFont();
	    }
	}

	window.customElements.define('bui-label', LabelElement);

	class StackPanelElement extends ViewElement{

	    constructor() {
	        super();
	        this.buiView = new StackPanel();
	    }

	    connectedCallback() {
	        super.connectedCallback();

	        for(let attr of this.attributes){
	            switch (attr.name) {
	                case 'stack-style':
	                    this.style = attr.value;
	                    break;

	                case 'padding':
	                    this.padding = attr.value;
	                    break;
	            }
	        }
	    }

	    set style(val){
	        if(val){
	            this.buiView.setStyle(val);
	        }
	    }

	    get style(){
	        return this.buiView.getStyle();
	    }

	    set padding(val){
	        if(val){
	            this.buiView.setPadding(Number(val));
	        }
	    }

	    get padding(){
	        return this.buiView.getPadding();
	    }
	}
	window.customElements.define('bui-stack-panel', StackPanelElement);

	class TextFieldElement extends ViewElement{

	    constructor() {
	        super();
	        this.buiView = new TextField();
	    }

	    connectedCallback() {
	        super.connectedCallback();

	        for(let attr of this.attributes){
	            switch (attr.name) {

	                case 'font':
	                    this.font = attr.value;
	                    break;

	                case 'text':
	                    this.text = attr.value;
	                    break;

	                case 'text-color':
	                    this.textColor = attr.value;
	                    break;
	            }
	        }
	    }



	    set text(val){
	        if(val){
	            this.buiView.setText(val);
	        }
	    }

	    get text(){
	        return this.buiView.getText();
	    }

	    set textColor(val){
	        if(val){
	            this.buiView.setTextColor(val);
	        }
	    }

	    get textColor(){
	        return this.buiView.getTextColor();
	    }

	    set font(val){
	        if(val){
	            this.buiView.setFont(val);
	        }
	    }

	    get font(){
	        return this.buiView.getFont();
	    }
	}

	window.customElements.define('bui-text-field', TextFieldElement);

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
	            if(window.getId() === this.selectedWindow) //If selected window change color to red
	                backgroundColor = "red";
	            //Generic tab button of a window
	            button.setBounds(new Bounds(windowGroupBounds.x+currentWidth,windowGroupBounds.y+1, tabsWidth, tabsHeight)).setBackgroundColor(backgroundColor)
	                .setBorderColor("#004d00")
	                .setBorderLineWidth(3)
	                .setFont("16px Arial")
	                .setText("Tab " + (window.getId()))
	                .setTextColor("#004d00")
	                .setId(window.getId())
	                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.changeWindow(source.getId());});
	            let closeWindowButton = new Button(); //X button to close a window
	            closeWindowButton.setBounds(new Bounds(windowGroupBounds.x+currentWidth+tabsWidth-xButtonWidth,windowGroupBounds.y+1, xButtonWidth, tabsHeight)).setBackgroundColor("white")
	                .setBorderColor("#004d00")
	                .setBorderLineWidth(3)
	                .setFont("16px Arial")
	                .setText("X")
	                .setTextColor("#004d00")
	                .setId(window.getId())
	                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.removePage(source.getId());});
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
	            .addEventListener(burdui.EventTypes.mouseClick, () => { this.addPage();});
	        this.addChild(buttonNewPage);
	        this.addChild(closeWindowGroupButton);
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

	class WindowGroupElement extends ViewElement {
	    constructor() {
	        super();
	        this.buiView = new WindowGroup();
	    }
	    connectedCallback() {
	        //Whenever a child is added to the html, pass it to the window group
	        super.connectedCallback((child) => {
	            this.buiView.formatChildrenToWindowChildren(child);
	            //this.buiView.startWindowGroupApplication();
	        });
	    }



	}

	window.customElements.define('bui-windowgroup', WindowGroupElement);

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
	        document.getElementsByClassName("canvasContainer")[0].insertBefore(canvas, document.getElementById('screen').children[0]);
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
	                .addEventListener(burdui.EventTypes.mouseClick, (source) => {this.changeWindowGroup(source.getId());});
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
	        child.setCallbackRemoved((child) => {this.callBackRemovedWindowGroup(child);});
	        child.setCallbackReduced((child) => {this.callBackReduceWindowGroup(child);});
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
	        this.buiView.addWindowGroupCanvas(canvas, childId);
	        document.getElementsByClassName("canvasContainer")[0].insertBefore(canvas, document.getElementById('screen').children[0]);
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

	exports.App = App;
	exports.Background = Background;
	exports.Border = Border;
	exports.Bounds = Bounds;
	exports.Button = Button;
	exports.ButtonElement = ButtonElement;
	exports.EventTypes = EventTypes;
	exports.GridPanel = GridPanel;
	exports.GridPanelElement = GridPanelElement;
	exports.Label = Label;
	exports.LabelElement = LabelElement;
	exports.StackPanel = StackPanel;
	exports.StackPanelElement = StackPanelElement;
	exports.Text = Text;
	exports.TextField = TextField;
	exports.TextFieldElement = TextFieldElement;
	exports.View = View;
	exports.ViewElement = ViewElement;
	exports.WindowElement = WindowElement;
	exports.WindowGroupElement = WindowGroupElement;
	exports.WindowGroupManagerElement = WindowGroupManagerElement;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

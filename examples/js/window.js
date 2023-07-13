window.onload = function(){
    const screen = document.getElementById("screen");
    const app = new burdui.App(screen, document.getElementById("allWindows").buiView);
    app.start();
    /*let canvas = document.createElement("canvas");
    canvas.height = 30;
    canvas.width = 40;
    canvas.style.borderStyle = "1px solid black";
    document.getElementsByClassName("canvasContainer")[0].insertBefore(canvas, screen.children[0]);

     */
};
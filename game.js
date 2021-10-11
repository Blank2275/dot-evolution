var width, height, world;
function setup(){
    createCanvas(windowWidth / 1.03, windowHeight / 1.03);
    rectMode(CENTER);
    width = windowWidth;
    height = windowHeight;
    world = new World(100, width, height);
    frameRate(180);
    //noStroke();
}
function draw(){
    background(255);
    world.runFrame();
}
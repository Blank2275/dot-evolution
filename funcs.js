class World{
    constructor(numDots,w, h){
        this.dots = [];
        this.foodResolution = 30;
        this.xTiles = Math.ceil(w / this.foodResolution);
        this.yTiles = Math.ceil(h / this.foodResolution);
        this.food = [];
        this.w = w;
        this.h = h;
        //bigger the number the less dangerous
        this.redDanger = 260;
        //how fast eating food will exhaust a tile
        this.eatMultiplier = 0.2;
        var noise = new SimplexNoise();
        for(var y = 0; y < this.yTiles; y++){
            this.food.push([]);
            for(var x = 0; x < this.xTiles; x++){
                this.food[y].push(1)
                if((noise.noise2D(x / 10, y / 10) + 1) / 2 < 0.2){
                    this.food[y][x] = -1;
                }
            }
        }
        this.eatRate = 0.03;
        this.regrowRate = 0.0025;
        for(var i = 0; i < numDots; i++){
            this.addDot();
        }
    }
    addDot(x, y, parent){
        var x = x ? x + Math.random() * 10 - 5 :  Math.random() * 40 - 20 + this.w* 0.51;
        var y = y ? y + Math.random() * 10 - 5: Math.random() * 40 - 20 + this.h * 0.51;
        var direction = Math.random() * Math.PI * 2;
        if(parent){
            direction = parent.direction + (Math.random() *( Math.PI / 2) - (Math.PI / 4));
        }
        var dot = new Dot(x, y, direction, this.foodResolution);
        if(parent && false){
            //copy parents brain so changing child won't change parent
            dot.brain = Object.assign(Object.create(Object.getPrototypeOf(parent.brain)), parent.brain);
            dot.brain.mutate();
        }
        this.dots.push(dot);
    }
    runFrame(){
        this.updateFood();
        var dotsToKill = [];
        for(let dot in this.dots){
            this.dots[dot].runFrame(this.food);
            let x = this.dots[dot].x;
            let y = this.dots[dot].y;
            var xTile = Math.floor(x / this.foodResolution);
            var yTile = Math.floor(y / this.foodResolution);
            var sprinting = this.dots[dot].sprinting;
            var sprintingMultiplier = sprinting ? 7 : 1; //if dot is sprinting, make it exhause food tile quicker for balancing
            if(xTile < this.xTiles && yTile < this.yTiles && xTile > 0 && yTile > 0){
                this.food[yTile][xTile] -=  this.eatRate * this.eatMultiplier * sprintingMultiplier;
                if(this.food[yTile][xTile] > 0 && this.food[yTile][xTile] < this.eatRate * this.eatMultiplier * 7 + 0.02){
                    this.food[yTile][xTile] = this.eatRate * this.eatMultiplier * 7 + 0.03;
                }
                if(this.food[yTile][xTile] > 1){
                    this.food[yTile][xTile] = 1;
                }
                if(this.food[yTile][xTile] > 0){
                    this.dots[dot].food += Math.min(this.eatRate, this.food[yTile][xTile] - 0.2);
                } else{
                    this.dots[dot].food += this.food[yTile][xTile] / this.redDanger;
                }
            }
            this.dots[dot].display();
            if(this.dots[dot].food < 0.1){
                dotsToKill.push(dot);
            }
            if(this.dots[dot].food > 2){
                this.dots[dot].x + Math.random() * 10 - 5;
                this.dots[dot].y + Math.random() * 10 - 5;
                this.dots[dot].food = 0.7;
                this.addDot(x, y, this.dots[dot]);
            }
        }
        for(let dot in dotsToKill){
            this.dots.splice(dotsToKill[dot] - dot, 1);
        }
    }
    updateFood(){
        for(var y in this.food){
            for(var x in this.food[y]){
                if(this.food[y][x] > 0){
                    fill(this.food[y][x] * 255);
                    //regrow food
                    this.food[y][x] += this.regrowRate;
                } else{
                    fill(this.food[y][x] * -215 + 40, 40, 40);
                }

                rect(x * this.foodResolution, y * this.foodResolution, this.foodResolution, this.foodResolution);

            }
        }
    }
}

class Dot{
    constructor(x, y, direction, foodResolution){
        var numConditions = Math.floor(Math.random() * 5);
        this.brain = new Brain(numConditions);
        this.direction = direction;
        this.defaultDirection = direction;
        this.x = x;
        this.y = y;
        this.movementSpeed = 1;
        this.food = 1;
        this.starvationRate = 0.008;
        this.sprintHunger = 0.007;
        this.foodResolution = foodResolution;
        this.sprinting = false;
    }
    runFrame(food){
        var xTile = Math.floor(this.x / this.foodResolution);
        var yTile = Math.floor(this.y / this.foodResolution);
        var onRed = food[yTile][xTile];
        //onRed = onRed < 0 ? 1 : -1;
        //find best tile within  two spaces of dot
        var range = 2;
        var foodLoc = [xTile + 1, yTile];
        var foodVal = -1;
        for(var y = yTile - range; y < yTile + range; y++){
            for(var x = xTile - range; x < xTile + range; x++){
                //if dot in screen
                if(this.x > 0 && this.x < width && this.y > 0 && this.y < height){
                //if tile being looked at is on screen
                var xTiles = Math.ceil(width / this.foodResolution);
                var yTiles = Math.ceil(height / this.foodResolution);
                if(x > 0 && x < xTiles && y > 0 && y < yTiles){
                    if(food[y][x] > foodVal){
                        foodLoc = [x, y];
                        foodVal = food[y][x];
                    }
                }
                }
            }
        }
        //find angle to that point
        var foodDirection = Math.atan2(foodLoc[0] - xTile, foodLoc[1] - yTile);
        var instructions = this.brain.runFrame(this.direction, this.x, this.y, onRed, foodDirection);
        var direction = instructions[0];
        var movementMultiplier = 1;                                  
        if(direction != this.direction){
            movementMultiplier = 5;
            this.food -= this.sprintHunger;
            this.sprinting = true;
        } else{
            this.sprinting = false;
        }
        this.direction = direction;

        var xMovement = Math.cos(direction) * this.movementSpeed * movementMultiplier;
        var yMovement = Math.sin(direction) * this.movementSpeed * movementMultiplier;

        this.x += xMovement;
        this.y += yMovement;
        if(this.x < 0){
            this.x = width;
        }
        if(this.x > width){
            this.x = 0;
      //
    
    }
        if(this.y < 0){
            this.y = height;
        }
        if(this.y > height){
            this.y = 0;
        }

        //slowly starve
        this.food -= this.starvationRate;
    }
    display(){
        fill(30, 170, 240);
        ellipse(this.x, this.y, 10, 10);
    } 
}

class Brain{
    constructor(numConditions){
        this.conditions = [];
        for(var i = 0; i < numConditions; i++){
            this.conditions.push(this.genCondition());
        }
    }
    mutate(){
        var addAmount = Math.ceil(Math.random() * 2);
        var subAmount = Math.ceil(Math.random() * 2);
        for(var i = 0; i < addAmount; i++){
            this.conditions.push(this.genCondition());
        }
        for(var i = 0; i < subAmount; i++){
            var index = this.conditions.length - 1;
            this.conditions.splice(index, 1);
        }
        //40% chance of modifying one condition
        if(Math.random() < 0.4){// does this chunk of code even work?! todo: read later
            var conditionToChangeIndex = Math.floor(Math.random() * this.conditions.length);
            var conditionToChange = this.conditions[conditionToChangeIndex];
            //50% chance of changing inputs, 20% chanc of changing operators, 30% chance of changeing response
            //one will always be chosen

            var inputOptions = ["direction", "x", "y"];
            var operatorOptions = ["&&", "||"];
            var comparisonOptions = [">", "<"];

            var rand = Math.random();
            if(rand > 0 && rand < 0.5){
                var indexToChange = Math.floor(Math.random() * conditionToChange["inputs"].length);
                var inputToChange = conditionToChange["inputs"][indexToChange];
                var index = Math.floor(Math.random() * 3);
                switch(index){
                    case 0:
                        inputToChange[0] = inputOptions[Math.floor(Math.random() * inputOptions.length)];
                    case 1:
                        inputToChange[1] = comparisonOptions[Math.floor(Math.random() * comparisonOptions.length)];
                    case 2:
                        inputToChange[2] += Math.random() / 2 - 0.25;
                }
            }
            else if(rand > 0.5 && rand < 0.7){
                var indexToChange = Math.floor(Math.random() * conditionToChange["operators"].length);
                var operatorToChange = conditionToChange["operators"][indexToChange];
                operatorToChange = operatorOptions[Math.floor(Math.random() * operatorOptions.length)];
            } else{
                //resonse
                console.log(conditionToChange);
                conditionToChange["result"][1] += Math.random() / 2 - 0.25;
            }
        }
    }
    genCondition(){
        var numInputs = [];
        var inputOptions = ["direction", "x", "y", "onRed", "foodDirection"];
        var operatorOptions = ["&&", "||"];
        var comparisonOptions = [">", "<"];
        var result = {
            inputs: [],
            operators:[],
            result: []
        }
        for(var i = 0; i < Math.ceil(Math.random() * 3); i++){
            var input = inputOptions[Math.floor(Math.random() * inputOptions.length)];
            var val = 0;
            if(input == "direction"){
                val = Math.random() * Math.PI * 2;
            } else if(input == "x"){
                val = Math.random() * width;
                if(val < width / 2){
                    val /= 5;
                } else{
                    val = width - ((width - val) / 5);
                }
            } else if(input == "y"){
                val = Math.random() * height;
                if(val < height / 2){
                    val /= 5;
                } else{
                    val = height - ((height - val) / 5);
                }
            } else if(input == "onRed"){
                val = Math.random() * 2 - 1;
            } else if(input == "foodDirection"){
                val = Math.random() * Math.PI * 4 - Math.PI * 2;
            }
            var comparison = comparisonOptions[Math.floor(Math.random() * comparisonOptions.length)];
            var operator = operatorOptions[Math.floor(Math.random() * operatorOptions.length)];    
            result["inputs"].push([input, comparison, val]);
            if(i >= 1){
                result["operators"].push(operator);
            }
            result["result"] = ["direction", Math.random() * Math.PI / 32 - Math.PI / 64]
        }
        return result;
    }
    runFrame(direction, x, y, onRed, foodDirection){
        for(var condition of this.conditions){
            var inputs = condition["inputs"];
            var operators = condition["operators"];
            var input1 = inputs[0][0];
            var comp1 = inputs[0][1];
            var val1 = inputs[0][2];
            if(inputs[1]){
                var op1 = operators[0];
                var val2 = inputs[1][2];
                var input2 = inputs[1][0];
                var comp2 = inputs[1][1];
            }
            if(inputs[2]){
                var op2 = operators[1];
                var val3 = inputs[2][2];
                var input3 = inputs[2][0];
                var comp3 = inputs[2][1];
            }
            var val1, val2, val3;
            var computed1 = false;
            var computed2 = false;
            var computed3 = false;
            computed1 = eval(`${input1} ${comp1} ${val1}`);
            if(val2){
                computed2 = eval(`${input2} ${comp2} ${val2}`);
            }
            if(val3){
                computed3 = eval(`${input3} ${comp3} ${val3}`);
            }
            var final = computed1;
            if(input2){
                final = eval(`${final} ${op1} ${computed2}`);
            }
            if(input3){
                final= eval(`${final} ${op2} ${computed3}`);
            }
            if(final){
                var result = condition["result"];
                switch(result[0]){
                    case "direction":
                        direction += result[1];
                }
            }
        }
        return [direction];
    }
}

# dot-evolution
This is a very simple evolution simulator where the only creatures are dots running around the screen. White tiles have food, black tile have no food, red tiles 
make dots hungry. If they are too hungry, they will die, if they have enough food, they will create a mutated copy of themself. Mutation rates are extremely high. 
The dots move in a direction and can turn. They are given basic inputs (direction, x, y, food on current tile, direction to best tile) and  they can check if these
values are greater than or less than a constant value. These can be combined together. These I call "genes". They can then turn a fixed amount based on 
these factors.

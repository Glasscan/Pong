var lastUpdate = 0;
var player, ball, opponent, ai;
var distance; //amount each player moves
var score;
var ballVelocity = [-.3, -.3]; //global to update speed
var sound;

$(document).ready(function () {
    lastUpdate = 0;
    sound = SoundFX();
    ball = Ball();
    score = [0, 0];
    distance = 25; //1/4 of the paddle size

    player = Player('player', 'left');
    player.move(0);
    opponent = Player('opponent', 'right');
    opponent.move(0);
    ai = AI(opponent); // set after 

    requestAnimationFrame(update);
});


$(document).keydown(function (event) {
    var event = event || window.event;
    switch (String.fromCharCode(event.keyCode).toUpperCase()) {
        case 'W':
            player.move(-distance);
            break;
        case 'S':
            player.move(distance);
            break;
    }
    return false;
});

$(document).on('ping:playerScored', function () {
    delete ball;
    score[0]++;
    sound.playSound(4);
    $('#playerScore').text(score[0]);
    ball = Ball();
    ball.start();
});

$(document).on('ping:opponentScored', function () {
    delete ball; //reset the ball
    score[1]++;
    sound.playSound(4);
    $('#opponentScore').text(score[1]);
    ball = Ball();
    ball.start(); //reset the game
});

var Ball = function () {
    var startingPositionX = Math.floor(Math.random()*200 + 500); //random between 500 and 700
    var startingPositionY = Math.floor(Math.random()*200 + 300); //random between 300 and 500

    var velocity = ballVelocity;
    var acceleration = -0.05; //how much faster the ball goes per hit
    var position = [startingPositionX, startingPositionY]; //starting position
    var element = $('#ball');
    var paused = false;

    function move(t) {

        if (position[1] - 10 <= 0 || position[1] + 20 >= 790) { //bounce
                sound.playSound(1);
                velocity[1] = -velocity[1];
        }
        position[0] += velocity[0]*t;
        position[1] += velocity[1]*t;
        

        element.css('left', position[0] + 'px');
        element.css('top', position[1] + 'px');
    }

    function checkScored() {
        if (position[0] <= 5) {
            pause();
            element.css('left', position[0] + 'px');
            element.css('top', position[1] + 'px');
            $(document).trigger('ping:opponentScored');
        }
        if (position[0] >= 1175) {
            pause();
            element.css('left', position[0] + 'px');
            element.css('top', position[1] + 'px');
            $(document).trigger('ping:playerScored');
        }
    }

    function update(t) {
        if (!paused) {
            move(t);
        }

        var playerPosition = player.getPosition();
        if (position[0] <= 30 && position[1] >= playerPosition[1] - 10 && position[1] <= playerPosition[1] + 125) { //bounce off player
            sound.playSound(3);
            velocity[0] += acceleration;
            velocity[0] = -velocity[0];
            acceleration = -acceleration;
        }

        var opponentPosition = opponent.getPosition();
        if (position[0] >= 1150 && position[1] >= opponentPosition[1] && position[1] <= opponentPosition[1] + 125) { //bounce off AI
            sound.playSound(2);
            velocity[0] += acceleration;
            velocity[0] = -velocity[0];
            acceleration = -acceleration;
        }
        checkScored();
    }

    function pause() {
        paused = true;
    }

    function start() {
        paused = false;
    }

    return {
        update: update,
        pause: pause,
        start: start,
        getVelocity: function () { return velocity },
        setVelocity: function (v) { velocity = v; },
        getPosition: function () { return position; },
        setAcceleration: function(a) {acceleration = a},
    }
};

function Player(elementName, side) {
    var position = [10, 300]; //starting position
    var element = $('#'+elementName); //player + side
    var tileSize = 120;

    var move = function (y) { //move up and down only
        position[1] += y;
        if (position[1] <= 10) {
            position[1] = 10;
        }

        if (position[1] >= 800 - 120) { //don't go past bottom
            position[1] = 800 - 120;
        }
        if (side == 'right') {
            position[0] = 1190 - 25;
        }
        element.css('left', position[0] + 'px');
        element.css('top', position[1] + 'px');
    }

    return {
        move: move,
        getSide: function () { return side; },
        getPosition: function () { return position; },
        getSize: function () { return tileSize; },
    }

}

function update(time) {
    var t = time - lastUpdate;
    lastUpdate = time;
    ball.update(t);
    ai.update();
    requestAnimationFrame(update); //from library
}

function AI(playerToControl) {
    var State = {
        WAITING: 0,
        FOLLOWING: 1,
    }
    var currentState = State.FOLLOWING;
    var AILevel = 350;

    function update() {
        switch (currentState) {
            case State.FOLLOWING:{
                    moveTowardsBall();
                    currentState = State.WAITING;
                }
            case State.WAITING:
                break;
        }
    }

    function moveTowardsBall() {
        if (ball.getPosition()[1] >= opponent.getPosition()[1] + opponent.getSize() / 2) {
            opponent.move(distance);
        } else {
            opponent.move(-distance);
        }
        setTimeout(function () {
            currentState = State.FOLLOWING;
        }, AILevel); //follow rate
    }

    function repeat(cbFinal, interval, count) {
        var timeout = function () {
            repeat(cbFinal, interval, count - 1);
        }
        if (count <= 0) {
            cbFinal();
        }
        else {
            cb();
            setTimeout(function () {
                repeat(cbFinal, interval, count - 1);
            }, interval);
        }
    }

    return {
        update: update,
        SetAILevel: function(a) {AILevel = a},
    }
}

function SoundFX() {
    var muting = false;

    function playSound(sfx) {
        if (muting) { // return if muted
            return;
        }
        switch(sfx){
            case 1: {
                document.getElementById("wallHit").play();
                break;
            }
            case 2: {
                document.getElementById("opponentHit").play();
                break;
            }
            case 3: {
                document.getElementById("playerHit").play();
                break;
            }
            case 4: {
                document.getElementById("someoneScored").play();
                break;
            }
            default:
                break;
        }
    }

    return {
        muting: muting,
        playSound: playSound,
        MuteOn: function () {
            muting = true;
            document.getElementById("currentSound").innerHTML = "Off";},
        MuteOff: function () {
            muting = false
            document.getElementById("currentSound").innerHTML = "On"; //update the bottom line
        },
    }
}

function setAI(a) {
    var set = 350 / a;
    ai.SetAILevel(set);

    delete ball; //reset
    score[0] = 0;
    score[1] = 0;
    $('#playerScore').text(score[0]);
    $('#opponentScore').text(score[1]);
    ball = Ball();

    document.getElementById("currentLevel").innerHTML = a; //update the bottom line
    ball.start();
}

function setSpeed(a) {
    var set = 0.10 + 0.08 * a;
    var b = [-set, -set];
    ballVelocity = b;

    delete ball; //reset
    score[0] = 0;
    score[1] = 0;
    $('#playerScore').text(score[0]);
    $('#opponentScore').text(score[1]);
    ball = Ball();
    ball.setVelocity(b);

    document.getElementById("currentSpeed").innerHTML = a; //update the bottom line
    ball.start();
}

function setAcceleration(a) {
    var b = -0.05*a; // a = 0 is off, a = 1 is on

    delete ball; //reset
    score[0] = 0;
    score[1] = 0;
    $('#playerScore').text(score[0]);
    $('#opponentScore').text(score[1]);
    ball = Ball();
    ball.setAcceleration(b);

    if (a == 1) {
        document.getElementById("currentAcceleration").innerHTML = "On"; //update the bottom line
    }
    else {
        document.getElementById("currentAcceleration").innerHTML = "Off"; //update the bottom line
    }
    ball.start();
}
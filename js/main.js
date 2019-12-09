const LOGICAL_WIDTH = 1033;
const LOGICAL_HEIGHT = 1033;
const RES = 3;

// Resize function
function resizeHandler() {
    let newWidth, newHeight, scaleFactor;
    const w = Math.max(window.innerWidth, document.documentElement.clientWidth);
    const h = Math.max(window.innerHeight, document.documentElement.clientHeight);

    if (w > h && w <= maxTabletWidth) {
        scaleFactor = Math.min((w - paddingBottom) / LOGICAL_WIDTH, (h - paddingBottom) / LOGICAL_HEIGHT);
    } else {
        scaleFactor = Math.min(w / LOGICAL_WIDTH, h / LOGICAL_HEIGHT);
    }

    newWidth = Math.ceil(LOGICAL_WIDTH * scaleFactor);
    newHeight = Math.ceil(LOGICAL_HEIGHT * scaleFactor);

    // Add custom btn
    adjustOnTablet(w, h, newWidth, newHeight);

    app.renderer.resize(newWidth, newHeight);
    app.stage.scale.set(scaleFactor);
}

// Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    Sprite = PIXI.Sprite,
    loader = PIXI.loader,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    BitmapText = PIXI.extras.BitmapText,
    TextStyle = PIXI.TextStyle,
    Texture = PIXI.Texture,
    TilingSprite = PIXI.extras.TilingSprite,
    MovieClip = PIXI.extras.MovieClip;

// Create app
let app = new PIXI.Application({
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    // transparent: true,
    autoResize: true,
    backgroundColor: 0xffffff
});
PIXI.RESOLUTION = window.devicePixelRatio;
// Get id Canvas from html
document.getElementById("game").appendChild(app.view);
// Create scene game
let backgroundScene = new Container(),
    gameScene = new Container(),
    roadScene1 = new Container(),
    roadScene2 = new Container(),
    resultScene = new Container();
app.stage.addChild(backgroundScene, gameScene, resultScene);
gameScene.addChild(roadScene1, roadScene2);

// Variables
let introBackground1,
    introBackground2,
    graphicsStart,
    textStart1,
    textStart2,
    background,
    failTexture,
    standTexture,
    throwTextures,
    hitTextures,
    runTextures,
    barTextures,
    gameBackground,
    gameBackground2,
    progressBar,
    progressPoint,
    centerExpand,
    spear,
    resultText,
    resultCenti,
    resultMeter,
    turnText,
    winner,
    whiteLayout,
    box,
    endText,
    totalScoreText,
    totalScoreNum,
    resetText,
    end,
    id,
    //setup
    resultIsShow,
    currentTurn = 0,
    totalTurns = 2,
    scoreListText = [],
    scoreList = [],
    currentScore,
    roadLength,
    numOfBgScreen = 5,
    currentScene = 1,
    canThrow = true,
    isSetPower = false,
    isThrown = false,
    isFailed = false,
    isPaused = false,
    hitTarget = false,
    spearSpeed = 35,
    humanSpeed = 25,
    roadArray = [],
    pointArray = [],
    state,
    charm,
    customBtn,
    customLink = "https://plala.s3-ap-northeast-1.amazonaws.com/web/hikari_game/index.html",
    paddingBottom = 48,
    minTabletWidth = 768,
    maxTabletWidth = 1400,
    bigMobileWidth = 700;

// Load json
app.loader.add("./images/sprite.json").load(setup);

function adjustOnTablet(w, h, newWidth, newHeight) {
    if (w <= maxTabletWidth) {
        if (w > h) {
            addCustomBtn(w, h, newWidth, newHeight);
        } else {
            if (customBtn) {
                customBtn.style.visibility = "hidden";
            }
        }
    }
}

function addCustomBtn(w, h, newWidth, newHeight) {
    if (!customBtn) {
        let imgHtml = `
            <a target="_blank" class='button' href=${customLink}><img src='./images/custombtn.png'/></a>
            `;
        canvas.insertAdjacentHTML("afterend", imgHtml);
        customBtn = document.querySelector(".button");
	setBtnPosition(w, newWidth, newHeight);
    } else {
        customBtn.style.visibility = "visible";
    }
}

function setBtnPosition(w, newWidth, newHeight) {
    let btnWidth;
    let sideSpace = (w - newWidth) / 2;

    if (w < bigMobileWidth) {
        btnWidth = sideSpace < 100 ? sideSpace + "px" : "100px";
    } else {
        btnWidth = sideSpace < 150 ? sideSpace + "px" : "150px";
    }
    let marginRight = sideSpace / 2;
    customBtn.style.right = `${marginRight}px`;
    customBtn.style.top = `${newHeight / 2}px`;
    customBtn.style.transform = `translate(50%,-50%)`;
    customBtn.style.width = btnWidth;
}

//Setup game
function setup(loader, res) {
    canvas = document.querySelector("canvas");
    // Add library - charm
    charm = new Charm(PIXI);

    // Load frames
    loadFrames();

    // Render Intro
    renderIntro1();
    renderIntro2();

    // Render Game Background
    renderGameBackground();

    // Render Result Scene
    renderResultScene();

    // Event Listeners
    listenToEvent();

    // Reset all
    reset();

    // Set resize on device
    resizeHandler();
    // listen to resize event
    window.addEventListener("resize", resizeHandler);

    state = pause;
    app.ticker.add(delta => {
        gameLoop();
    });
}

function gameLoop() {
    state();
}

function pause() {
    charm.update();
    if (currentScene == 3) {
        if (!isPaused) {
            isPaused = true;
            gameBackground.interactive = false;
            progressBar.gotoAndStop(0);
            human.texture = standTexture;
            turnText.texture = Texture.fromImage(`turn${currentTurn + 1}.png`);
            turnText.visible = true;

            setTimeout(() => {
                turnText.visible = false;
                startText.visible = true;
                setTimeout(() => {
                    startText.visible = false;
                    gameBackground.interactive = true;
                    human.destroy();
                    createHuman(runTextures, 0.2, true);
                    human.play();
                    progressBar.play();
                    state = playGame;
                }, 1500);
            }, 2000);
        }
    }
}

// PlayGame
function playGame() {
    isPaused = false;
    charm.update();

    // Background animation
    gameBackground.tilePosition.x -= gameBackground.vx;

    center.x -= center.vx;
    centerExpand.x -= centerExpand.vx;

    if (human.x < 300) {
        human.x += human.vx;
    }

    // Human fails
    if (
        Math.abs(gameBackground.tilePosition.x) >=
        LOGICAL_WIDTH * numOfBgScreen
    ) {
        if (!isFailed) {
            isFailed = true;
            canThrow = false;

            // stop background animation
            gameBackground.vx = 0;
            center.vx = 0;
            centerExpand.vx = 0;

            // human animation
            human.stop();
            human.texture = failTexture;
            human.vx = 4;
            progressBar.stop();

            // Score 0
            scoreList.push(0);

            setTimeout(() => {
                //hide human
                human.visible = false;
                progressBar.visible = false;
                miss.visible = true;
                setTimeout(() => {
                    // Next turn or end game
                    if (currentTurn < totalTurns) {
                        currentTurn++;
                        resetNewTurn();
                    } else {
                        endGame();
                    }
                }, 2500);
            }, 2000);
        }
    }

    // Throw animation
    if (isThrown) {
        let targetX = calculateTargetX(currentScore);
        //Spear animation
        if (spear.x <= 650) {
            spear.x += spear.vx;
        } else {
            // Road animation
            if (Math.abs(roadArray[0].x) <= targetX - 803) {
                //-500 to center the target X)
                gameBackground2.tilePosition.x -= gameBackground2.vx;
                roadArray.forEach(el => {
                    el.x -= el.vx;
                });
                pointArray.forEach(el => {
                    el.x -= el.vx;
                });
                if (Math.abs(roadArray[0].x) + 1300 >= targetX) {
                    if (spear.y <= 650) {
                        spear.y += spear.vy;
                    }
                    if (spear.rotation <= 0) {
                        spear.rotation += 0.1;
                    }
                }
            } else if (
                Math.abs(roadArray[0].x) >= targetX - 803 &&
                !hitTarget
            ) {
                hitTarget = true;
                spear.loop = true;
                spear.play();
                spear.loop = false;
                setTimeout(() => {
                    if (!resultIsShow) {
                        resultIsShow = true;
                        showResult();
                        setTimeout(() => {
                            if (currentTurn < totalTurns) {
                                currentTurn++;
                                resetNewTurn();
                            } else {
                                endGame();
                            }
                        }, 1500);
                    }
                }, 750);
            }
        }
    }
}

// Show result after finish turn
function showResult() {
    renderScore();
    resultMeter.text = `${scoreListText[currentTurn].meterText.text}`;
    resultCenti.text = `${scoreListText[currentTurn].centiText.text}`;

    resultText.visible = true;
    resultMeter.visible = true;
    resultCenti.visible = true;
}

// Reset turn
function reset() {
    [introBackground1, textStart1, backgroundScene].forEach(el => {
        el.visible = true;
    });
    [
        end,
        winner,
        introBackground2,
        textStart2,
        roadScene2,
        resultScene,
        gameScene
    ].forEach(el => {
        el.visible = false;
    });
}

// Reset for new turn
function resetNewTurn() {
    startText.visible = false;
    roadScene2.visible = false;
    roadScene1.visible = true;
    isFailed = false;
    isThrown = false;
    canThrow = true;
    isSetPower = false;
    resultIsShow = false;
    resultText.visible = false;
    resultCenti.visible = false;
    resultMeter.visible = false;
    progressBar.visible = true;
    human.visible = true;
    miss.visible = false;
    hitTarget = false;
    // Reset position of road scene
    setPositionRoadScene1();
    setPositionRoadScene2();
    setSpearPosition();
    state = pause;
}

// Reset new game
function playAgain() {
    currentTurn = 0;
    currentScene = 3;
    isPaused = false;
    gameScene.visible = true;
    resultScene.visible = false;
    human.visible = true;
    spear.visible = true;
    roadScene1.visible = true;
    roadScene2.visible = false;
    end.visible = false;
    winner.visible = false;
    scoreListText.forEach(el => {
        el.meterText.text = "";
        el.centiText.text = "";
    });
    scoreList = [];
    resetNewTurn();
}

// End game and show score
function endGame() {
    state = pause;
    currentScene++;
    roadScene1.visible = false;
    roadScene2.visible = true;
    resultText.visible = false;
    resultCenti.visible = false;
    resultMeter.visible = false;
    human.visible = false;
    spear.visible = false;
    setPositionRoadScene2();
    if (scoreList.indexOf(0) == -1) {
        winner.visible = true;
    } else {
        end.visible = true;
    }
    setTimeout(() => {
        gameScene.visible = false;
        totalScoreNum.text = scoreList.reduce((a, b) => a + b, 0);
        resultScene.visible = true;
    }, 1500);
}

// Collect animate textures
function loadFrames() {
    failTexture = Texture.fromImage("fail1.png");
    standTexture = Texture.fromImage("stand.png");
    runTextures = getTextures(4, "run");
    throwTextures = getTextures(10, "throw");
    barTextures = getTextures(5, "bar");
    spearTextures = getTextures(6, "lao");
}

// Render intro background
function renderIntro1() {
    graphicsStart = new Graphics();
    graphicsStart.beginFill(0xde3249);
    graphicsStart.drawRect(0, LOGICAL_HEIGHT - 223, LOGICAL_WIDTH, 150);
    graphicsStart.alpha = 0;
    graphicsStart.endFill();
    introBackground1 = PIXI.Sprite.from("./images/intro.png");
    introBackground1.width = LOGICAL_WIDTH;
    introBackground1.height = LOGICAL_HEIGHT;
    textStart1 = PIXI.Sprite.from("next1.png");
    textStart1.anchor.set(0.5, 0);
    textStart1.position.set(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 212);
    backgroundScene.addChild(introBackground1, textStart1, graphicsStart);
    charm.pulse(textStart1, 40);
    textStart1.interactive = true;
    textStart1.buttonMode = true;
    graphicsStart.interactive = true;
    graphicsStart.buttonMode = true;
}

// Render intro background
function renderIntro2() {
    introBackground2 = Sprite.from("./images/board.png");
    textStart2 = PIXI.Sprite.from("next.png");
    textStart2.anchor.set(0.5, 0);
    textStart2.position.set(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 150);
    backgroundScene.addChild(introBackground2, textStart2);
    charm.pulse(textStart2, 40);
    textStart2.interactive = true;
    textStart2.buttonMode = true;
}

// Coordinates of the falling point
function calculateTargetX(score) {
    let percent = score / 10000;
    return percent * roadLength;
}

// Get textures of animations
function getTextures(amounts, name) {
    textures = [];
    for (let i = 1; i <= amounts; i++) {
        let texture = Texture.from(`${name}${i}.png`);
        texture.baseTexture.scaleMode = 0;
        textures.push(texture);
    }
    return textures;
}

// Move to next scene after clicked
function moveToNextScene() {
    if (currentScene == 1) {
        currentScene++;
        introBackground1.visible = false;
        textStart1.visible = false;
        introBackground2.visible = true;
        textStart2.visible = true;
    } else if (currentScene == 2) {
        currentScene++;
        backgroundScene.visible = false;
        gameScene.visible = true;
    }
}

// Render game bg
function renderGameBackground() {
    /////////// Road scene 1
    // Show turn text
    turnText = new Text("");
    // background scene game
    gameBackground = new TilingSprite(
        Texture.fromImage("./images/background.png"),
        LOGICAL_WIDTH,
        LOGICAL_HEIGHT
    );
    gameBackground.tilePosition.x = 0;
    gameBackground.tilePosition.y = 0;
    gameBackground.vx = humanSpeed;
    roadScene1.addChild(gameBackground);
    gameBackground.buttonMode = true;
    gameBackground.interactive = true;

    //Center background grow
    center = new Sprite(Texture.from("./images/center.png"));
    center.width = LOGICAL_WIDTH;
    center.height = LOGICAL_HEIGHT;
    roadScene1.addChild(center);

    centerExpand = new Sprite(Texture.from("./images/road-ranger.png"));
    centerExpand.width = 770;
    centerExpand.height = 513;
    centerExpand.anchor.set(0, 1);
    centerExpand.y = LOGICAL_HEIGHT;
    roadScene1.addChild(centerExpand);

    // Progress bar (bar power)
    progressBar = new MovieClip(barTextures);
    progressBar.x = 30;
    progressBar.y = 880;
    roadScene1.addChild(progressBar);
    progressBar.animationSpeed = 0.26;
    progressBar.play();

    // Text START game
    startText = new Sprite(Texture.fromImage("start.png"));
    startText.anchor.set(0.5);
    startText.x = LOGICAL_WIDTH / 2;
    startText.y = 280;
    roadScene1.addChild(startText);
    startText.visible = false;

    // Turn text
    turnText = new Sprite();
    turnText.anchor.set(0.5);
    turnText.x = LOGICAL_WIDTH / 2;
    turnText.y = 290;
    roadScene1.addChild(turnText);

    //Human animation
    createHuman(runTextures, 0.13, true);
    human.stop();
    human.texture = standTexture;

    //Miss throw spear
    miss = new Sprite(Texture.fromImage("fail.png"));
    miss.anchor.set(0.5, 1);
    miss.x = LOGICAL_WIDTH / 2;
    miss.y = LOGICAL_HEIGHT;
    miss.visible = false;
    roadScene1.addChild(miss);

    setPositionRoadScene1();
    ///////////Road scene 2
    // Game background 2
    gameBackground2 = new TilingSprite(
        Texture.fromImage("./images/background.png"),
        LOGICAL_WIDTH,
        LOGICAL_HEIGHT
    );
    gameBackground2.tilePosition.x = 0;
    gameBackground2.tilePosition.y = 0;
    gameBackground2.vx = 0;
    roadScene2.addChild(gameBackground2);

    for (let i = 0; i < 13; i++) {
        let road = new PIXI.Sprite(
            Texture.fromImage("./images/road-ranger.png")
        );
        road.width = 770;
        road.height = 513;
        road.x = 770 * i;
        road.y = LOGICAL_HEIGHT - 513;
        road.vx = 0;
        roadScene2.addChild(road);
        roadArray.push(road);
    }

    for (let i = 0; i < 13; i++) {
        let text = new Text(`${(i + 1) * 10}`, styleWhite);
        text.y = roadArray[i].y - text.height + 70;
        text.x = 770 * (i + 1) - 120;
        text.vx = 0;
        roadScene2.addChild(text);
        pointArray.push(text);
    }
    roadLength = 10 * 770; // Maximum 10 roads

    // Spear
    spear = new MovieClip(spearTextures);
    spear.animationSpeed = 0.4;
    roadScene2.addChild(spear);
    setSpearPosition();

    // Board score text position
    createScoreText(1, 0);
    createScoreText(2, 50);
    createScoreText(3, 100);

    for (let i = 0; i < 3; i++) {
        let meterText = new Text("", styleWhiteSmall);
        meterText.x = 75;
        meterText.y = 30 + i * 50;
        let centiText = new Text("", styleWhiteSmall);
        centiText.x = meterText.x + 90;
        centiText.y = meterText.y;
        scoreListText.push({ meterText, centiText });
        gameScene.addChild(
            scoreListText[i].meterText,
            scoreListText[i].centiText
        );
    }

    // Scene Show Result throw spear
    resultText = new Sprite(Texture.fromImage("result.png"));
    resultText.scale.set(0.8);
    resultText.anchor.set(0.5);
    resultText.x = LOGICAL_WIDTH / 2;
    resultText.y = 400;
    resultText.visible = false;

    resultMeter = new Text("", { ...styleWhite, fontSize: 150 });
    resultMeter.anchor.set(0.5);
    resultMeter.x = 385;
    resultMeter.y = 400;
    resultMeter.visible = false;

    resultCenti = new Text("", { ...styleWhite, fontSize: 150 });
    resultCenti.anchor.set(0.5);
    resultCenti.x = 725;
    resultCenti.y = 400;
    resultCenti.visible = false;

    gameScene.addChild(resultText, resultMeter, resultCenti);

    // Show images if you win 3 turn play game
    winner = new Sprite(Texture.fromImage("winner.png"));
    winner.anchor.set(0.5, 1);
    winner.x = LOGICAL_WIDTH / 2;
    winner.y = LOGICAL_HEIGHT;
    winner.visible = false;
    roadScene2.addChild(winner);

    // Show text end turn play
    end = new Sprite(Texture.fromImage("end.png"));
    end.anchor.set(0.5, 1);
    end.x = LOGICAL_WIDTH / 2;
    end.y = LOGICAL_HEIGHT;
    end.visible = false;
    roadScene2.addChild(end);
}

// Render result scene
function renderResultScene() {
    // Result Background
    resultBackground = new Sprite(Texture.fromImage("./images/background.png"));
    resultBackground.width = LOGICAL_WIDTH;
    resultBackground.height = LOGICAL_HEIGHT;
    resultScene.addChild(resultBackground);

    //White layout
    whiteLayout = new Graphics();
    whiteLayout.beginFill(0xffffff);
    whiteLayout.drawRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    whiteLayout.alpha = 0.3;
    whiteLayout.endFill();
    resultScene.addChild(whiteLayout);

    // Box content result
    box = new Sprite(Texture.fromImage("box.png"));
    box.anchor.set(0.5);
    box.x = LOGICAL_WIDTH / 2;
    box.y = LOGICAL_HEIGHT / 2;
    resultScene.addChild(box);

    // Result text
    endText = new Sprite(Texture.fromImage("endtext2.png"));
    endText.anchor.set(0.5);
    endText.x = LOGICAL_WIDTH / 2;
    endText.y = 100;
    resultScene.addChild(endText);

    // Total Score Text
    totalScoreText = new Text("スコア", { fontSize: 100, fontWeight: "bold" });
    totalScoreText.anchor.set(0, 0.5);
    totalScoreText.x = 100;
    totalScoreText.y = LOGICAL_HEIGHT / 2;
    resultScene.addChild(totalScoreText);

    // Total Score Number
    totalScoreNum = new Text("スコア", {
        fontSize: 150,
        fontWeight: "bold",
        fill: "0x000000"
    });
    totalScoreNum.scale.set(0.75);
    totalScoreNum.anchor.set(1, 0.5);
    // totalScoreNum.roundPixels=true
    // totalScoreText.resolution = 3;
    totalScoreNum.x = 933;
    totalScoreNum.y = LOGICAL_HEIGHT / 2;
    resultScene.addChild(totalScoreNum);

    // ResetText
    resetText = new Sprite(Texture.fromImage("reset2.png"));
    resetText.anchor.set(0.5);
    resetText.x = LOGICAL_WIDTH / 2;
    resetText.y = 900;
    resultScene.addChild(resetText);
    resetText.buttonMode = true;
    resetText.interactive = true;
    charm.pulse(resetText, 40);
}

// Create human animation
function createHuman(textures, speed, loop) {
    human = new MovieClip(textures);
    roadScene1.addChild(human);
    human.position.set(110, 550);
    human.animationSpeed = speed;
    human.loop = loop;
    human.vx = 0;
    human.play();
}

// Calculate score for each turn
function calculateScore(barFrame, distance1, distance2) {
    let totalDistance = LOGICAL_WIDTH * numOfBgScreen;
    distance1 = Math.abs(distance1);
    distance2 = Math.abs(distance2);
    let barScore = (barFrame + 3) * 1000; //3000-7000
    let timeScore = ((totalDistance - distance1) / totalDistance) * 1000; //0-1000
    let distanceScore = (distance2 / totalDistance) * 2000; //0-2000
    let score = Math.round(barScore + distanceScore + timeScore); //3000-10000
    scoreList.push(score);
    return score;
}

// Show score top left
function renderScore() {
    for (let i = 0; i < scoreList.length; i++) {
        let scoreText;
        if (scoreList[i] > 0) {
            scoreText = String(scoreList[i]);
            scoreListText[i].meterText.text = scoreText.slice(0, 2);
            scoreListText[i].centiText.text = scoreText.slice(2);
        } else {
            scoreListText[i].meterText.text = "";
            scoreListText[i].centiText.text = "";
        }
    }
}

// Show score each turn
function createScoreText(number, height) {
    let numberText = new Text(`${number}.`, stylePoint);
    numberText.x = 30;
    numberText.y = 30 + height;

    let meterText = new Text("m", stylePoint);
    meterText.x = numberText.x + 90;
    meterText.y = numberText.y;

    let centiText = new Text("cm.", stylePoint);
    centiText.x = meterText.x + 90;
    centiText.y = meterText.y;

    let rect = new Graphics();
    rect.beginFill(0x000000);
    rect.drawRect(30, 73 + height, 250, 6);
    rect.endFill();
    gameScene.addChild(numberText, meterText, centiText, rect);
}

// Event listeners
function listenToEvent() {
    [textStart1, graphicsStart, textStart2].forEach(el => {
        el.on("pointerdown", moveToNextScene);
    });

    gameBackground.on("pointerdown", () => {
        if (!isSetPower) {
            setPower();
        } else {
            if (!isThrown && canThrow) {
                throwSpear();
            }
        }
    });

    resetText.on("pointerdown", playAgain);
}

// Get progress bar power
function setPower() {
    isSetPower = true;
    progressBar.stop();
    currentBarFrame = progressBar.currentFrame;
    currentPosition = gameBackground.tilePosition.x; // Position at the first click
}

// Throw spear
function throwSpear() {
    isThrown = true;
    canThrow = false;
    // Stop background animation
    gameBackground.vx = 0;
    center.vx = 0;
    centerExpand.vx = 0;

    //Change human animation
    human.destroy();
    gameBackground.vx = 0;
    createHuman(throwTextures, 0.5, false);
    setTimeout(() => {
        // Calculate score
        currentScore = calculateScore(
            currentBarFrame,
            currentPosition,
            gameBackground.tilePosition.x
        );

        // Render throw scene
        roadScene1.visible = false;
        roadScene2.visible = true;
        gameBackground2.vx = spearSpeed;
        roadArray.forEach(el => {
            el.vx = spearSpeed;
        });
        pointArray.forEach(el => {
            el.vx = spearSpeed;
        });
        spear.vx = spearSpeed;
        spear.vy = spearSpeed;
    }, 400);
}

// Reset position of road scene 1 each turn
function setPositionRoadScene1() {
    gameBackground.tilePosition.x = 0;
    center.x = LOGICAL_WIDTH * numOfBgScreen;
    centerExpand.x = LOGICAL_WIDTH * (numOfBgScreen + 1);
    gameBackground.vx = humanSpeed;
    center.vx = humanSpeed;
    centerExpand.vx = humanSpeed;
    human.x = 110;
    human.vx = 0;
}

// Reset position of road scene 2 each turn
function setPositionRoadScene2() {
    for (let i = 0; i < 13; i++) {
        roadArray[i].x = 770 * i;
        roadArray[i].vx = 0;
        pointArray[i].x = 770 * (i + 1) - 120;
        pointArray[i].vx = 0;
    }
}

// Reset position of the spear each turn
function setSpearPosition() {
    spear.gotoAndStop(0);
    spear.x = -100;
    spear.y = 190;
    spear.vx = 10;
    spear.rotation = -0.73;
    spear.anchor.set(1, 0.5);
}

const titleScreen = document.getElementById("titleScreen");
const playScreen = document.getElementById("playScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const backBtn = document.getElementById("backBtn");
const shareBtn = document.getElementById("shareBtn");
const homeBtn = document.getElementById("homeBtn");

const vineLayer = document.getElementById("vineLayer");
const monkey = document.getElementById("monkey");
const banana = document.getElementById("banana");

const stageText = document.getElementById("stageText");
const hpText = document.getElementById("hpText");
const damageText = document.getElementById("damageText");

const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultCharacter = document.getElementById("resultCharacter");

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");

const countdown = document.getElementById("countdown");
const fade = document.getElementById("fade");
const bgm = document.getElementById("bgm");

const seStart = new Audio("start.mp3");
const seDamage = new Audio("damage.mp3");
const seHeal = new Audio("heal.mp3");
const seClear = new Audio("clear.mp3");
const seResult = new Audio("result.mp3");

let gameWidth = 0;
let gameHeight = 0;

let stage = 1;
let hp = 5;

let monkeyY = 0;
let velocityY = 0;
let inputDir = 0;

let scrollX = 0;
let scrollSpeed = 2.5;
let gapHeight = 130;
let wavePower = 95;
let thornInterval = 54;

let topPoints = [];
let bottomPoints = [];
let bandages = [];

let stageLength = 2700;
let bananaWorldX = 2500;

let playing = false;
let lastTime = 0;
let hitCooldown = 0;
let bgmFadeTimer = null;

const maxHp = 5;
const maxStage = 5;
const monkeyX = 80;

const gameUrl = "https://afoolhippo.github.io/game10/";
const homeUrl = "https://afoolhippo.github.io/home/?skipTitle=1";

function playSE(sound){
  if(!sound) return;
  sound.currentTime = 0;
  sound.play().catch(()=>{});
}

function showScreen(screen){
  titleScreen.classList.remove("active");
  playScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  screen.classList.add("active");
}

function resizeGame(){
  const rect = playScreen.getBoundingClientRect();
  gameWidth = rect.width || window.innerWidth;
  gameHeight = rect.height || window.innerHeight;
}

function startBGM(){
  if(!bgm) return;

  bgm.loop = true;

  if(bgm.paused){
    bgm.volume = 0.5;
    bgm.play().catch(()=>{});
  }
}

function stopBGM(){
  if(!bgm) return;

  if(bgmFadeTimer){
    clearInterval(bgmFadeTimer);
    bgmFadeTimer = null;
  }

  bgm.pause();
  bgm.currentTime = 0;
}

function setBGMVolume(volume){
  if(!bgm) return;
  bgm.volume = Math.max(0, Math.min(1, volume));
}

function fadeBGMTo(targetVolume, duration = 900){
  if(!bgm) return;

  if(bgmFadeTimer){
    clearInterval(bgmFadeTimer);
    bgmFadeTimer = null;
  }

  const startVolume = bgm.volume;
  const diff = targetVolume - startVolume;
  const startTime = performance.now();

  bgmFadeTimer = setInterval(()=>{
    const t = Math.min(1, (performance.now() - startTime) / duration);
    bgm.volume = startVolume + diff * t;

    if(t >= 1){
      clearInterval(bgmFadeTimer);
      bgmFadeTimer = null;
    }
  },30);
}

function startGame(){
  stage = 1;
  hp = maxHp;

  playSE(seStart);
  startBGM();

  showScreen(playScreen);

  requestAnimationFrame(()=>{
    resizeGame();
    prepareStage(true);
  });
}

function prepareStage(withCountdown){
  playing = false;

  scrollX = 0;
  hitCooldown = 0;
  inputDir = 0;
  velocityY = 0;

  monkey.src = "saru.png";

  updateDifficulty();

  stageLength = 2500 + stage * 120;
  bananaWorldX = stageLength - 130;

  generateStage();

  monkeyY = getGapCenterY(monkeyX);
  monkey.style.top = `${monkeyY}px`;

  updateHUD();
  draw();

  if(withCountdown){
    runCountdown(startStage);
  }else{
    startStage();
  }
}

function startStage(){
  fadeBGMTo(1, 900);

  playing = true;
  lastTime = performance.now();

  requestAnimationFrame(loop);
}

function runCountdown(callback){
  let count = 3;

  setBGMVolume(0.5);

  countdown.style.display = "flex";

  function renderCount(text){
    countdown.innerHTML = `
      <div class="stage-count">STAGE ${stage}</div>
      <div class="count-number">${text}</div>
    `;
  }

  renderCount(count);

  const timer = setInterval(()=>{
    count--;

    if(count > 0){
      renderCount(count);
    }else if(count === 0){
      renderCount("START");
    }else{
      clearInterval(timer);
      countdown.style.display = "none";
      callback();
    }
  },700);
}

function updateDifficulty(){
  const progress = stage - 1;

  gapHeight = Math.max(80, 150 - progress * 17);
  scrollSpeed = 2.35 + progress * 0.22;
  wavePower = 70 + progress * 18;
  thornInterval = Math.max(36, 70 - progress * 8);
}

function updateHUD(){
  stageText.textContent = `STAGE ${stage}`;
  hpText.textContent = "♥".repeat(hp) + "♡".repeat(maxHp - hp);
}

function generateStage(){
  topPoints = [];
  bottomPoints = [];
  bandages = [];

  const pointGap = 120;
  let centerY = gameHeight / 2;

  for(let x = 0; x <= bananaWorldX; x += pointGap){
    centerY += (Math.random() - 0.5) * wavePower;

    const minCenter = 135;
    const maxCenter = gameHeight - 185;

    centerY = Math.max(minCenter, Math.min(maxCenter, centerY));

    topPoints.push({
      x,
      y: centerY - gapHeight / 2
    });

    bottomPoints.push({
      x,
      y: centerY + gapHeight / 2
    });

    const bandageChance = Math.max(0.015, 0.06 - stage * 0.006);

    if(
      x > 500 &&
      x < bananaWorldX - 500 &&
      Math.random() < bandageChance
    ){
      bandages.push({
        x: x + 45,
        y: centerY + (Math.random() - 0.5) * (gapHeight * 0.4),
        used: false
      });
    }
  }
}

function createSVG(tag){
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function pointsToSmoothPath(points){
  if(!points.length) return "";

  let d = `M ${points[0].x - scrollX} ${points[0].y}`;

  for(let i = 1; i < points.length; i++){
    const prev = points[i - 1];
    const curr = points[i];

    const cx1 = prev.x + 60 - scrollX;
    const cy1 = prev.y;
    const cx2 = curr.x - 60 - scrollX;
    const cy2 = curr.y;

    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x - scrollX} ${curr.y}`;
  }

  return d;
}

function draw(){
  vineLayer.innerHTML = "";

  drawPath(topPoints);
  drawPath(bottomPoints);
  drawThorns(topPoints, true);
  drawThorns(bottomPoints, false);
  drawBandages();
  drawBanana();
}

function drawPath(points){
  const shadow = createSVG("path");
  shadow.setAttribute("d", pointsToSmoothPath(points));
  shadow.setAttribute("class", "vineShadow");
  vineLayer.appendChild(shadow);

  const vine = createSVG("path");
  vine.setAttribute("d", pointsToSmoothPath(points));
  vine.setAttribute("class", "vine");
  vineLayer.appendChild(vine);
}

function getPointOnSegment(a, b, x){
  const t = (x - a.x) / (b.x - a.x);
  return a.y + (b.y - a.y) * t;
}

function drawThorns(points, isTop){
  for(let i = 0; i < points.length - 1; i++){
    const a = points[i];
    const b = points[i + 1];

    for(let x = a.x; x < b.x; x += thornInterval){
      const y = getPointOnSegment(a, b, x);
      const sx = x - scrollX;

      if(sx < -50 || sx > gameWidth + 50) continue;

      const thorn = createSVG("polygon");

      if(isTop){
        thorn.setAttribute(
          "points",
          `${sx - 7},${y + 5} ${sx + 7},${y + 5} ${sx},${y + 25}`
        );
      }else{
        thorn.setAttribute(
          "points",
          `${sx - 7},${y - 5} ${sx + 7},${y - 5} ${sx},${y - 25}`
        );
      }

      thorn.setAttribute("class","thorn");
      vineLayer.appendChild(thorn);
    }
  }
}

function drawBandages(){
  bandages.forEach((b)=>{
    if(b.used) return;

    const sx = b.x - scrollX;

    if(sx < -50 || sx > gameWidth + 50) return;

    const text = createSVG("text");
    text.setAttribute("x",sx);
    text.setAttribute("y",b.y);
    text.setAttribute("font-size","28");
    text.setAttribute("text-anchor","middle");
    text.setAttribute("dominant-baseline","middle");
    text.textContent = "🩹";

    vineLayer.appendChild(text);
  });
}

function drawBanana(){
  const bananaX = bananaWorldX - scrollX;
  const bananaY = getGapCenterY(bananaWorldX);

  banana.style.left = `${bananaX}px`;
  banana.style.top = `${bananaY}px`;
}

function getY(points, worldX){
  for(let i = 0; i < points.length - 1; i++){
    const a = points[i];
    const b = points[i + 1];

    if(worldX >= a.x && worldX <= b.x){
      return getPointOnSegment(a, b, worldX);
    }
  }

  if(points.length){
    return points[points.length - 1].y;
  }

  return gameHeight / 2;
}

function getGapCenterY(worldX){
  const topY = getY(topPoints, worldX);
  const bottomY = getY(bottomPoints, worldX);
  return (topY + bottomY) / 2;
}

function collisionCheck(){
  const worldX = scrollX + monkeyX;

  const topY = getY(topPoints, worldX);
  const bottomY = getY(bottomPoints, worldX);

  const hitMargin = 31;

  if(
    monkeyY <= topY + hitMargin ||
    monkeyY >= bottomY - hitMargin
  ){
    damage();
  }
}

function damage(){
  if(hitCooldown > 0) return;

  hitCooldown = 1000;
  hp--;

  playSE(seDamage);

  if(hp <= 2){
    monkey.src = "result_bad.png";
  }else{
    monkey.src = "result_normal.png";
  }

  updateHUD();

  damageText.style.left = "118px";
  damageText.style.top = `${monkeyY - 32}px`;

  damageText.classList.remove("show");
  void damageText.offsetWidth;
  damageText.classList.add("show");

  monkey.style.transform = "translateY(-50%) translateX(-5px)";

  setTimeout(()=>{
    monkey.style.transform = "translateY(-50%)";
  },250);

  if(hp <= 0){
    gameOver();
  }
}

function checkBandages(){
  bandages.forEach((b)=>{
    if(b.used) return;

    const sx = b.x - scrollX;
    const dx = sx - monkeyX;
    const dy = b.y - monkeyY;

    if(Math.sqrt(dx * dx + dy * dy) < 34){
      b.used = true;
      hp = Math.min(maxHp, hp + 1);

      playSE(seHeal);

      if(hp >= 3){
        monkey.src = "saru.png";
      }

      updateHUD();
    }
  });
}

function checkGoal(){
  const monkeyWorldX = scrollX + monkeyX;

  if(monkeyWorldX >= bananaWorldX){
    stageClear();
  }
}

function getRankName(clearedStage){
  if(clearedStage <= 1){
    return "半泣きモンキー";
  }

  if(clearedStage <= 3){
    return "汗だくモンキー";
  }

  return "サルトリモンキー";
}

function getResultImage(clearedStage){
  if(clearedStage <= 1){
    return "result_bad.png";
  }

  if(clearedStage <= 3){
    return "result_normal.png";
  }

  return "result_good.png";
}

function getShareText(clearedStage, reachedStage, isClear){
  const rank = getRankName(clearedStage);

  if(isClear){
    return `サルトリモンキーになった🍌🐒

全5面クリア！

${rank}

無料ブラウザゲーム
「サルトリイバラ」
${gameUrl}

#サルトリイバラ
#カバゲーセン`;
  }

  if(clearedStage <= 1){
    return `トゲだらけになった…🌿🐒

STAGE ${reachedStage}

${rank}

無料ブラウザゲーム
「サルトリイバラ」
${gameUrl}

#サルトリイバラ
#カバゲーセン`;
  }

  if(clearedStage <= 3){
    return `イバラをくぐり抜けた…！🌿💦🐒

STAGE ${reachedStage}

${rank}

無料ブラウザゲーム
「サルトリイバラ」
${gameUrl}

#サルトリイバラ
#カバゲーセン`;
  }

  return `サルトリモンキーになった🍌🐒

STAGE ${reachedStage}

${rank}

無料ブラウザゲーム
「サルトリイバラ」
${gameUrl}

#サルトリイバラ
#カバゲーセン`;
}

function stageClear(){
  playing = false;
  inputDir = 0;
  velocityY = 0;

  playSE(seClear);

  if(stage >= maxStage){
    clearGame();
    return;
  }

  monkey.src = "result_good.png";

  fade.classList.add("show");

  setTimeout(()=>{
    stage++;

    setTimeout(()=>{
      prepareStage(true);

      setTimeout(()=>{
        fade.classList.remove("show");
      },250);
    },350);
  },550);
}

function showResult(clearedStage, reachedStage, isClear){
  stopBGM();
  playSE(seResult);

  showScreen(resultScreen);
  fade.classList.remove("show");

  resultTitle.textContent = isClear ? "CLEAR!" : "RESULT";
  resultCharacter.src = getResultImage(clearedStage);

  if(isClear){
    resultMessage.innerHTML = `
      全5面クリア！<br><br>
      ${getRankName(clearedStage)}
    `;
  }else{
    resultMessage.innerHTML = `
      到達 STAGE ${reachedStage}<br>
      クリア ${clearedStage} 面<br><br>
      ${getRankName(clearedStage)}
    `;
  }

  shareBtn.onclick = ()=>{
    const shareText = getShareText(clearedStage, reachedStage, isClear);
    const url =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(shareText);

    window.open(url, "_blank");
  };
}

function clearGame(){
  playing = false;
  inputDir = 0;
  velocityY = 0;

  fade.classList.add("show");

  setTimeout(()=>{
    showResult(maxStage, maxStage, true);
  },550);
}

function gameOver(){
  playing = false;
  inputDir = 0;
  velocityY = 0;

  const clearedStage = Math.max(0, stage - 1);
  const reachedStage = stage;

  fade.classList.add("show");

  setTimeout(()=>{
    showResult(clearedStage, reachedStage, false);
  },550);
}

function loop(now){
  if(!playing) return;

  const delta = now - lastTime;
  lastTime = now;

  const dt = delta / 16.67;

  scrollX += scrollSpeed * dt;

  velocityY += inputDir * 0.75 * dt;
  velocityY *= 0.86;

  const maxSpeed = 7.0;
  velocityY = Math.max(-maxSpeed, Math.min(maxSpeed, velocityY));

  monkeyY += velocityY * dt;

  const worldX = scrollX + monkeyX;
  const topLimit = getY(topPoints, worldX) + 30;
  const bottomLimit = getY(bottomPoints, worldX) - 30;

  if(monkeyY < topLimit){
    monkeyY = topLimit;
    velocityY = 0;
    damage();
  }

  if(monkeyY > bottomLimit){
    monkeyY = bottomLimit;
    velocityY = 0;
    damage();
  }

  monkey.style.top = `${monkeyY}px`;

  if(hitCooldown > 0){
    hitCooldown -= delta;
  }

  draw();

  checkGoal();

  if(!playing) return;

  collisionCheck();
  checkBandages();

  requestAnimationFrame(loop);
}

function pressUp(e){
  if(e) e.preventDefault();
  inputDir = -1;
}

function pressDown(e){
  if(e) e.preventDefault();
  inputDir = 1;
}

function releaseMove(e){
  if(e) e.preventDefault();
  inputDir = 0;
}

upBtn.addEventListener("pointerdown", pressUp);
downBtn.addEventListener("pointerdown", pressDown);

upBtn.addEventListener("pointerup", releaseMove);
downBtn.addEventListener("pointerup", releaseMove);

upBtn.addEventListener("pointercancel", releaseMove);
downBtn.addEventListener("pointercancel", releaseMove);

upBtn.addEventListener("pointerleave", releaseMove);
downBtn.addEventListener("pointerleave", releaseMove);

window.addEventListener("keydown", (e)=>{
  if(e.key === "ArrowUp") inputDir = -1;
  if(e.key === "ArrowDown") inputDir = 1;
});

window.addEventListener("keyup", (e)=>{
  if(e.key === "ArrowUp" || e.key === "ArrowDown"){
    inputDir = 0;
  }
});

startBtn.addEventListener("click", startGame);

retryBtn.addEventListener("click", ()=>{
  stopBGM();
  playing = false;
  inputDir = 0;
  velocityY = 0;
  showScreen(titleScreen);
});

backBtn.addEventListener("click", ()=>{
  stopBGM();
  playing = false;
  inputDir = 0;
  velocityY = 0;
  showScreen(titleScreen);
});

homeBtn.addEventListener("click", ()=>{
  stopBGM();
  location.href = homeUrl;
});

window.addEventListener("resize", resizeGame);
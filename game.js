document.addEventListener('DOMContentLoaded', () => {
  const FRAMES_PER_SECOND = 30;
  const FRAME_MIN_TIME = 1000 / FRAMES_PER_SECOND;
  const KEYS = {
    LEFT: 'KeyA',
    ALT_LEFT: 'ArrowLeft',
    RIGHT: 'KeyD',
    ALT_RIGHT: 'ArrowRight',
    SPACE: 'Space',
  };
  const game = {
    runnning: true,
    ctx: null,
    platform: null,
    ball: null,
    blocks: [],
    score: 0,
    rows: 4,
    cols: 8,
    blockOffsetX: 4,
    blockOffsetY: 4,
    screenOffsetX: 65,
    screenOffsetY: 35,
    screenWidth: 640,
    screenHeight: 360,
    sprites: {
      platform: null,
      background: null,
      ball: null,
      block: null,
    },
    sounds: {
      bump: null
    },

    init() {
      this.ctx = document.querySelector('#mycanvas').getContext('2d');
      this.setTextFont();
      this.setEvents();
    },
    setTextFont() {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '20px';
    },
    setEvents() {
      window.addEventListener('keydown', (evt) => {
        // console.log(evt.code);

        if (evt.code == KEYS.LEFT
            || evt.code == KEYS.ALT_LEFT
            || evt.code == KEYS.RIGHT
            || evt.code == KEYS.ALT_RIGHT
          ) {
          this.platform.start(evt.code);
        }
        if (evt.code == KEYS.SPACE) {
          this.platform.startBall();
          // this.ball.start();
        }
      });
      window.addEventListener('keyup', (evt) => {
        this.platform.stop();
      });
    },
    create() {
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          this.blocks.push({
            x: (60 + this.blockOffsetX) * col + this.screenOffsetX,
            y: (20 + this.blockOffsetY) * row + this.screenOffsetY,
            width: 60,
            height: 20,
            active: true,
          })
        }
      }
    },
    preload(callback) {
      let loaded = 0;
      let required = Object.keys(this.sprites).length;
      required += Object.keys(this.sounds).length;

      const onSourceLoad = () => {
        loaded += 1;
        if (loaded == required - 1) {
          callback();
        }
      }
      this.preloadSprites(onSourceLoad);
      this.preloadSounds(onSourceLoad);
    },
    preloadSprites(callback) {
      for (const key in this.sprites) {
        this.sprites[key] = new Image();
        this.sprites[key].src = `img/${key}.png`;
        this.sprites[key].addEventListener('load', callback);
      }
    },
    preloadSounds(callback) {
      for (const key in this.sounds) {
        this.sounds[key] = new Audio(`sounds/${key}.mp3`);
        this.sounds[key].addEventListener('canplaythrough', callback, {
          once: true
        });
      }
    },
    update() {
      this.collideBlocks();
      this.collidePlatform();
      this.ball.collideWorldBounds();
      this.platform.collideWorldBounds();
      this.platform.move();
      this.ball.move();
    },
    end(msg) {
      this.runnning = false;
      alert(msg);
      window.location.reload();
    },
    addScore() {
      this.score += 1;
      if (this.score >= this.blocks.length) {
        this.end('Victory!');
      }
    },
    collideBlocks() {
      for (const block of this.blocks) {
        if (block.active && this.ball.collide(block)) {
          this.ball.bumbBlock(block);
          this.addScore();
          this.sounds.bump.play();
        }
      }
    },
    collidePlatform() {
      if (this.ball.collide(this.platform)) {
        // console.log('collide', this.platform);
        this.ball.bumbPlatform(this.platform);
        this.sounds.bump.play();
      }
    },
    frameRateRun() {
      let lastFrameTime = window.performance.now();
      const updateFrame = (time) => {
        if (!this.runnning) {
          return;
        }
        if(time - lastFrameTime < FRAME_MIN_TIME){ //skip the frame if the call is too early
          requestAnimationFrame(updateFrame);
          return; // return as there is nothing to do
        }
        lastFrameTime = time - ((time - lastFrameTime) % FRAME_MIN_TIME); // remember the time of the rendered frame
        // render the frame
        this.update();
        this.render();
        frames++;
        requestAnimationFrame(updateFrame); // get next farme
      }
      requestAnimationFrame(updateFrame);
    },
    
    // run() {
    //   window.requestAnimationFrame(() => {
    //     this.update();
    //     this.render();
    //     this.run();
    //   });
    // },
    renderBlocks() {
      for (const block of this.blocks) {
        if (block.active) {
          this.ctx.drawImage(this.sprites.block, block.x, block.y);
        }
      }
    },
    render() {
      this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);

      this.ctx.drawImage(this.sprites.background, 0, 0);
      this.ctx.drawImage(this.sprites.ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height,);
      this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
      this.renderBlocks();

      this.ctx.fillText(`Score: ${this.score * 100}`, 15, 20);
    },
    start() {
      this.init();
      this.preload(() => {
        this.create();
        // this.run();
        this.frameRateRun();
      });
    },
    getRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
  };

  game.ball = {
    x: 320,
    y: 280,
    width: 20,
    height: 20,
    dx: 0,
    dy: 0,
    velocity: 6,
    frame: 0,
    start() {
      this.dy = -this.velocity;
      this.dx = game.getRandom(-this.velocity, this.velocity);
    },
    move() {
      if (this.dy) {
        this.y += this.dy;
      }
      if (this.dx) {
        this.x += this.dx;
      }
      if (this.dx || this.dy) {
        this.frame += 1;
        if (this.frame > 3) {
          this.frame = 0;
        }
      }
    },
    collide(elem) {
      const x = this.x + this.dx;
      const y = this.y + this.dy;

      if (
        x + this.width > elem.x 
        && x < elem.x + elem.width
        && y + this.height > elem.y 
        && y < elem.y + elem.height
      ) {
        return true;
      } else {
        return false;
      }
    },
    bumbBlock(block) {
      this.dy *= -1;
      block.active = false;
    },
    bumbPlatform(platform) {
      if (this.dy < 0) {
        return;
      }
      this.dy = -this.velocity;
      const touchX = this.x + this.width / 2;
      // console.log(platform.getTouchOffset(touchX));
      this.dx = this.velocity * platform.getTouchOffset(touchX);
    },
    collideWorldBounds() {
      const x = this.x + this.dx,
            y = this.y + this.dy,
            ballLeft = x,
            ballRight = ballLeft + this.width,
            ballTop = y,
            ballBottom = y + this.height,
            worldLeft = 0,
            worldRight = game.screenWidth,
            worldTop = 0,
            worldBottom = game.screenHeight;

      if (ballLeft < worldLeft) {
        this.x = 0;
        this.dx = this.velocity;
      } else if (ballRight > worldRight) {
        this.x = worldRight - this.width;
        this.dx = -this.velocity;
      } else if (ballTop < worldTop) {
        this.y = 0;
        this.dy = this.velocity;
      } else if (ballBottom > worldBottom) {
        // this.y = worldBottom - this.height;
        // this.dy = -this.velocity;
        game.end('Game Over');
      }
    },
  };

  game.platform = {
    velocity: 12,
    dx: 0,
    x: 280,
    y: 300,
    width: 100,
    height: 14,
    ball: game.ball,
    isBallStarted: false,
    start(direction) {
      if (direction == KEYS.LEFT || direction == KEYS.ALT_LEFT) {
        this.dx = -this.velocity;
      } else if (direction == KEYS.RIGHT || direction == KEYS.ALT_RIGHT) {
        this.dx = this.velocity;
      }
    },
    stop() {
      this.dx = 0;
    },
    startBall() {
      if (!this.isBallStarted) {
        this.isBallStarted = true;
        this.ball.start();
      }
    },
    move() {
      if (this.dx) {
        this.x += this.dx;
        if (!this.isBallStarted) {
          this.ball.x += this.dx;
        }
      }
    },
    getTouchOffset(x) {
      const diff = (this.x + this.width) - x;
      const offset = this.width - diff;
      const res = (2 * offset / this.width) - 1;
      return res;
    },
    collideWorldBounds() {
      const x = this.x + this.dx,
            boundLeft = x,
            boundRight = boundLeft + this.width,
            worldLeft = 0,
            worldRight = game.screenWidth;

      if (boundLeft < worldLeft || boundRight > worldRight) {
        this.stop();
      }
    },
  };

  game.start();
});
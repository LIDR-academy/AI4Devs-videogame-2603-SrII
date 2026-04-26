import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PAUSE_OVERLAY_ALPHA,
  PAUSE_OVERLAY_COLOR,
  PAUSE_TEXT_COLOR,
  PAUSE_HEADLINE_FONT_SIZE,
  PAUSE_PROMPT_FONT_SIZE,
  HUD_FONT_FAMILY,
} from '../config.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, PAUSE_OVERLAY_COLOR, PAUSE_OVERLAY_ALPHA)
      .setOrigin(0, 0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'PAUSED', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${PAUSE_HEADLINE_FONT_SIZE}px`,
        color: PAUSE_TEXT_COLOR,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Press P or Esc to resume', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${PAUSE_PROMPT_FONT_SIZE}px`,
        color: PAUSE_TEXT_COLOR,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Press Q to quit to title', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${PAUSE_PROMPT_FONT_SIZE}px`,
        color: PAUSE_TEXT_COLOR,
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-P', () => this.resume());
    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.input.keyboard.on('keydown-Q', () => this.quitToTitle());
  }

  resume() {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  quitToTitle() {
    this.scene.stop();
    this.scene.stop('GameScene');
    this.scene.start('TitleScene');
  }
}

import { GAME_WIDTH, GAME_HEIGHT, HUD_FONT_FAMILY } from '../config.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.score = data?.score ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a1a0a');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'LEVEL CLEARED!', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '52px',
        color: '#ffe44a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Score: ${this.score}`, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press any key to play again', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '20px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown', () => this.scene.start('TitleScene'));
  }
}

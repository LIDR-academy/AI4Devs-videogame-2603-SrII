import { GAME_WIDTH, GAME_HEIGHT, HUD_FONT_FAMILY } from '../config.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.reason = data?.reason ?? 'killed';
    this.score = data?.score ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');

    const headline = this.reason === 'time_up' ? 'OUT OF TIME' : 'GAME OVER';

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, headline, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '56px',
        color: '#ff5555',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `Score: ${this.score}`, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press any key to retry', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '20px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown', () => this.scene.start('TitleScene'));
  }
}

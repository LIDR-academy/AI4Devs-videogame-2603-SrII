import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'CONTRA-AC', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Press any key to start', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown', () => this.scene.start('GameScene'));
  }
}

import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a3a1a');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Game Scene (placeholder)', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}

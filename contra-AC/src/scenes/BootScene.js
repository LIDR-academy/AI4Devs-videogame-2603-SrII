export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No assets in Phase 1. Phase 2 owns asset preloading.
  }

  create() {
    this.scene.start('TitleScene');
  }
}

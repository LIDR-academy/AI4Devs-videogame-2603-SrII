import {
  PLAYER_MAX_HP,
  HUD_MARGIN,
  HUD_PIP_SIZE,
  HUD_PIP_SPACING,
  HUD_PIP_FILL_COLOR,
  HUD_PIP_STROKE_COLOR,
  HUD_SCORE_X,
  HUD_SCORE_FONT_SIZE,
  HUD_TIMER_X,
  HUD_TIMER_FONT_SIZE,
  HUD_FONT_FAMILY,
} from '../config.js';

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.pips = [];

    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      const x = HUD_MARGIN + i * (HUD_PIP_SIZE + HUD_PIP_SPACING);
      const pip = scene.add
        .rectangle(x, HUD_MARGIN, HUD_PIP_SIZE, HUD_PIP_SIZE, HUD_PIP_FILL_COLOR)
        .setOrigin(0, 0)
        .setStrokeStyle(2, HUD_PIP_STROKE_COLOR)
        .setScrollFactor(0);
      this.pips.push(pip);
    }

    this.scoreText = scene.add
      .text(HUD_SCORE_X, HUD_MARGIN, 'SCORE: 0', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${HUD_SCORE_FONT_SIZE}px`,
        color: '#ffffff',
      })
      .setScrollFactor(0);

    this.timerText = scene.add
      .text(HUD_TIMER_X, HUD_MARGIN - 2, '00', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${HUD_TIMER_FONT_SIZE}px`,
        color: '#ffffff',
      })
      .setScrollFactor(0);

    scene.events.on('player-hp-changed', (hp) => this.setHp(hp));
    scene.events.on('score-changed', (score) => this.setScore(score));
    scene.events.on('timer-changed', (sec) => this.setTimer(sec));
  }

  setHp(hp) {
    this.pips.forEach((pip, i) => {
      if (i < hp) pip.setFillStyle(HUD_PIP_FILL_COLOR);
      else pip.setFillStyle(HUD_PIP_FILL_COLOR, 0);
    });
  }

  setScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  setTimer(sec) {
    this.timerText.setText(pad2(Math.max(0, sec)));
  }
}

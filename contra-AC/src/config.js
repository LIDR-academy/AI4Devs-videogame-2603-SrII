export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const LEVEL_DURATION_SECONDS = 90;
export const PLAYER_MAX_HP = 3;

export const PLAYER_RUN_SPEED = 220;
export const PLAYER_JUMP_VELOCITY = 520;
export const GRAVITY = 1400;
export const LEVEL_WIDTH_SCREENS = 3;
export const GROUND_HEIGHT = 64;
export const ANIM_FRAMERATE_IDLE = 6;
export const ANIM_FRAMERATE_WALK = 12;

export const PLAYER_FIRE_COOLDOWN_MS = 200;
export const BULLET_SPEED = 600;
export const BULLET_LIFETIME_MS = 1500;
export const BULLET_POOL_MAX_SIZE = 32;
export const BULLET_SCALE = 1;
export const BULLET_OFFSCREEN_MARGIN = 64;
export const ANIM_FRAMERATE_ATTACK = 16;

export const ENEMY_MAX_ON_SCREEN = 5;
export const ENEMY_SPAWN_INTERVAL_MS = 1500;
export const ENEMY_SPAWN_MARGIN = 64;

export const ANIM_FRAMERATE_ENEMY_IDLE = 6;
export const ANIM_FRAMERATE_ENEMY_WALK = 10;
export const ANIM_FRAMERATE_ENEMY_ATTACK = 12;
export const ANIM_FRAMERATE_ENEMY_HURT = 12;
export const ANIM_FRAMERATE_ENEMY_DEATH = 8;

const DEFAULT_HITBOX = { width: 30, height: 40, offsetX: 35, offsetY: 30 };

export const ENEMY_VARIANTS = {
  grunt: {
    tint: 0xddddff,
    scale: 1.0,
    hp: 1,
    speed: 80,
    behaviorId: 'walkToward',
    hitbox: DEFAULT_HITBOX,
    scoreValue: 100,
  },
  shooter: {
    tint: 0xff7777,
    scale: 1.1,
    hp: 2,
    speed: 0,
    behaviorId: 'standAndShoot',
    fireIntervalMs: 1500,
    hitbox: DEFAULT_HITBOX,
    scoreValue: 300,
  },
  jumper: {
    tint: 0xffdd44,
    scale: 0.9,
    hp: 1,
    speed: 100,
    behaviorId: 'hopToward',
    jumpIntervalMs: 800,
    jumpVelocity: 350,
    hitbox: DEFAULT_HITBOX,
    scoreValue: 200,
  },
};

export const PLAYER_HIT_IFRAMES_MS = 1000;
export const PLAYER_HIT_BLINK_INTERVAL_MS = 100;
export const ANIM_FRAMERATE_HURT = 12;
export const ANIM_FRAMERATE_DEATH = 8;

export const HUD_MARGIN = 16;
export const HUD_PIP_SIZE = 18;
export const HUD_PIP_SPACING = 8;
export const HUD_PIP_FILL_COLOR = 0xff4444;
export const HUD_PIP_STROKE_COLOR = 0xffffff;
export const HUD_SCORE_X = 200;
export const HUD_SCORE_FONT_SIZE = 18;
export const HUD_FONT_FAMILY = 'monospace';

export const GOAL_MARKER_WIDTH = 24;
export const GOAL_MARKER_COLOR = 0xffe44a;
export const HUD_TIMER_X = 380;
export const HUD_TIMER_FONT_SIZE = 24;

export const PAUSE_OVERLAY_ALPHA = 0.6;
export const PAUSE_OVERLAY_COLOR = 0x000000;
export const PAUSE_TEXT_COLOR = '#ffffff';
export const PAUSE_HEADLINE_FONT_SIZE = 48;
export const PAUSE_PROMPT_FONT_SIZE = 18;

export const AUDIO_VOLUME = 0.6;
export const SCREEN_SHAKE_DURATION_MS = 150;
export const SCREEN_SHAKE_INTENSITY = 0.005;

export const TILE_SIZE = 16;
// Frame indexes into the 16x16 grass-tileset spritesheet (24 cols × 8 rows).
// Cols 0-7 are individual atlas tiles; cols 8-23 are a level-mockup demo we don't use.
// Row 0 is fully transparent in this PNG — the actual atlas content starts at row 1.
export const GROUND_TILE_TOP = 25; // grass-top: green strip on dirt, col 1 row 1
export const GROUND_TILE_DIRT = 29; // solid dirt fill, col 5 row 1

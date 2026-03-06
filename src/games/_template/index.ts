import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'FORM & PLAY', {
      fontFamily: 'Inter',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#f0a000',
    }).setOrigin(0.5);
  }
}

let game: Phaser.Game | null = null;

export default {
  launch(container: HTMLElement): void {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: 1280,
      height: 720,
      backgroundColor: '#000000',
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  },
  destroy(): void {
    if (game) {
      game.destroy(true);
      game = null;
    }
  },
};

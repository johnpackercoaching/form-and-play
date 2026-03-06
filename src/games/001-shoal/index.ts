import Phaser from 'phaser';
import { initQA, updateQA, qaEvent } from '../../shared/qa-instrumentation';

const GAME_ID = '001-shoal';
const W = 1280;
const H = 720;

const CYAN = 0x00ddff;
const RED = 0xff4444;
const PINK = 0xffb8e0;
const WHITE = 0xffffff;

const LEAD_SPEED = 320;
const FOLLOW_DIST = 18;
const PETAL_INTERVAL_MIN = 400;
const PETAL_INTERVAL_MAX = 1200;
const HAZARD_INTERVAL_START = 2200;
const HAZARD_INTERVAL_MIN = 600;
const CATALYST_INTERVAL = 15000;
const CATALYST_DURATION = 4000;

interface Fish {
  x: number;
  y: number;
  angle: number;
  gfx: Phaser.GameObjects.Graphics;
}

interface Petal {
  x: number;
  y: number;
  vy: number;
  vx: number;
  angle: number;
  spin: number;
  gfx: Phaser.GameObjects.Graphics;
  alive: boolean;
}

interface Hazard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  gfx: Phaser.GameObjects.Graphics;
  alive: boolean;
}

interface CatalystOrb {
  x: number;
  y: number;
  vy: number;
  pulse: number;
  gfx: Phaser.GameObjects.Graphics;
  alive: boolean;
}

class ShoalScene extends Phaser.Scene {
  private shoal: Fish[] = [];
  private petals: Petal[] = [];
  private hazards: Hazard[] = [];
  private catalystOrb: CatalystOrb | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private score = 0;
  private highScore = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private catalystActive = false;
  private catalystTimer = 0;
  private petalTimer = 0;
  private hazardTimer = 0;
  private catalystSpawnTimer = 0;
  private elapsed = 0;
  private posHistory: { x: number; y: number; angle: number }[] = [];
  private restartKey!: Phaser.Input.Keyboard.Key;
  private gameOverGroup!: Phaser.GameObjects.Container;
  private catalystFlash = 0;
  private shakeAmount = 0;

  constructor() {
    super({ key: 'ShoalScene' });
  }

  create(): void {
    initQA(this, GAME_ID);

    this.shoal = [];
    this.petals = [];
    this.hazards = [];
    this.catalystOrb = null;
    this.score = 0;
    this.gameOver = false;
    this.catalystActive = false;
    this.catalystTimer = 0;
    this.petalTimer = 0;
    this.hazardTimer = 0;
    this.catalystSpawnTimer = 8000;
    this.elapsed = 0;
    this.posHistory = [];
    this.catalystFlash = 0;
    this.shakeAmount = 0;

    // Load high score
    try {
      this.highScore = parseInt(localStorage.getItem('shoal-hi') || '0', 10) || 0;
    } catch { this.highScore = 0; }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Lead fish
    this.spawnFish(W / 2, H / 2);
    // Start with 2 followers
    this.spawnFish(W / 2 - 20, H / 2);
    this.spawnFish(W / 2 - 40, H / 2);

    // Seed position history
    for (let i = 0; i < 300; i++) {
      this.posHistory.push({ x: W / 2, y: H / 2, angle: 0 });
    }

    // UI
    this.scoreText = this.add.text(20, 16, '0', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#00DDFF',
    }).setDepth(100);

    this.highScoreText = this.add.text(20, 56, `HI ${this.highScore}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '16px',
      color: '#00DDFF',
    }).setAlpha(0.5).setDepth(100);

    // Controls hint (fades out)
    const hint = this.add.text(W / 2, H - 40, 'ARROWS or WASD', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0.6).setDepth(100);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2500, duration: 1000, onComplete: () => hint.destroy() });

    // Game over container (hidden)
    this.gameOverGroup = this.add.container(W / 2, H / 2).setDepth(200).setAlpha(0);
    const goText = this.add.text(0, -40, 'SHOAL SCATTERED', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    const restartText = this.add.text(0, 30, 'SPACE TO SWIM AGAIN', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#00DDFF',
    }).setOrigin(0.5);
    this.gameOverGroup.add([goText, restartText]);
  }

  private spawnFish(x: number, y: number): void {
    const gfx = this.add.graphics().setDepth(50);
    const fish: Fish = { x, y, angle: 0, gfx };
    this.shoal.push(fish);
  }

  private drawFish(fish: Fish, index: number): void {
    const g = fish.gfx;
    g.clear();

    const isLead = index === 0;
    const size = isLead ? 10 : 7;
    let color = isLead ? CYAN : CYAN;
    let alpha = isLead ? 1 : 0.7 - (index * 0.008);
    if (alpha < 0.3) alpha = 0.3;

    if (this.catalystActive) {
      color = (this.catalystFlash > 0.5) ? WHITE : CYAN;
      alpha = Math.max(alpha, 0.8);
    }

    g.fillStyle(color, alpha);

    // Fish body - simple triangle pointing in movement direction
    const a = fish.angle;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    // Nose
    const nx = fish.x + cos * size * 1.5;
    const ny = fish.y + sin * size * 1.5;
    // Left fin
    const lx = fish.x + Math.cos(a + 2.4) * size;
    const ly = fish.y + Math.sin(a + 2.4) * size;
    // Right fin
    const rx = fish.x + Math.cos(a - 2.4) * size;
    const ry = fish.y + Math.sin(a - 2.4) * size;
    // Tail
    const tx = fish.x - cos * size * 1.2;
    const ty = fish.y - sin * size * 1.2;

    g.beginPath();
    g.moveTo(nx, ny);
    g.lineTo(lx, ly);
    g.lineTo(tx, ty);
    g.lineTo(rx, ry);
    g.closePath();
    g.fillPath();

    // Eye on lead fish
    if (isLead) {
      const ex = fish.x + cos * size * 0.5 + Math.cos(a + 1.2) * 3;
      const ey = fish.y + sin * size * 0.5 + Math.sin(a + 1.2) * 3;
      g.fillStyle(0x000000, 1);
      g.fillCircle(ex, ey, 2);
    }
  }

  private spawnPetal(): void {
    const x = Phaser.Math.Between(40, W - 40);
    const gfx = this.add.graphics().setDepth(30);
    const petal: Petal = {
      x,
      y: -20,
      vy: Phaser.Math.Between(40, 80),
      vx: Phaser.Math.Between(-20, 20),
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 3,
      gfx,
      alive: true,
    };
    this.petals.push(petal);
  }

  private drawPetal(p: Petal): void {
    const g = p.gfx;
    g.clear();
    if (!p.alive) return;

    g.fillStyle(PINK, 0.85);
    // Draw a petal shape - ellipse rotated
    const a = p.angle;
    g.save();
    const cx = p.x;
    const cy = p.y;
    // Simple 4-petal flower shape
    for (let i = 0; i < 4; i++) {
      const pa = a + (i * Math.PI / 2);
      const px = cx + Math.cos(pa) * 6;
      const py = cy + Math.sin(pa) * 6;
      g.fillCircle(px, py, 4);
    }
    // Center
    g.fillStyle(WHITE, 0.9);
    g.fillCircle(cx, cy, 2.5);
  }

  private spawnHazard(): void {
    const gfx = this.add.graphics().setDepth(40);
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number, vx: number, vy: number;
    const speed = Phaser.Math.Between(80, 160 + Math.floor(this.elapsed / 5000) * 10);

    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(0, W); y = -30;
        vx = Phaser.Math.Between(-60, 60); vy = speed;
        break;
      case 1: // right
        x = W + 30; y = Phaser.Math.Between(0, H);
        vx = -speed; vy = Phaser.Math.Between(-60, 60);
        break;
      case 2: // bottom
        x = Phaser.Math.Between(0, W); y = H + 30;
        vx = Phaser.Math.Between(-60, 60); vy = -speed;
        break;
      default: // left
        x = -30; y = Phaser.Math.Between(0, H);
        vx = speed; vy = Phaser.Math.Between(-60, 60);
        break;
    }

    const hazard: Hazard = {
      x, y, vx, vy,
      size: Phaser.Math.Between(12, 22),
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 4,
      gfx,
      alive: true,
    };
    this.hazards.push(hazard);
  }

  private drawHazard(h: Hazard): void {
    const g = h.gfx;
    g.clear();
    if (!h.alive) return;

    g.fillStyle(RED, 0.9);
    // Angular crystal shape
    const a = h.angle;
    const s = h.size;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const r = (i % 2 === 0) ? s : s * 0.6;
      const px = h.x + Math.cos(a + i * Math.PI / 3) * r;
      const py = h.y + Math.sin(a + i * Math.PI / 3) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // Inner glow
    g.fillStyle(RED, 0.4);
    g.fillCircle(h.x, h.y, s * 0.3);
  }

  private spawnCatalyst(): void {
    if (this.catalystOrb) return;
    const gfx = this.add.graphics().setDepth(45);
    this.catalystOrb = {
      x: Phaser.Math.Between(100, W - 100),
      y: -20,
      vy: 50,
      pulse: 0,
      gfx,
      alive: true,
    };
  }

  private drawCatalyst(c: CatalystOrb): void {
    const g = c.gfx;
    g.clear();
    if (!c.alive) return;

    const pulseSize = 12 + Math.sin(c.pulse) * 4;
    // Outer glow
    g.fillStyle(WHITE, 0.15);
    g.fillCircle(c.x, c.y, pulseSize + 8);
    // Ring
    g.lineStyle(2, WHITE, 0.6);
    g.strokeCircle(c.x, c.y, pulseSize + 4);
    // Core
    g.fillStyle(WHITE, 0.9);
    g.fillCircle(c.x, c.y, pulseSize * 0.5);
    // Inner spark
    g.fillStyle(CYAN, 0.8);
    g.fillCircle(c.x, c.y, pulseSize * 0.25);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) {
      updateQA({
        score: this.score,
        state: 'gameover',
        elapsed: Math.floor(this.elapsed / 1000),
        playerX: this.shoal[0]?.x ?? 0,
        playerY: this.shoal[0]?.y ?? 0,
        shoalSize: this.shoal.length,
        catalystActive: false,
        hazardCount: 0,
        petalCount: 0,
      });
      if (this.restartKey.isDown) {
        qaEvent('restart', {});
        this.cleanupAll();
        this.scene.restart();
      }
      return;
    }

    const dt = delta / 1000;
    this.elapsed += delta;

    // Input
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // Move lead fish
    const lead = this.shoal[0];
    lead.x += dx * LEAD_SPEED * dt;
    lead.y += dy * LEAD_SPEED * dt;

    // Clamp to bounds with padding
    const pad = 15;
    lead.x = Phaser.Math.Clamp(lead.x, pad, W - pad);
    lead.y = Phaser.Math.Clamp(lead.y, pad, H - pad);

    // Update lead angle
    if (dx !== 0 || dy !== 0) {
      const targetAngle = Math.atan2(dy, dx);
      lead.angle = Phaser.Math.Angle.RotateTo(lead.angle, targetAngle, 10 * dt);
    }

    // Record position history
    this.posHistory.unshift({ x: lead.x, y: lead.y, angle: lead.angle });
    if (this.posHistory.length > this.shoal.length * 8 + 50) {
      this.posHistory.length = this.shoal.length * 8 + 50;
    }

    // Followers follow position history
    for (let i = 1; i < this.shoal.length; i++) {
      const histIdx = i * 6;
      if (histIdx < this.posHistory.length) {
        const target = this.posHistory[histIdx];
        const f = this.shoal[i];
        const lerpSpeed = 8 * dt;
        f.x += (target.x - f.x) * lerpSpeed;
        f.y += (target.y - f.y) * lerpSpeed;
        f.angle = Phaser.Math.Angle.RotateTo(f.angle, target.angle, 8 * dt);
      }
    }

    // Spawn petals
    this.petalTimer -= delta;
    if (this.petalTimer <= 0) {
      this.spawnPetal();
      this.petalTimer = Phaser.Math.Between(PETAL_INTERVAL_MIN, PETAL_INTERVAL_MAX);
    }

    // Update petals
    for (const p of this.petals) {
      if (!p.alive) continue;
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.angle += p.spin * dt;

      // Gentle wave
      p.x += Math.sin(p.y * 0.01 + p.angle) * 0.3;

      if (p.y > H + 30) {
        p.alive = false;
        p.gfx.destroy();
        continue;
      }

      // Check collection - any fish in shoal can collect
      for (const fish of this.shoal) {
        const dist = Phaser.Math.Distance.Between(fish.x, fish.y, p.x, p.y);
        if (dist < 20) {
          p.alive = false;
          p.gfx.destroy();
          this.score++;
          this.scoreText.setText(`${this.score}`);
          this.collectEffect(p.x, p.y);
          qaEvent('petal-collected', { score: this.score, shoalSize: this.shoal.length + 1 });
          // Add new fish to shoal
          const last = this.shoal[this.shoal.length - 1];
          this.spawnFish(last.x, last.y);
          break;
        }
      }
    }
    this.petals = this.petals.filter(p => p.alive);

    // Spawn hazards (escalating)
    this.hazardTimer -= delta;
    if (this.hazardTimer <= 0) {
      this.spawnHazard();
      const interval = Math.max(HAZARD_INTERVAL_MIN, HAZARD_INTERVAL_START - this.elapsed * 0.08);
      this.hazardTimer = interval;
    }

    // Update hazards
    for (const h of this.hazards) {
      if (!h.alive) continue;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.angle += h.spin * dt;

      // Off screen cleanup
      if (h.x < -60 || h.x > W + 60 || h.y < -60 || h.y > H + 60) {
        h.alive = false;
        h.gfx.destroy();
        continue;
      }

      // Collision with shoal
      if (this.catalystActive) {
        // Destroy hazards near any fish when catalyst is active
        for (const fish of this.shoal) {
          const dist = Phaser.Math.Distance.Between(fish.x, fish.y, h.x, h.y);
          if (dist < h.size + 15) {
            h.alive = false;
            h.gfx.destroy();
            this.hazardDestroyEffect(h.x, h.y);
            this.score += 3;
            this.scoreText.setText(`${this.score}`);
            break;
          }
        }
      } else {
        // Check collision with each fish
        for (let i = 0; i < this.shoal.length; i++) {
          const fish = this.shoal[i];
          const dist = Phaser.Math.Distance.Between(fish.x, fish.y, h.x, h.y);
          if (dist < h.size + 8) {
            if (i === 0) {
              // Lead fish hit - game over
              this.triggerGameOver();
              return;
            } else {
              // Lose this fish and all behind it
              this.shakeAmount = 8;
              qaEvent('fish-lost', { lostCount: this.shoal.length - i, remainingShoal: i });
              const lost = this.shoal.splice(i);
              for (const lf of lost) {
                this.lostFishEffect(lf.x, lf.y);
                lf.gfx.destroy();
              }
              h.alive = false;
              h.gfx.destroy();
              this.hazardDestroyEffect(h.x, h.y);
              break;
            }
          }
        }
      }
    }
    this.hazards = this.hazards.filter(h => h.alive);

    // Catalyst orb spawn
    this.catalystSpawnTimer -= delta;
    if (this.catalystSpawnTimer <= 0 && !this.catalystActive) {
      this.spawnCatalyst();
      this.catalystSpawnTimer = CATALYST_INTERVAL;
    }

    // Update catalyst orb
    if (this.catalystOrb && this.catalystOrb.alive) {
      const c = this.catalystOrb;
      c.y += c.vy * dt;
      c.pulse += dt * 5;

      if (c.y > H + 30) {
        c.alive = false;
        c.gfx.destroy();
        this.catalystOrb = null;
      } else {
        // Check collection
        for (const fish of this.shoal) {
          const dist = Phaser.Math.Distance.Between(fish.x, fish.y, c.x, c.y);
          if (dist < 24) {
            c.alive = false;
            c.gfx.destroy();
            this.catalystOrb = null;
            this.activateCatalyst();
            break;
          }
        }
      }
    }

    // Catalyst timer
    if (this.catalystActive) {
      this.catalystTimer -= delta;
      this.catalystFlash = (this.catalystFlash + dt * 8) % 1;
      if (this.catalystTimer <= 0) {
        this.catalystActive = false;
        this.catalystFlash = 0;
      }
    }

    // Screen shake decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.9;
      if (this.shakeAmount < 0.5) this.shakeAmount = 0;
      this.cameras.main.setScroll(
        (Math.random() - 0.5) * this.shakeAmount,
        (Math.random() - 0.5) * this.shakeAmount
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }

    // Draw everything
    for (let i = this.shoal.length - 1; i >= 0; i--) {
      this.drawFish(this.shoal[i], i);
    }
    for (const p of this.petals) this.drawPetal(p);
    for (const h of this.hazards) this.drawHazard(h);
    if (this.catalystOrb && this.catalystOrb.alive) this.drawCatalyst(this.catalystOrb);

    // Check if only lead fish remains with no followers - that's fine, keep playing
    // Game over only when lead fish is hit

    updateQA({
      score: this.score,
      state: this.gameOver ? 'gameover' : 'playing',
      elapsed: Math.floor(this.elapsed / 1000),
      playerX: lead.x,
      playerY: lead.y,
      shoalSize: this.shoal.length,
      catalystActive: this.catalystActive,
      hazardCount: this.hazards.filter(h => h.alive).length,
      petalCount: this.petals.filter(p => p.alive).length,
    });
  }

  private activateCatalyst(): void {
    this.catalystActive = true;
    this.catalystTimer = CATALYST_DURATION;
    this.catalystFlash = 0;
    qaEvent('catalyst-collected', { duration: CATALYST_DURATION });

    // Flash effect
    const flash = this.add.graphics().setDepth(90);
    flash.fillStyle(WHITE, 0.3);
    flash.fillRect(0, 0, W, H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  private collectEffect(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const particle = this.add.graphics().setDepth(60);
      particle.fillStyle(PINK, 0.8);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(a) * 25,
        y: y + Math.sin(a) * 25,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private lostFishEffect(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const particle = this.add.graphics().setDepth(60);
      particle.fillStyle(CYAN, 0.6);
      particle.fillCircle(0, 0, 2);
      particle.setPosition(x, y);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(a) * 30,
        y: y + Math.sin(a) * 30,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private hazardDestroyEffect(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const particle = this.add.graphics().setDepth(60);
      particle.fillStyle(RED, 0.7);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(a) * 35,
        y: y + Math.sin(a) * 35,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 350,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.shakeAmount = 15;
    qaEvent('game-over', { finalScore: this.score, shoalSize: this.shoal.length, elapsed: Math.floor(this.elapsed / 1000) });

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try { localStorage.setItem('shoal-hi', `${this.highScore}`); } catch {}
      this.highScoreText.setText(`HI ${this.highScore}`);
    }

    // Scatter all fish
    for (let i = 1; i < this.shoal.length; i++) {
      const fish = this.shoal[i];
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: fish,
        x: fish.x + Math.cos(a) * 200,
        y: fish.y + Math.sin(a) * 200,
        duration: 600,
        ease: 'Power2',
        onUpdate: () => this.drawFish(fish, i),
        onComplete: () => fish.gfx.destroy(),
      });
    }

    // Flash lead fish red
    const lead = this.shoal[0];
    const lg = lead.gfx;
    lg.clear();
    lg.fillStyle(RED, 1);
    lg.fillCircle(lead.x, lead.y, 12);
    this.tweens.add({
      targets: lg,
      alpha: 0,
      duration: 800,
      delay: 200,
    });

    // Show game over
    this.tweens.add({
      targets: this.gameOverGroup,
      alpha: 1,
      duration: 500,
      delay: 300,
    });

    // Final score display
    const finalScore = this.add.text(W / 2, H / 2 + 80, `SCORE: ${this.score}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00DDFF',
    }).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.tweens.add({ targets: finalScore, alpha: 1, duration: 500, delay: 500 });
  }

  private cleanupAll(): void {
    for (const f of this.shoal) f.gfx.destroy();
    for (const p of this.petals) p.gfx.destroy();
    for (const h of this.hazards) h.gfx.destroy();
    if (this.catalystOrb) this.catalystOrb.gfx.destroy();
  }
}

let game: Phaser.Game | null = null;

export default {
  launch(container: HTMLElement): void {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: W,
      height: H,
      backgroundColor: '#000000',
      scene: [ShoalScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
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

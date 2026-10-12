"use client";

import { useEffect } from "react";
import { AnimatedSprite, Application, Assets, Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";

type Lease = {
  seatId: number;
  sessionId: string;
  displayName: string;
  avatarSkin: number;
  state: "reserved" | "moving" | "occupied";
  transitionStartedAt?: number;
  fromSeatId?: number | null;
};

type Identity = { sessionId: string; avatarSkin: number };
type Point = { x: number; y: number };
type SeatConfig = Point & { zone: "bar" | "window" | "lounge"; scale: number; approach: string };

const seats: Record<number, SeatConfig> = {
  1: { x: 18, y: 46, zone: "bar", scale: 0.86, approach: "b1" },
  2: { x: 28, y: 40, zone: "bar", scale: 0.84, approach: "b2" },
  3: { x: 36, y: 42, zone: "bar", scale: 0.88, approach: "b3" },
  4: { x: 42, y: 35, zone: "bar", scale: 0.82, approach: "b4" },
  5: { x: 60, y: 41, zone: "window", scale: 0.88, approach: "w5" },
  6: { x: 71, y: 43, zone: "window", scale: 0.91, approach: "w6" },
  7: { x: 80, y: 43, zone: "window", scale: 0.92, approach: "w7" },
  8: { x: 92, y: 49, zone: "window", scale: 0.96, approach: "w8" },
  9: { x: 37, y: 66, zone: "lounge", scale: 1.12, approach: "l9" },
  10: { x: 65, y: 68, zone: "lounge", scale: 1.16, approach: "l10" },
};

const nodes: Record<string, Point> = {
  entrance: { x: 50, y: 91 }, central: { x: 50, y: 78 }, left: { x: 42, y: 66 }, right: { x: 63, y: 67 },
  bar: { x: 39, y: 53 }, window: { x: 72, y: 55 },
  b1: { x: 22, y: 51 }, b2: { x: 29, y: 48 }, b3: { x: 36, y: 49 }, b4: { x: 43, y: 43 },
  w5: { x: 58, y: 49 }, w6: { x: 69, y: 51 }, w7: { x: 79, y: 51 }, w8: { x: 89, y: 55 },
  l9: { x: 39, y: 70 }, l10: { x: 63, y: 73 },
};

const edges: Array<[string, string]> = [
  ["entrance", "central"], ["central", "left"], ["central", "right"], ["left", "right"],
  ["left", "bar"], ["bar", "b1"], ["bar", "b2"], ["bar", "b3"], ["bar", "b4"],
  ["right", "window"], ["window", "w5"], ["window", "w6"], ["window", "w7"], ["window", "w8"],
  ["left", "l9"], ["right", "l10"], ["l9", "l10"],
];

class CafeRoomEngine {
  private app: Application | null = null;
  private container: HTMLElement | null = null;
  private identity: Identity | null = null;
  private actors = new Map<string, AnimatedSprite>();
  private walkTextures: Texture[][] = [];
  private seatedBackTextures: Texture[][] = [];
  private seatedLoungeTextures: Texture[][] = [];
  private actorLayer = new Container();
  private overlayLayer = new Container();
  private readyPromise: Promise<void> | null = null;

  async mount(container: HTMLElement, identity: Identity) {
    this.destroy();
    this.container = container;
    this.identity = identity;
    this.readyPromise = this.setup();
    await this.readyPromise;
  }

  private async setup() {
    if (!this.container) return;
    const app = new Application();
    await app.init({ resizeTo: this.container, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2) });
    app.canvas.className = "cafe-character-canvas";
    app.canvas.setAttribute("aria-hidden", "true");
    this.container.prepend(app.canvas);
    app.stage.sortableChildren = true;
    this.actorLayer.sortableChildren = true;
    this.actorLayer.zIndex = 20;
    this.overlayLayer.zIndex = 40;
    app.stage.addChild(this.actorLayer, this.overlayLayer);
    this.app = app;

    const [walk, back, lounge, room] = await Promise.all([
      Assets.load<Texture>("/assets/20261012-cafe-player-walk-sprites.png"),
      Assets.load<Texture>("/assets/20261012-cafe-seated-back-focus-atlas.png"),
      Assets.load<Texture>("/assets/20261012-cafe-seated-lounge-focus-atlas.png"),
      Assets.load<Texture>("/assets/20261011-cafe-focus-room.png"),
    ]);
    this.walkTextures = this.slice(walk, 3, 4);
    this.seatedBackTextures = this.slice(back, 3, 4);
    this.seatedLoungeTextures = this.slice(lounge, 3, 4);
    this.buildOcclusion(room);
  }

  private slice(base: Texture, columns: number, rows: number) {
    const frameWidth = base.source.width / columns;
    const frameHeight = base.source.height / rows;
    return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => new Texture({
      source: base.source,
      frame: new Rectangle(column * frameWidth, row * frameHeight, frameWidth, frameHeight),
    })));
  }

  private buildOcclusion(roomTexture: Texture) {
    if (!this.app) return;
    const sprite = new Sprite(roomTexture);
    const mask = new Graphics();
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const scale = Math.max(w / roomTexture.source.width, h / roomTexture.source.height);
    sprite.scale.set(scale);
    sprite.x = (w - roomTexture.source.width * scale) / 2;
    sprite.y = (h - roomTexture.source.height * scale) / 2;
    const polygon = (values: number[]) => mask.poly(values.map((value, index) => value * (index % 2 === 0 ? w : h) / 100)).fill(0xffffff);
    polygon([7,43, 50,38, 51,47, 12,53]);
    polygon([54,43, 100,43, 100,52, 56,50]);
    polygon([27,64, 46,62, 48,72, 29,74]);
    polygon([56,66, 75,64, 76,75, 57,77]);
    sprite.mask = mask;
    this.overlayLayer.addChild(sprite, mask);
  }

  async setOccupants(leases: Lease[]) {
    await this.readyPromise;
    if (!this.app) return;
    const wanted = new Set<string>();
    for (const lease of leases) {
      // `walkLocal` owns the local avatar while it is moving. Once seated,
      // render it like every other occupant so every red marker has a person.
      if (lease.sessionId === this.identity?.sessionId && lease.state !== "occupied") continue;
      wanted.add(lease.sessionId);
      const existing = this.actors.get(lease.sessionId);
      if (existing) {
        this.positionActor(existing, lease.seatId);
        continue;
      }
      const actor = lease.state === "occupied" ? this.createSeatedActor(lease) : this.createMovingActor(lease);
      this.actors.set(lease.sessionId, actor);
      this.actorLayer.addChild(actor);
      actor.alpha = 0;
      actor.scale.set(actor.scale.x * 0.96, actor.scale.y * 0.96);
      const baseScaleX = actor.scale.x / 0.96;
      const baseScaleY = actor.scale.y / 0.96;
      let elapsed = 0;
      const fade = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS;
        const p = Math.min(1, elapsed / 420);
        actor.alpha = p;
        actor.scale.set(baseScaleX * (0.96 + 0.04 * p), baseScaleY * (0.96 + 0.04 * p));
        if (p >= 1) this.app?.ticker.remove(fade);
      };
      this.app.ticker.add(fade);
    }
    for (const [id, actor] of this.actors) {
      if (!wanted.has(id)) {
        actor.destroy();
        this.actors.delete(id);
      }
    }
  }

  private createSeatedActor(lease: Lease) {
    const seat = seats[lease.seatId];
    const frames = seat.zone === "lounge" ? this.seatedLoungeTextures[lease.avatarSkin % 4] : this.seatedBackTextures[lease.avatarSkin % 4];
    const actor = new AnimatedSprite(frames);
    actor.animationSpeed = 0.035 + (lease.avatarSkin % 3) * 0.007;
    actor.loop = true;
    actor.anchor.set(0.5, 0.88);
    actor.play();
    this.positionActor(actor, lease.seatId);
    return actor;
  }

  private createMovingActor(lease: Lease) {
    const actor = new AnimatedSprite(this.walkTextures[0] || []);
    actor.animationSpeed = 0.12;
    actor.anchor.set(0.5, 0.82);
    actor.play();
    this.positionActor(actor, lease.seatId);
    actor.alpha = 0.82;
    return actor;
  }

  private positionActor(actor: AnimatedSprite, seatId: number) {
    if (!this.app) return;
    const seat = seats[seatId];
    actor.x = this.app.screen.width * seat.x / 100;
    actor.y = this.app.screen.height * seat.y / 100;
    const targetWidth = Math.max(54, Math.min(128, this.app.screen.width * 0.075 * seat.scale));
    const scale = targetWidth / Math.max(1, actor.texture.width);
    actor.scale.set(seat.zone === "lounge" && seatId === 10 ? -scale : scale, scale);
    actor.zIndex = Math.round(seat.y * 10);
  }

  async walkLocal(fromSeatId: number | null, toSeatId: number) {
    await this.readyPromise;
    if (!this.app || !this.identity) return;
    const path = this.findPath(fromSeatId ? seats[fromSeatId].approach : "entrance", seats[toSeatId].approach);
    const actor = new AnimatedSprite(this.walkTextures[0]);
    actor.anchor.set(0.5, 0.82);
    actor.animationSpeed = 0.18;
    actor.tint = [0xffffff, 0xe6efff, 0xffeadc, 0xe0f2e3][this.identity.avatarSkin % 4];
    actor.play();
    this.actorLayer.addChild(actor);
    this.actors.set(this.identity.sessionId, actor);
    for (let index = 0; index < path.length; index += 1) {
      const point = nodes[path[index]];
      if (index === 0) {
        actor.x = this.app.screen.width * point.x / 100;
        actor.y = this.app.screen.height * point.y / 100;
        continue;
      }
      await this.moveSegment(actor, nodes[path[index - 1]], point);
    }
    const target = seats[toSeatId];
    await this.moveSegment(actor, nodes[target.approach], target);
    actor.stop();
    actor.alpha = 0;
    actor.destroy();
    this.actors.delete(this.identity.sessionId);
    const seated = this.createSeatedActor({ seatId: toSeatId, sessionId: this.identity.sessionId, displayName: "你", avatarSkin: this.identity.avatarSkin, state: "occupied" });
    seated.alpha = 0;
    this.actorLayer.addChild(seated);
    this.actors.set(this.identity.sessionId, seated);
    await this.fadeIn(seated, 520);
  }

  private async moveSegment(actor: AnimatedSprite, from: Point, to: Point) {
    if (!this.app) return;
    const startX = this.app.screen.width * from.x / 100;
    const startY = this.app.screen.height * from.y / 100;
    const endX = this.app.screen.width * to.x / 100;
    const endY = this.app.screen.height * to.y / 100;
    const dx = endX - startX;
    const dy = endY - startY;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
    actor.textures = this.walkTextures[direction];
    actor.play();
    const duration = Math.max(260, Math.hypot(dx, dy) * 4.2);
    let elapsed = 0;
    await new Promise<void>((resolve) => {
      const tick = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS;
        const p = Math.min(1, elapsed / duration);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        actor.x = startX + dx * eased;
        actor.y = startY + dy * eased;
        const yPercent = (actor.y / this.app!.screen.height) * 100;
        const targetWidth = this.app!.screen.width * (0.052 + yPercent * 0.00042);
        const scale = targetWidth / Math.max(1, actor.texture.width);
        actor.scale.set(scale);
        actor.zIndex = Math.round(yPercent * 10);
        if (p >= 1) {
          this.app!.ticker.remove(tick);
          resolve();
        }
      };
      this.app!.ticker.add(tick);
    });
  }

  private fadeIn(actor: AnimatedSprite, duration: number) {
    return new Promise<void>((resolve) => {
      if (!this.app) return resolve();
      let elapsed = 0;
      const tick = (ticker: { deltaMS: number }) => {
        elapsed += ticker.deltaMS;
        actor.alpha = Math.min(1, elapsed / duration);
        if (elapsed >= duration) {
          this.app!.ticker.remove(tick);
          resolve();
        }
      };
      this.app.ticker.add(tick);
    });
  }

  private findPath(start: string, goal: string) {
    const adjacency = new Map<string, string[]>();
    for (const [a, b] of edges) {
      adjacency.set(a, [...(adjacency.get(a) || []), b]);
      adjacency.set(b, [...(adjacency.get(b) || []), a]);
    }
    const open = new Set([start]);
    const cameFrom = new Map<string, string>();
    const g = new Map<string, number>([[start, 0]]);
    const distance = (a: string, b: string) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    while (open.size) {
      const current = [...open].sort((a, b) => (g.get(a)! + distance(a, goal)) - (g.get(b)! + distance(b, goal)))[0];
      if (current === goal) {
        const path = [current];
        while (cameFrom.has(path[0])) path.unshift(cameFrom.get(path[0])!);
        return path;
      }
      open.delete(current);
      for (const neighbor of adjacency.get(current) || []) {
        const tentative = g.get(current)! + distance(current, neighbor);
        if (tentative < (g.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current);
          g.set(neighbor, tentative);
          open.add(neighbor);
        }
      }
    }
    return [start, goal];
  }

  destroy() {
    this.actors.clear();
    this.app?.destroy(true, { children: true, texture: false, textureSource: false });
    this.app = null;
    this.container = null;
    this.readyPromise = null;
    this.actorLayer = new Container();
    this.overlayLayer = new Container();
  }
}

declare global {
  interface Window {
    FocusRoomEngine?: CafeRoomEngine;
  }
}

export default function RoomEngineBridge() {
  useEffect(() => {
    window.FocusRoomEngine = new CafeRoomEngine();
    window.dispatchEvent(new Event("focus-room-engine-ready"));
    return () => window.FocusRoomEngine?.destroy();
  }, []);
  return null;
}

import { InputState } from "./types";

export interface ControlsCallbacks {
  onInteract?: () => void;
  onTalkToggle?: () => void;
  onStateChange?: (state: InputState) => void;
}

export class WorldControlsManager {
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  private callbacks: ControlsCallbacks;
  private isDestroyed = false;

  constructor(callbacks: ControlsCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof window !== "undefined") {
      this.attachListeners();
    }
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public setDirection(direction: keyof InputState, active: boolean) {
    if (this.state[direction] !== active) {
      this.state[direction] = active;
      this.callbacks.onStateChange?.(this.getState());
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ignore keypresses if typing in an input or textarea
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }

    let handled = false;

    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        this.setDirection("forward", true);
        handled = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.setDirection("backward", true);
        handled = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.setDirection("left", true);
        handled = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.setDirection("right", true);
        handled = true;
        break;
      case "KeyE":
        this.callbacks.onInteract?.();
        handled = true;
        break;
      case "Space":
        // Only trigger talk if not currently talking or let handler decide
        this.callbacks.onTalkToggle?.();
        handled = true;
        break;
    }

    if (handled && e.code === "Space") {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        this.setDirection("forward", false);
        break;
      case "KeyS":
      case "ArrowDown":
        this.setDirection("backward", false);
        break;
      case "KeyA":
      case "ArrowLeft":
        this.setDirection("left", false);
        break;
      case "KeyD":
      case "ArrowRight":
        this.setDirection("right", false);
        break;
    }
  };

  private attachListeners() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  public destroy() {
    this.isDestroyed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    }
  }
}

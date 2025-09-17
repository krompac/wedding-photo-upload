export class Semaphore {
  private tasks: (() => void)[] = [];
  private counter: number;
  private readonly maxLimit: number;

  constructor(limit: number) {
    this.counter = limit;
    this.maxLimit = limit;
  }

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      if (this.counter > 0) {
        this.counter--;
        resolve(() => this.release());
      } else {
        this.tasks.push(() => resolve(() => this.release()));
      }
    });
  }

  private release() {
    if (this.counter >= this.maxLimit) {
      console.warn('Semaphore: release() called more times than acquire()');
      return;
    }

    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      next?.();
    } else {
      this.counter++;
    }
  }

  get availableSlots(): number {
    return this.counter;
  }

  get queuedTasks(): number {
    return this.tasks.length;
  }
}

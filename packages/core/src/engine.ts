import { isValidArray } from 'toolbox-x/guards';
import type { Nullable } from 'toolbox-x/types';
import { calculateFinalAngle } from './angle.js';
import { createSeededRng } from './rng.js';
import type { SpinResult, WheelEngineConfig, WheelSegment, WheelState } from './types.js';
import { pickWeightedIndex } from './weighted.js';

/** Deep-freeze a segment to prevent external mutation. */
function freezeSegment<D = unknown>(seg: WheelSegment<D>): Readonly<WheelSegment<D>> {
    return Object.freeze({ ...seg });
}

/** Pure-logic wheel engine. No DOM dependency. */
export class WheelEngine<Data = unknown> {
    private segments: readonly Readonly<WheelSegment<Data>>[];
    private state: WheelState = 'idle';
    private readonly rng: () => number;
    private readonly minSpins: number;
    private readonly maxSpins: number;
    private lastResult: Nullable<SpinResult<Data>> = null;

    constructor(config: WheelEngineConfig<Data>) {
        const { segments, maxSpins = 8, minSpins = 4, seed } = config;

        if (!isValidArray(segments)) {
            throw new Error('WheelEngine: at least one segment is required.');
        }

        if (minSpins < 1) {
            throw new RangeError(`WheelEngine: minSpins must be ≥ 1, got ${minSpins}.`);
        }
        if (maxSpins < minSpins) {
            throw new RangeError(
                `WheelEngine: maxSpins (${maxSpins}) must be ≥ minSpins (${minSpins}).`
            );
        }

        this.segments = segments.map(freezeSegment);
        this.minSpins = minSpins;
        this.maxSpins = maxSpins;
        this.rng = seed ? createSeededRng(seed) : () => Math.random();
    }

    /** Returns the current wheel state. */
    getState(): WheelState {
        return this.state;
    }

    /** Returns the last spin result, if any. */
    getLastResult(): Nullable<SpinResult<Data>> {
        return this.lastResult;
    }

    /** Returns a frozen copy of the current segments. */
    getSegments(): readonly Readonly<WheelSegment<Data>>[] {
        return this.segments;
    }

    /** Replace the current segments. Resets state to idle. */
    setSegments(segments: readonly WheelSegment<Data>[]): void {
        if (!segments || segments.length === 0) {
            throw new Error('WheelEngine: at least one segment is required.');
        }
        this.segments = segments.map(freezeSegment);
        this.reset();
    }

    /**
     * Determines the result and computes the final angle.
     * Result is known BEFORE any animation.
     */
    spin(): SpinResult<Data> {
        if (this.state === 'spinning') {
            throw new Error('WheelEngine: a spin is already in progress.');
        }

        this.state = 'spinning';

        const index = pickWeightedIndex(this.segments, this.rng);
        const extraSpins =
            this.minSpins + Math.floor(this.rng() * (this.maxSpins - this.minSpins + 1));

        const finalAngle = calculateFinalAngle(
            index,
            this.segments.length,
            extraSpins,
            this.rng
        );

        const segment = this.segments[index];
        if (!segment) {
            throw new Error(`WheelEngine: internal error — invalid index ${index}.`);
        }
        const result: SpinResult<Data> = Object.freeze({ index, segment, finalAngle });

        this.lastResult = result;
        this.state = 'finished';

        return result;
    }

    /** Resets the engine back to idle. */
    reset(): void {
        this.state = 'idle';
        this.lastResult = null;
    }
}

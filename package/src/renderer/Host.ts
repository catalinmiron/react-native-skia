import { isPaint } from "../skia/Paint/Paint";

import type { DrawingContext } from "./DrawingContext";
import type { DeclarationResult, DeclarationProps } from "./nodes/Declaration";
import type { DrawingProps } from "./nodes";
import type { AnimatedProps } from "./processors/Animations/Animations";
import type { SkiaNodeProps } from "./nodes/SkiaNode";

export enum NodeType {
  Declaration = "skDeclaration",
  Drawing = "skDrawing",
  SkiaNode = "skiaNode",
}

export abstract class SkNode<P> {
  readonly children: SkNode<unknown>[] = [];
  _props: AnimatedProps<P>;
  memoizable = false;
  memoized = false;
  parent?: SkNode<unknown>;

  constructor(props: AnimatedProps<P>) {
    this._props = props;
  }

  abstract draw(ctx: DrawingContext): void | DeclarationResult;

  set props(props: AnimatedProps<P>) {
    this._props = props;
  }

  get props() {
    return this._props;
  }

  visit(ctx: DrawingContext) {
    const returnedValues: Exclude<DeclarationResult, null>[] = [];
    let currentCtx = ctx;
    this.children.forEach((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((child as any).renderer) {
        child.visit(ctx);
      } else if (!child.memoized) {
        const ret = child.draw(currentCtx);
        if (ret) {
          if (isPaint(ret)) {
            currentCtx = { ...currentCtx, paint: ret };
          }
          returnedValues.push(ret);
        }
        if (child.memoizable) {
          child.memoized = true;
        }
      }
    });
    return returnedValues;
  }
}

export class Container extends SkNode<unknown> {
  redraw: () => void;

  constructor(redraw: () => void) {
    super({});
    this.redraw = redraw;
  }

  draw(ctx: DrawingContext) {
    this.visit(ctx);
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skDeclaration: DeclarationProps<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skDrawing: DrawingProps<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skiaNode: SkiaNodeProps<any, any>;
    }
  }
}

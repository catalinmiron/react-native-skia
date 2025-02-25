import type { DependencyList, ReactNode } from "react";
import { useCallback } from "react";

import type { DrawingContext } from "../DrawingContext";
import { processPaint, selectPaint } from "../processors";
import type { AnimatedProps } from "../processors/Animations/Animations";
import { materialize } from "../processors/Animations/Animations";
import { isPaint } from "../../skia";
import type { DependencyManager } from "../DependencyManager";

import { Node } from "./Node";

type DrawingCallback<P> = (
  ctx: DrawingContext,
  props: P,
  node: Node<P>
) => void;

type OnDrawCallback<P> = (ctx: DrawingContext, props: P, node: Node<P>) => void;

export const createDrawing = <P,>(cb: OnDrawCallback<P>): DrawingCallback<P> =>
  cb;

export const useDrawing = <P,>(cb: OnDrawCallback<P>, deps?: DependencyList) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useCallback(cb, deps ?? []);

export type DrawingProps<T> = {
  onDraw: DrawingCallback<T>;
  skipProcessing?: boolean;
  children?: ReactNode | ReactNode[];
};

export class DrawingNode<P> extends Node<P> {
  onDraw: DrawingCallback<P>;
  skipProcessing: boolean;

  constructor(
    depMgr: DependencyManager,
    onDraw: DrawingCallback<P>,
    skipProcessing: boolean,
    props: AnimatedProps<P>
  ) {
    super(depMgr, props);
    this.onDraw = onDraw;
    this.skipProcessing = skipProcessing;
  }

  draw(ctx: DrawingContext) {
    const drawingProps = materialize(this.props);
    if (this.skipProcessing) {
      this.onDraw(ctx, drawingProps, this);
    } else {
      const selectedPaint = selectPaint(ctx.paint, drawingProps);
      processPaint(selectedPaint, ctx.opacity, drawingProps);
      // to draw only once:
      // onDraw({ ...ctx, paint: selectedPaint }, children);
      [
        selectedPaint,
        ...this.children
          .map((child) => {
            //if (child.type === NodeType.Declaration) {
            const ret = child.draw(ctx);
            if (ret) {
              return ret;
            }
            //}
            return null;
          })
          .filter(isPaint),
      ].forEach((paint) => {
        this.onDraw({ ...ctx, paint }, drawingProps, this);
      });
    }
  }
}

<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { Point, Rectangle } from "../utils.js";

  interface Props {
    value: Rectangle;
    onChange: (value: Rectangle) => void;
    pointLocation: (x: number, y: number) => Point;
    coordinateAtPoint: (x: number, y: number) => Point;
    preventHover: (state: boolean) => void;
  }

  let { value, onChange, pointLocation, coordinateAtPoint, preventHover }: Props = $props();

  let l1 = $derived(pointLocation(value.xMin, value.yMin));
  let l2 = $derived(pointLocation(value.xMax, value.yMax));

  const borderWidth = 8;

  function startDrag(mask: number[]): (e: MouseEvent) => void {
    return (e1: MouseEvent) => {
      e1.stopPropagation();
      e1.preventDefault();
      preventHover(true);
      let p = [l1.x, l1.y, l2.x, l2.y];
      let onMove = (e2: MouseEvent) => {
        e2.preventDefault();
        let dx = e2.pageX - e1.pageX;
        let dy = e2.pageY - e1.pageY;
        let np = [dx, dy, dx, dy].map((d, i) => p[i] + d * mask[i]);
        let nc1 = coordinateAtPoint(np[0], np[1]);
        let nc2 = coordinateAtPoint(np[2], np[3]);
        onChange({
          xMin: Math.min(nc1.x, nc2.x),
          xMax: Math.max(nc1.x, nc2.x),
          yMin: Math.min(nc1.y, nc2.y),
          yMax: Math.max(nc1.y, nc2.y),
        });
      };
      let onUp = () => {
        preventHover(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }
</script>

<g>
  <rect
    x={Math.min(l1.x, l2.x)}
    width={Math.abs(l1.x - l2.x)}
    y={Math.min(l1.y, l2.y)}
    height={Math.abs(l1.y - l2.y)}
    style:stroke="#fff"
    style:fill="rgba(128,128,128,0.25)"
    style:cursor="move"
    onmousedown={startDrag([1, 1, 1, 1])}
    role="none"
  />
  <rect
    x={l1.x - borderWidth / 2}
    width={borderWidth}
    y={Math.min(l1.y, l2.y)}
    height={Math.abs(l1.y - l2.y)}
    style:cursor="ew-resize"
    onmousedown={startDrag([1, 0, 0, 0])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={l2.x - borderWidth / 2}
    width={borderWidth}
    y={Math.min(l1.y, l2.y)}
    height={Math.abs(l1.y - l2.y)}
    style:cursor="ew-resize"
    onmousedown={startDrag([0, 0, 1, 0])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={Math.min(l1.x, l2.x)}
    width={Math.abs(l1.x - l2.x)}
    y={l1.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="ns-resize"
    onmousedown={startDrag([0, 1, 0, 0])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={Math.min(l1.x, l2.x)}
    width={Math.abs(l1.x - l2.x)}
    y={l2.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="ns-resize"
    onmousedown={startDrag([0, 0, 0, 1])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={l1.x - borderWidth / 2}
    width={borderWidth}
    y={l1.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="nesw-resize"
    onmousedown={startDrag([1, 1, 0, 0])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={l1.x - borderWidth / 2}
    width={borderWidth}
    y={l2.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="nwse-resize"
    onmousedown={startDrag([1, 0, 0, 1])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={l2.x - borderWidth / 2}
    width={borderWidth}
    y={l1.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="nwse-resize"
    onmousedown={startDrag([0, 1, 1, 0])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
  <rect
    x={l2.x - borderWidth / 2}
    width={borderWidth}
    y={l2.y - borderWidth / 2}
    height={borderWidth}
    style:cursor="nesw-resize"
    onmousedown={startDrag([0, 0, 1, 1])}
    style:stroke="none"
    style:fill="none"
    style:pointer-events="all"
    role="none"
  />
</g>

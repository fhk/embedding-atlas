<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { Context } from "../contexts.js";
  import { plotColors } from "../plots/colors.js";
  import type { ConcreteScale, XYFrameProxy } from "./types.js";

  const borderWidth = 8;

  interface Value {
    x?: [number, number] | string | null;
    y?: [number, number] | string | null;
  }

  interface Props {
    proxy: XYFrameProxy;
    mode: "x" | "y" | "xy";
    value: Value | null;
    onChange: (newValue: Value | null) => void;
  }

  let { proxy, mode, value, onChange }: Props = $props();

  const darkMode = Context.darkMode;
  let colors = $derived($darkMode ? plotColors.dark : plotColors.light);

  let baseRect: SVGRectElement;

  let xRange = $derived(
    proxy.xScale != null && value?.x != null ? proxy.xScale.applyBand(value.x) : [0, proxy.plotWidth],
  );
  let yRange = $derived(
    proxy.yScale != null && value?.y != null ? proxy.yScale.applyBand(value.y) : [0, proxy.plotHeight],
  );

  function isInterval(v: [number, number] | string | null | undefined): boolean {
    return v instanceof Array && v.length == 2 && typeof v[0] == "number" && typeof v[1] == "number";
  }

  function invertScale(scale: ConcreteScale, position: number, type?: "string" | "number"): any {
    let value = scale.invert(position, type);
    if (scale.domain.length == 2 && typeof scale.domain[0] == "number" && typeof value == "number") {
      let [a, b] = scale.domain;
      return Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
    }
    return value;
  }

  function validateValue(value: Value, mode: "x" | "y" | "xy") {
    if ((mode == "x" || mode == "xy") && value.x == null) {
      return false;
    } else if ((mode == "y" || mode == "xy") && value.y == null) {
      return false;
    }
    return true;
  }

  function startCreate(): (e: MouseEvent) => void {
    return (e1: MouseEvent) => {
      e1.preventDefault();
      let baseX = baseRect.getBoundingClientRect().left;
      let baseY = baseRect.getBoundingClientRect().top;
      let x0 = e1.clientX - baseX;
      let y0 = e1.clientY - baseY;
      let vx0 = proxy.xScale ? invertScale(proxy.xScale, x0) : null;
      let vy0 = proxy.yScale ? invertScale(proxy.yScale, y0) : null;
      if (vx0 == null && (mode == "x" || mode == "xy")) {
        return;
      }
      if (vy0 == null && (mode == "y" || mode == "xy")) {
        return;
      }
      let resolve = (a: any, b: any) =>
        typeof a == "number" && typeof b == "number" ? (a != b ? [Math.min(a, b), Math.max(a, b)] : null) : b;

      let resolveXY = (e2: MouseEvent) => {
        let x1 = e2.clientX - baseX;
        let y1 = e2.clientY - baseY;
        let vx1 = proxy.xScale ? invertScale(proxy.xScale, x1, typeof vx0 == "number" ? "number" : undefined) : null;
        let vy1 = proxy.yScale ? invertScale(proxy.yScale, y1, typeof vy0 == "number" ? "number" : undefined) : null;
        let r: Value = {};
        if (mode == "x" || mode == "xy") {
          r.x = resolve(vx0, vx1);
        }
        if (mode == "y" || mode == "xy") {
          r.y = resolve(vy0, vy1);
        }
        if (!validateValue(r, mode)) {
          return null;
        }
        return r;
      };

      let onMove = (e2: MouseEvent) => {
        e2.preventDefault();
        onChange(resolveXY(e2));
      };
      let onUp = (e2: MouseEvent) => {
        onChange(resolveXY(e2));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }

  function startDrag(mask: number[]): (e: MouseEvent) => void {
    return (e1: MouseEvent) => {
      if (value == null) {
        return;
      }
      let currentValue = { ...value };
      e1.preventDefault();
      let { xScale, yScale } = proxy;
      let isXInterval = isInterval(currentValue.x);
      let isYInterval = isInterval(currentValue.y);
      // Record the previous positions in [x0, x1, y0, y1] format (matching the order of the mask)
      let previousPositions: number[] = [
        ...(xScale && currentValue.x ? xScale.applyBand(currentValue.x) : [0, 0]),
        ...(yScale && currentValue.y ? yScale.applyBand(currentValue.y) : [0, 0]),
      ];
      if (!isXInterval) {
        let v = Math.max(mask[0], mask[1]);
        mask = [v, v, mask[2], mask[3]];
      }
      if (!isYInterval) {
        let v = Math.max(mask[2], mask[3]);
        mask = [mask[0], mask[1], v, v];
      }
      let resolveXY = (e2: MouseEvent) => {
        let dx = e2.pageX - e1.pageX;
        let dy = e2.pageY - e1.pageY;
        let newPositions = [dx, dx, dy, dy].map((d, i) => previousPositions[i] + d * mask[i]);
        let newValue: Value | null = { ...currentValue };
        if (xScale && (mode == "x" || mode == "xy")) {
          if (isXInterval) {
            let x0 = invertScale(xScale, newPositions[0], "number");
            let x1 = invertScale(xScale, newPositions[1], "number");
            newValue.x = x0 == x1 ? null : x0 < x1 ? [x0, x1] : [x1, x0];
          } else {
            newValue.x = invertScale(xScale, (newPositions[0] + newPositions[1]) / 2);
            if (typeof newValue.x != "string") {
              newValue.x = null;
            }
          }
        }
        if (yScale != null && (mode == "y" || mode == "xy")) {
          if (isYInterval) {
            let y0 = invertScale(yScale, newPositions[2], "number");
            let y1 = invertScale(yScale, newPositions[3], "number");
            newValue.y = y0 == y1 ? null : y0 < y1 ? [y0, y1] : [y1, y0];
          } else {
            newValue.y = invertScale(yScale, (newPositions[2] + newPositions[3]) / 2);
            if (typeof newValue.y != "string") {
              newValue.y = null;
            }
          }
        }
        if (!validateValue(newValue, mode)) {
          newValue = null;
        }
        return newValue;
      };
      let onMove = (e2: MouseEvent) => {
        e2.preventDefault();
        onChange(resolveXY(e2));
      };
      let onUp = (e2: MouseEvent) => {
        let newValue = resolveXY(e2);
        if (newValue && !isXInterval && !isYInterval) {
          if (newValue.x == currentValue.x && newValue.y == currentValue.y) {
            newValue = null;
          }
        }
        onChange(newValue);
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
    bind:this={baseRect}
    x={0}
    width={proxy.plotWidth}
    y={0}
    height={proxy.plotHeight}
    stroke="none"
    fill="none"
    pointer-events="fill"
    style:cursor="crosshair"
    onmousedown={startCreate()}
    role="none"
  />
  {#if xRange && yRange && value}
    <rect
      x={Math.min(xRange[0], xRange[1])}
      width={Math.abs(xRange[0] - xRange[1])}
      y={Math.min(yRange[0], yRange[1])}
      height={Math.abs(yRange[0] - yRange[1])}
      style:stroke={colors.brushBorderBack}
      style:fill="none"
      style:stroke-width={2}
    />
    <rect
      x={Math.min(xRange[0], xRange[1])}
      width={Math.abs(xRange[0] - xRange[1])}
      y={Math.min(yRange[0], yRange[1])}
      height={Math.abs(yRange[0] - yRange[1])}
      style:stroke={colors.brushBorder}
      style:fill={colors.brushFill}
      style:cursor="move"
      onmousedown={startDrag([1, 1, 1, 1])}
      role="none"
    />
    {#if (mode == "x" || mode == "xy") && isInterval(value.x)}
      <rect
        x={xRange[0] - borderWidth / 2}
        width={borderWidth}
        y={Math.min(yRange[0], yRange[1])}
        height={Math.abs(yRange[0] - yRange[1])}
        style:cursor="ew-resize"
        onmousedown={startDrag([1, 0, 0, 0])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
      <rect
        x={xRange[1] - borderWidth / 2}
        width={borderWidth}
        y={Math.min(yRange[0], yRange[1])}
        height={Math.abs(yRange[0] - yRange[1])}
        style:cursor="ew-resize"
        onmousedown={startDrag([0, 1, 0, 0])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
    {/if}
    {#if (mode == "y" || mode == "xy") && isInterval(value.y)}
      <rect
        x={Math.min(xRange[0], xRange[1])}
        width={Math.abs(xRange[0] - xRange[1])}
        y={yRange[0] - borderWidth / 2}
        height={borderWidth}
        style:cursor="ns-resize"
        onmousedown={startDrag([0, 0, 1, 0])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
      <rect
        x={Math.min(xRange[0], xRange[1])}
        width={Math.abs(xRange[0] - xRange[1])}
        y={yRange[1] - borderWidth / 2}
        height={borderWidth}
        style:cursor="ns-resize"
        onmousedown={startDrag([0, 0, 0, 1])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
    {/if}
    {#if mode == "xy" && isInterval(value.x) && isInterval(value.y)}
      <rect
        x={xRange[0] - borderWidth / 2}
        width={borderWidth}
        y={yRange[0] - borderWidth / 2}
        height={borderWidth}
        style:cursor="nesw-resize"
        onmousedown={startDrag([1, 0, 1, 0])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
      <rect
        x={xRange[0] - borderWidth / 2}
        width={borderWidth}
        y={yRange[1] - borderWidth / 2}
        height={borderWidth}
        style:cursor="nwse-resize"
        onmousedown={startDrag([1, 0, 0, 1])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
      <rect
        x={xRange[1] - borderWidth / 2}
        width={borderWidth}
        y={yRange[0] - borderWidth / 2}
        height={borderWidth}
        style:cursor="nwse-resize"
        onmousedown={startDrag([0, 1, 1, 0])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
      <rect
        x={xRange[1] - borderWidth / 2}
        width={borderWidth}
        y={yRange[1] - borderWidth / 2}
        height={borderWidth}
        style:cursor="nesw-resize"
        onmousedown={startDrag([0, 1, 0, 1])}
        style:stroke="none"
        style:fill="none"
        style:pointer-events="all"
        role="none"
      />
    {/if}
  {/if}
</g>

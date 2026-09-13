"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { btcCycle } from "@/lib/entry-config";
import type { Candle } from "@/lib/types";

type LineSpec = { price: number; title: string; color: string; style: LineStyle };

export function BtcChart({
  candles,
  showScenarios,
}: {
  candles: Candle[];
  showScenarios: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0c0e11" },
        textColor: "#5c656e",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#14181d" },
        horzLines: { color: "#14181d" },
      },
      crosshair: {
        vertLine: { color: "#2a323a", labelBackgroundColor: "#1a2026" },
        horzLine: { color: "#2a323a", labelBackgroundColor: "#1a2026" },
      },
      rightPriceScale: {
        borderColor: "#1a2026",
        scaleMargins: { top: 0.08, bottom: 0.06 },
      },
      timeScale: {
        borderColor: "#1a2026",
        timeVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#3d9b8f",
      downColor: "#8a4a4a",
      wickUpColor: "#3d9b8f",
      wickDownColor: "#8a4a4a",
      borderVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || candles.length === 0) return;
    series.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    for (const line of linesRef.current) series.removePriceLine(line);
    linesRef.current = [];

    const specs: LineSpec[] = [
      {
        price: btcCycle.swingHighUsd,
        title: "SWING",
        color: "#8b949e",
        style: LineStyle.Dotted,
      },
      {
        price: btcCycle.weeklyMaUsd,
        title: "200W",
        color: "#c9a227",
        style: LineStyle.Dashed,
      },
    ];
    if (showScenarios) {
      specs.push(
        { price: 74041, title: "−10%", color: "#3d9b8f", style: LineStyle.SparseDotted },
        { price: 65814, title: "−20%", color: "#8a7018", style: LineStyle.SparseDotted },
        { price: 57588, title: "−30%", color: "#c45c5c", style: LineStyle.SparseDotted },
      );
    }

    linesRef.current = specs.map((s) =>
      series.createPriceLine({
        price: s.price,
        color: s.color,
        lineWidth: 1,
        lineStyle: s.style,
        axisLabelVisible: true,
        title: s.title,
      }),
    );

    const lows = specs.map((s) => s.price);
    const highs = specs.map((s) => s.price);
    series.applyOptions({
      autoscaleInfoProvider: (
        original: () => { priceRange: { minValue: number; maxValue: number } } | null,
      ) => {
        const base = original();
        if (!base) return base;
        return {
          priceRange: {
            minValue: Math.min(base.priceRange.minValue, ...lows),
            maxValue: Math.max(base.priceRange.maxValue, ...highs),
          },
        };
      },
    });
  }, [showScenarios, candles.length]);

  return <div ref={host} className="h-[380px] w-full" />;
}

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

const VISIBLE_BARS = 160;

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
        scaleMargins: { top: 0.1, bottom: 0.08 },
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
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;
    series.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    const from = Math.max(0, candles.length - VISIBLE_BARS);
    chart.timeScale().setVisibleLogicalRange({
      from,
      to: candles.length + 2,
    });
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
        { price: 74041, title: "−10", color: "#3d9b8f", style: LineStyle.SparseDotted },
        { price: 65814, title: "−20", color: "#8a7018", style: LineStyle.SparseDotted },
        { price: 57588, title: "−30", color: "#c45c5c", style: LineStyle.SparseDotted },
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

    const linePrices = specs.map((s) => s.price);
    const recent = candles.slice(-VISIBLE_BARS);
    series.applyOptions({
      autoscaleInfoProvider: () => {
        const highs = recent.map((c) => c.high);
        const lows = recent.map((c) => c.low);
        const hi = Math.max(...highs, ...linePrices);
        const lo = Math.min(...lows, ...linePrices);
        const pad = Math.max((hi - lo) * 0.08, 800);
        return {
          priceRange: {
            minValue: lo - pad,
            maxValue: hi + pad,
          },
        };
      },
    });
  }, [showScenarios, candles]);

  return <div ref={host} className="h-[400px] w-full overflow-hidden" />;
}

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Smartphone, Globe, Server, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardFilters } from "./types";

const AIRLINES = [
  "OZ", "KE", "7C", "JL", "NH", "BR", "CX", "SQ", "TG", "CZ", "MU", "CA",
  "UA", "AA", "DL", "BA", "LH", "AF", "EK", "QR", "AY", "KL", "OS", "LX",
];
const AIRPORTS = [
  "ICN", "GMP", "LAX", "NRT", "CJU", "HND", "PUS", "KIX", "BKK", "SIN",
  "HKG", "PVG", "PEK", "TPE", "SFO", "JFK", "LHR", "CDG", "FRA", "DXB",
];
const TRIP_TYPES = ["OW", "RT", "MC"];
const PERIODS = ["24h", "7d"];

const CHANNELS: { value: string; label: string; icon: typeof Monitor }[] = [
  { value: "all", label: "전체", icon: Globe },
  { value: "web", label: "웹", icon: Monitor },
  { value: "mobile", label: "모바일", icon: Smartphone },
  { value: "api", label: "API", icon: Server },
];

const triggerClass =
  "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface FilterCardProps {
  filters: DashboardFilters;
  onFiltersChange: (f: DashboardFilters) => void;
}

export function FilterCard({ filters, onFiltersChange }: FilterCardProps) {
  const [airlineOpen, setAirlineOpen] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [airlineSearch, setAirlineSearch] = useState("");
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const airlineRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const selectedAirlines = useMemo(
    () => (filters.airline ? filters.airline.split(",").map((s) => s.trim()).filter(Boolean) : []),
    [filters.airline]
  );

  const filteredAirlines = useMemo(
    () =>
      AIRLINES.filter((a) =>
        a.toLowerCase().includes(airlineSearch.trim().toLowerCase())
      ),
    [airlineSearch]
  );
  const filteredOrigins = useMemo(
    () =>
      AIRPORTS.filter((a) =>
        a.toLowerCase().includes(originSearch.trim().toLowerCase())
      ),
    [originSearch]
  );
  const filteredDests = useMemo(
    () =>
      AIRPORTS.filter((a) =>
        a.toLowerCase().includes(destSearch.trim().toLowerCase())
      ),
    [destSearch]
  );

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (
        airlineRef.current && !airlineRef.current.contains(e.target as Node)
      ) setAirlineOpen(false);
      if (
        originRef.current && !originRef.current.contains(e.target as Node)
      ) setOriginOpen(false);
      if (
        destRef.current && !destRef.current.contains(e.target as Node)
      ) setDestOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const update = (key: keyof DashboardFilters, value: string) => {
    const next = { ...filters, [key]: value };
    if (key === "tripType" && value === "OW") next.arrivalDate = "";
    onFiltersChange(next);
  };

  const toggleAirline = (code: string) => {
    const set = new Set(selectedAirlines);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    update("airline", Array.from(set).join(","));
  };

  const removeAirline = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const next = selectedAirlines.filter((a) => a !== code);
    update("airline", next.join(","));
  };

  const isOW = filters.tripType === "OW";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 항공사: 다중 선택 + 검색 (칩 UI) - div 사용해 button 중첩 방지 */}
        <div ref={airlineRef} className="relative">
          <label className="text-xs text-muted-foreground">항공사</label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setAirlineOpen((o) => !o)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setAirlineOpen((o) => !o);
              }
            }}
            className={cn(triggerClass, "mt-1 cursor-pointer justify-between")}
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {selectedAirlines.length === 0 ? (
                <span className="text-muted-foreground">항공사 선택</span>
              ) : (
                selectedAirlines.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {code}
                    <button
                      type="button"
                      aria-label={`${code} 제거`}
                      onClick={(e) => removeAirline(e, code)}
                      className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
          {airlineOpen && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
              <input
                type="text"
                placeholder="항공사 검색..."
                value={airlineSearch}
                onChange={(e) => setAirlineSearch(e.target.value)}
                className="mb-2 h-8 w-full rounded border bg-background px-2 text-sm"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredAirlines.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">검색 결과 없음</p>
                ) : (
                  filteredAirlines.map((a) => (
                    <label
                      key={a}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(a)}
                        onChange={() => toggleAirline(a)}
                        className="h-4 w-4"
                      />
                      {a}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 출발: 검색 가능 단일 선택 */}
        <div ref={originRef} className="relative">
          <label className="text-xs text-muted-foreground">출발</label>
          <button
            type="button"
            onClick={() => { setOriginOpen((o) => !o); setOriginSearch(""); }}
            className={cn(triggerClass, "mt-1")}
          >
            <span>{filters.origin || "출발지 선택"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
          {originOpen && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
              <input
                type="text"
                placeholder="출발지 검색..."
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                className="mb-2 h-8 w-full rounded border bg-background px-2 text-sm"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredOrigins.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => { update("origin", a); setOriginOpen(false); }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 도착: 검색 가능 단일 선택 */}
        <div ref={destRef} className="relative">
          <label className="text-xs text-muted-foreground">도착</label>
          <button
            type="button"
            onClick={() => { setDestOpen((o) => !o); setDestSearch(""); }}
            className={cn(triggerClass, "mt-1")}
          >
            <span>{filters.dest || "도착지 선택"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
          {destOpen && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
              <input
                type="text"
                placeholder="도착지 검색..."
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                className="mb-2 h-8 w-full rounded border bg-background px-2 text-sm"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredDests.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => { update("dest", a); setDestOpen(false); }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground">편도/왕복</label>
          <Select value={filters.tripType} onValueChange={(v) => update("tripType", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">기간</label>
          <Select value={filters.period} onValueChange={(v) => update("period", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === "24h" ? "최근 24시간" : "최근 7일"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-border/80 bg-muted/40 p-2.5">
          <label className="text-xs font-medium text-muted-foreground">
            출발일 / 도착일
          </label>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {isOW ? "편도(OW)는 출발일만 적용됩니다." : "여정 날짜로 필터 (비우면 전체)"}
          </p>
          <div className="mt-2 space-y-2">
            <div>
              <label className="sr-only">출발일</label>
              <input
                type="date"
                value={filters.departureDate}
                onChange={(e) => update("departureDate", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {!isOW && (
              <div>
                <label className="sr-only">도착일</label>
                <input
                  type="date"
                  value={filters.arrivalDate}
                  onChange={(e) => update("arrivalDate", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-muted/40 p-2.5">
          <label className="text-xs font-medium text-muted-foreground">
            채널 (웹 / 모바일 구분)
          </label>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            노출된 경로별로 필터합니다.
          </p>
          <Select value={filters.channel} onValueChange={(v) => update("channel", v)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {c.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

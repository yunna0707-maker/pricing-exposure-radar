"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Smartphone, Globe, Server, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DashboardFilters } from "./types";
import type { FilterOptionsResult } from "./types";

const PERIODS = ["24h", "7d"];

const CHANNELS_UI: { value: string; label: string; icon: typeof Monitor }[] = [
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

function buildOptionsQuery(f: DashboardFilters): string {
  const p = new URLSearchParams();
  if (f.period) p.set("period", f.period);
  if (f.airline) p.set("airline", f.airline);
  if (f.tripType) p.set("tripType", f.tripType);
  if (f.channel && f.channel !== "all") p.set("channel", f.channel);
  if (f.origin) p.set("origin", f.origin);
  if (f.dest) p.set("dest", f.dest);
  if (f.departureDate?.trim()) p.set("departureDate", f.departureDate);
  if (f.arrivalDate?.trim()) p.set("arrivalDate", f.arrivalDate);
  return p.toString();
}

export function FilterCard({ filters, onFiltersChange }: FilterCardProps) {
  const [airlineOpen, setAirlineOpen] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [airlineSearch, setAirlineSearch] = useState("");
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [options, setOptions] = useState<FilterOptionsResult | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const airlineRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const selectedAirlines = useMemo(
    () => (filters.airline ? filters.airline.split(",").map((s) => s.trim()).filter(Boolean) : []),
    [filters.airline]
  );

  // 옵션 API 호출 (period 기본 24h). 개발 시에만 debug=1로 진단 정보 요청 후 콘솔 출력(운영에서는 미요청).
  useEffect(() => {
    const period = filters.period || "24h";
    const q = buildOptionsQuery({ ...filters, period });
    const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
    const url = `/api/exposures/options?${q}${isDev ? "&debug=1" : ""}`;
    setOptionsLoading(true);
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Options failed"))))
      .then((data: FilterOptionsResult & { debug?: Record<string, unknown> }) => {
        setOptions(data);
        if (isDev && data.debug) console.log("[options debug]", data.debug);
        setOptionsLoading(false);
      })
      .catch(() => {
        setOptions(null);
        setOptionsLoading(false);
      });
  }, [
    filters.period,
    filters.airline,
    filters.tripType,
    filters.channel,
    filters.origin,
    filters.dest,
    filters.departureDate,
    filters.arrivalDate,
  ]);

  // 옵션 로드 후 현재 선택이 유효하지 않으면 초기화 (캐스케이딩 보정)
  useEffect(() => {
    if (!options) return;
    let next = { ...filters };
    if (filters.origin && !options.origins.includes(filters.origin)) next = { ...next, origin: "" };
    if (filters.dest && !options.dests.includes(filters.dest)) next = { ...next, dest: "" };
    if (next.origin !== filters.origin || next.dest !== filters.dest) {
      onFiltersChange(next);
      toast.info("현재 조건에서 가능한 노선이 없어 출발/도착 선택을 초기화했습니다.");
    }
  }, [options, filters.origin, filters.dest, onFiltersChange]);

  const airlinesList = options?.airlines ?? [];
  const originsList = options?.origins ?? [];
  const destsList = options?.dests ?? [];
  const tripTypesList = options?.tripTypes ?? [];
  const channelsFromApi = options?.channels ?? [];

  const filteredAirlines = useMemo(
    () =>
      airlinesList.filter((a) =>
        a.toLowerCase().includes(airlineSearch.trim().toLowerCase())
      ),
    [airlinesList, airlineSearch]
  );
  const filteredOrigins = useMemo(
    () =>
      originsList.filter((a) =>
        a.toLowerCase().includes(originSearch.trim().toLowerCase())
      ),
    [originsList, originSearch]
  );
  const filteredDests = useMemo(
    () =>
      destsList.filter((a) =>
        a.toLowerCase().includes(destSearch.trim().toLowerCase())
      ),
    [destsList, destSearch]
  );

  const channelsList = useMemo(
    () =>
      channelsFromApi.length > 0
        ? [
            ...CHANNELS_UI.filter((c) => c.value === "all"),
            ...CHANNELS_UI.filter((c) => c.value !== "all" && channelsFromApi.includes(c.value)),
          ]
        : CHANNELS_UI,
    [channelsFromApi]
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

  const update = useCallback(
    (key: keyof DashboardFilters, value: string) => {
      const next = { ...filters, [key]: value };
      if (key === "tripType" && value === "OW") next.arrivalDate = "";
      onFiltersChange(next);
    },
    [filters, onFiltersChange]
  );

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
  const loadingSpinner = optionsLoading ? <Loader2 className="h-4 w-4 animate-spin opacity-50" /> : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">필터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 항공사: 다중 선택 + 검색 (연결 가능한 값만) */}
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
              {optionsLoading && airlinesList.length === 0 ? (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> 로딩 중…
                </span>
              ) : selectedAirlines.length === 0 ? (
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
            {loadingSpinner ?? <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
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
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {optionsLoading ? "로딩 중…" : "조건에 맞는 데이터 없음"}
                  </p>
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

        {/* 출발: 연결 가능한 origin만 */}
        <div ref={originRef} className="relative">
          <label className="text-xs text-muted-foreground">출발</label>
          <button
            type="button"
            onClick={() => { setOriginOpen((o) => !o); setOriginSearch(""); }}
            className={cn(triggerClass, "mt-1")}
          >
            <span>
              {optionsLoading && originsList.length === 0
                ? "로딩 중…"
                : filters.origin || "출발지 선택"}
            </span>
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
                {filteredOrigins.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {optionsLoading ? "로딩 중…" : "조건에 맞는 데이터 없음"}
                  </p>
                ) : (
                  filteredOrigins.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => { update("origin", a); setOriginOpen(false); }}
                    >
                      {a}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 도착: 선택된 출발과 연결되는 dest만 */}
        <div ref={destRef} className="relative">
          <label className="text-xs text-muted-foreground">도착</label>
          <button
            type="button"
            onClick={() => { setDestOpen((o) => !o); setDestSearch(""); }}
            className={cn(triggerClass, "mt-1")}
          >
            <span>
              {optionsLoading && destsList.length === 0 && originsList.length === 0
                ? "로딩 중…"
                : filters.dest || "도착지 선택"}
            </span>
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
                {filteredDests.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {optionsLoading ? "로딩 중…" : "조건에 맞는 데이터 없음"}
                  </p>
                ) : (
                  filteredDests.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => { update("dest", a); setDestOpen(false); }}
                    >
                      {a}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground">편도/왕복</label>
          <Select value={filters.tripType || " "} onValueChange={(v) => update("tripType", v === " " ? "" : v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={optionsLoading ? "로딩 중…" : "선택하세요"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">선택하세요</SelectItem>
              {tripTypesList.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">기간</label>
          <Select value={filters.period || " "} onValueChange={(v) => update("period", v === " " ? "" : v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">선택하세요</SelectItem>
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
          <Select value={filters.channel || " "} onValueChange={(v) => update("channel", v === " " ? "" : v)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">선택하세요</SelectItem>
              {channelsList.map((c) => {
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

        {options && options.availablePairsCount >= 0 && (
          <p className="text-[10px] text-muted-foreground">
            현재 조건 가능 OD 쌍: <strong>{options.availablePairsCount}</strong>개
          </p>
        )}
      </CardContent>
    </Card>
  );
}

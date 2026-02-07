import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  ListChecks,
  MessageSquareText,
  Plus,
  Search,
  Users,
} from "lucide-react";

// 단일 파일 프로토타입
// - 멘티 화면: 일일 플래너(할일/과목별 시간/날짜 이동), 주단위 미니 캘린더(월간 확장), 리마인더
// - 멘토 화면: 담당 멘티 목록, 할 일 등록(멘티+날짜+과제), 피드백 작성

const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function remainingCountForDate(tasksByDate, dateKey, menteeId) {
  const arr = tasksByDate?.[dateKey] || [];
  return arr.filter((t) => {
    const targetOk = !t.menteeId || t.menteeId === menteeId; // menteeId 없으면 공용으로 취급
    return targetOk && !t.done;
  }).length;
}

function startOfWeek(date) {
  // 월요일 시작
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Mon as first
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const weekDaysKo = ["월", "화", "수", "목", "금", "토", "일"];

function isImageFile(f) {
  const typeOk = (f.type || "").startsWith("image/");
  const nameOk = /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name || "");
  return typeOk || nameOk;
}

function toDetailFiles(fileList) {
  return Array.from(fileList || []).map((f) => ({
    id: `file_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: f.name,
    size: f.size,
    type: f.type,
    file: f,
    previewUrl: isImageFile(f) ? URL.createObjectURL(f) : null,
  }));
}

const seedMentees = [
  { id: "m1", name: "민지", grade: "고2", goal: "수학 2시간/일" },
  { id: "m2", name: "준호", grade: "중3", goal: "영어 단어 50개" },
  { id: "m3", name: "서연", grade: "고1", goal: "과탐 복습" },
];

const seedSubjects = ["국어", "수학", "영어", "과학", "사회", "기타"];
const themes = [
  {
    id: "white",
    name: "화이트",
    vars: {
      "--app-bg-from": "#fafafa",
      "--app-bg-to": "#f4f4f5",
      "--app-card": "#ffffff",
      "--app-muted": "rgba(0,0,0,0.03)",
      "--app-ring": "rgba(0,0,0,0.08)",
      "--app-text": "#0a0a0a",
      "--app-text-muted": "rgba(0,0,0,0.6)",
      "--app-primary": "#111827",
      "--app-primary-text": "#ffffff",
    },
  },
  {
    id: "mint",
    name: "민트",
    vars: {
      "--app-bg-from": "#ecfdf5",
      "--app-bg-to": "#cffafe",
      "--app-card": "#ffffff",
      "--app-muted": "rgba(5,150,105,0.08)",
      "--app-ring": "rgba(5,150,105,0.18)",
      "--app-text": "#064e3b",
      "--app-text-muted": "rgba(6,95,70,0.7)",
      "--app-primary": "#10b981",
      "--app-primary-text": "#052e2b",
    },
  },
  {
    id: "lavender",
    name: "라벤더",
    vars: {
      "--app-bg-from": "#f5f3ff",
      "--app-bg-to": "#fde2f3",
      "--app-card": "#ffffff",
      "--app-muted": "rgba(139,92,246,0.10)",
      "--app-ring": "rgba(139,92,246,0.20)",
      "--app-text": "#3b0764",
      "--app-text-muted": "rgba(59,7,100,0.65)",
      "--app-primary": "#8b5cf6",
      "--app-primary-text": "#ffffff",
    },
  },
  {
    id: "peach",
    name: "피치",
    vars: {
      "--app-bg-from": "#fff7ed",
      "--app-bg-to": "#ffe4e6",
      "--app-card": "#ffffff",
      "--app-muted": "rgba(251,113,133,0.10)",
      "--app-ring": "rgba(251,113,133,0.22)",
      "--app-text": "#7c2d12",
      "--app-text-muted": "rgba(124,45,18,0.65)",
      "--app-primary": "#fb7185",
      "--app-primary-text": "#7c2d12",
    },
  },
  {
    id: "sky",
    name: "스카이",
    vars: {
      "--app-bg-from": "#eff6ff",
      "--app-bg-to": "#cffafe",
      "--app-card": "#ffffff",
      "--app-muted": "rgba(56,189,248,0.12)",
      "--app-ring": "rgba(56,189,248,0.22)",
      "--app-text": "#0c4a6e",
      "--app-text-muted": "rgba(12,74,110,0.65)",
      "--app-primary": "#38bdf8",
      "--app-primary-text": "#082f49",
    },
  },
];

function buildInitialState() {
  const today = new Date();
  const todayKey = ymd(today);
  return {
    menteeId: "m1",
    selectedDate: today,
    // 날짜별 데이터
    tasksByDate: {
      [todayKey]: [
        {
          id: "t1",
          text: "수학 오답노트 1~10",
          done: false,
          assignedBy: "mentor",
          menteeId: "m1",
        },
        {
          id: "t2",
          text: "영단어 30개",
          done: true,
          assignedBy: "self",
          menteeId: "m1",
        },
      ],
    },
    studyByDate: {
      [todayKey]: {
        국어: 20,
        수학: 80,
        영어: 35,
        과학: 0,
        사회: 0,
        기타: 10,
      },
    },
    menteeCommentByDate: {
      [todayKey]: "오늘 수학 3번이 헷갈려요. 풀이 방향 피드백 부탁해요.",
    },

    subjects: ["국어", "수학", "영어", "과학", "사회", "기타"],

    reminders: [],

    // 멘토용
    assignedTasks: [], // 기록용
    feedbackByMentee: {
      m1: [
        {
          id: "f1",
          date: todayKey,
          title: "수학 오답 정리 좋아요",
          body: "오답의 원인을 한 문장으로 적는 습관을 유지해봅시다.",
        },
      ],
      m2: [],
      m3: [],
    },
    seenFeedbackIdsByMentee: {
      m1: ["f1"], // 초기 seed 피드백은 '이미 확인함'으로 처리
      m2: [],
      m3: [],
    },
  };
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-black/5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="text-xs text-black/60">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, right }) {
  return (
    <div className="rounded-3xl bg-[var(--app-card)] shadow-sm ring-1 ring-[var(--app-ring)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--app-ring)] px-5 py-4">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--app-muted)]">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="text-base font-semibold">{title}</div>
        </div>
        <div>{right}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MiniCalendar({
  date,
  onSelectDate,
  onToggleMonthly,
  tasksByDate,
  menteeId,
}) {
  const weekStart = startOfWeek(date);
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const todayKey = ymd(new Date());
  const selectedKey = ymd(date);

  return (
    <Section
      title="주단위 미니 캘린더"
      icon={Calendar}
      right={
        <button
          onClick={onToggleMonthly}
          className="rounded-2xl bg-[var(--app-primary)] px-3 py-2 text-xs font-semibold text-[var(--app-primary-text)] hover:opacity-90"
        >
          월간 계획표
        </button>
      }
    >
      <div className="grid grid-cols-7 gap-2">
        {weekDaysKo.map((d) => (
          <div key={d} className="text-center text-xs text-black/60">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const k = ymd(d);
          const remain = remainingCountForDate(tasksByDate, k, menteeId);
          const isToday = k === todayKey;
          const isSelected = k === selectedKey;
          return (
            <button
              key={k}
              onClick={() => onSelectDate(d)}
              className={
                "rounded-2xl px-2 py-3 text-sm font-semibold ring-1 transition " +
                (isSelected
                  ? "bg-black text-white ring-black"
                  : "bg-white hover:bg-black/5 ring-black/10")
              }
              title={k}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  {d.getDate()}
                  {remain > 0 ? (
                    <span className="absolute -right-3 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
                      {remain}
                    </span>
                  ) : null}
                </div>

                {isToday ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function MonthlyCalendar({
  date,
  onClose,
  onSelectDate,
  tasksByDate,
  menteeId,
}) {
  const mStart = startOfMonth(date);
  const mEnd = endOfMonth(date);

  // 월을 덮는 "주 시작일" 리스트 만들기 (최대 6주까지 가능)
  const monthWeekStarts = useMemo(() => {
    const first = startOfWeek(mStart);
    const last = startOfWeek(mEnd);
    const out = [];
    let cursor = new Date(first);
    while (cursor <= last) {
      out.push(new Date(cursor));
      cursor = addDays(cursor, 7);
    }
    return out;
  }, [mStart, mEnd]);

  // 왼쪽 인덱스 상태: month(월 전체) 또는 week(선택 주)
  const [viewMode, setViewMode] = useState("month"); // "month" | "week"
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // 월 전체 그리드(기존처럼 42칸)
  const startGrid = startOfWeek(mStart);
  const days42 = useMemo(() => {
    const out = [];
    let cursor = new Date(startGrid);
    for (let i = 0; i < 42; i++) {
      out.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return out;
  }, [startGrid]);

  const selectedKey = ymd(date);
  const month = date.getMonth();

  // 주차 클릭 시 보여줄 7일
  const weekStart = monthWeekStarts[selectedWeekIdx] || startOfWeek(mStart);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // 주차별 할 일 목록(요일별로 모으기)
  const weekTasksByDay = useMemo(() => {
    const out = weekDays.map((d) => {
      const k = ymd(d);
      const arr = tasksByDate?.[k] || [];
      const filtered = arr.filter(
        (t) => !t.menteeId || t.menteeId === menteeId,
      );
      return { date: d, dateKey: k, tasks: filtered };
    });
    return out;
  }, [weekDays, tasksByDate, menteeId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-black/60">월간 계획표</div>
            <div className="text-xl font-bold">
              {date.getFullYear()}년 {date.getMonth() + 1}월
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-[var(--app-primary-text)]"
          >
            닫기
          </button>
        </div>

        {/* 본문: 좌측 인덱스 + 우측 내용 */}
        <div className="mt-5 grid gap-4 md:grid-cols-12">
          {/* 좌측 인덱스 */}
          <div className="md:col-span-3">
            <div className="rounded-3xl bg-black/3 p-3 ring-1 ring-black/5">
              <div className="text-sm font-semibold px-2 py-2">인덱스</div>

              {/* 월(전체) */}
              <button
                onClick={() => setViewMode("month")}
                className={
                  "w-full text-left rounded-2xl px-4 py-3 ring-1 transition " +
                  (viewMode === "month"
                    ? "bg-black text-white ring-black"
                    : "bg-white ring-black/10 hover:bg-black/5")
                }
              >
                월
              </button>

              {/* 1~5주차 (월이 포함한 주만 표시) */}
              <div className="mt-2 space-y-2">
                {monthWeekStarts.map((ws, idx) => (
                  <button
                    key={ymd(ws)}
                    onClick={() => {
                      setSelectedWeekIdx(idx);
                      setViewMode("week");
                    }}
                    className={
                      "w-full text-left rounded-2xl px-4 py-3 ring-1 transition " +
                      (viewMode === "week" && selectedWeekIdx === idx
                        ? "bg-black text-white ring-black"
                        : "bg-white ring-black/10 hover:bg-black/5")
                    }
                  >
                    {idx + 1}주차
                    <div
                      className={
                        "mt-1 text-xs " +
                        (viewMode === "week" && selectedWeekIdx === idx
                          ? "text-white/70"
                          : "text-black/50")
                      }
                    >
                      {ymd(ws)} ~ {ymd(endOfWeek(ws))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측 내용 */}
          <div className="md:col-span-9">
            {viewMode === "month" ? (
              <>
                {/* 기존 월간 42칸 */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDaysKo.map((d) => (
                    <div key={d} className="text-center text-xs text-black/60">
                      {d}
                    </div>
                  ))}

                  {days42.map((d) => {
                    const k = ymd(d);
                    const remain = remainingCountForDate(
                      tasksByDate,
                      k,
                      menteeId,
                    );
                    const inMonth = d.getMonth() === month;
                    const isSelected = k === selectedKey;
                    const disabled = d < mStart || d > mEnd;

                    return (
                      <button
                        key={k}
                        onClick={() => {
                          if (!disabled) onSelectDate(d);
                        }}
                        className={
                          "rounded-2xl px-2 py-3 text-sm font-semibold ring-1 transition " +
                          (isSelected
                            ? "bg-black text-white ring-black"
                            : "bg-white hover:bg-black/5 ring-black/10") +
                          (inMonth ? "" : " opacity-40")
                        }
                        title={k}
                      >
                        <span className="relative inline-block">
                          {d.getDate()}
                          {remain > 0 ? (
                            <span className="absolute -right-3 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
                              {remain}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 text-sm text-black/60">
                  날짜를 선택하면 해당 날짜로 이동합니다.
                </div>
              </>
            ) : (
              <>
                {/* ✅ 주차 보기: 월~일 칸 */}
                <div className="rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {selectedWeekIdx + 1}주차 ( {ymd(weekStart)} ~{" "}
                      {ymd(endOfWeek(weekStart))} )
                    </div>
                    <button
                      onClick={() => setViewMode("month")}
                      className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold ring-1 ring-black/10 hover:bg-black/5"
                    >
                      월로 보기
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {weekDaysKo.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs text-black/60"
                      >
                        {d}
                      </div>
                    ))}

                    {weekDays.map((d) => {
                      const k = ymd(d);
                      const remain = remainingCountForDate(
                        tasksByDate,
                        k,
                        menteeId,
                      );
                      const isSelected = k === selectedKey;
                      const disabled = d < mStart || d > mEnd;

                      return (
                        <button
                          key={k}
                          onClick={() => {
                            if (!disabled) onSelectDate(d);
                          }}
                          className={
                            "rounded-2xl px-2 py-3 text-sm font-semibold ring-1 transition " +
                            (isSelected
                              ? "bg-black text-white ring-black"
                              : "bg-white hover:bg-black/5 ring-black/10") +
                            (disabled ? " opacity-40" : "")
                          }
                          title={k}
                        >
                          <span className="relative inline-block">
                            {d.getDate()}
                            {remain > 0 ? (
                              <span className="absolute -right-3 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
                                {remain}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ✅ 그 밑: 요일별 할 일 목록 */}
                <div className="mt-4 space-y-3">
                  {weekTasksByDay.map(({ date, dateKey, tasks }) => (
                    <div
                      key={dateKey}
                      className="rounded-3xl bg-white p-4 ring-1 ring-black/5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          {dateKey} ({weekDaysKo[(date.getDay() + 6) % 7]})
                        </div>
                        <div className="text-xs text-black/50">
                          {tasks.length}개
                        </div>
                      </div>

                      {tasks.length === 0 ? (
                        <div className="mt-2 rounded-2xl bg-black/3 px-3 py-3 text-sm text-black/50">
                          이 날은 할 일이 없어요.
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {tasks.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-2xl bg-black/3 px-3 py-3"
                            >
                              <div
                                className={
                                  "text-sm font-semibold " +
                                  (t.done ? "line-through text-black/40" : "")
                                }
                              >
                                {t.text}
                              </div>
                              <div className="mt-1 text-xs text-black/60">
                                {t.assignedBy === "mentor"
                                  ? "멘토 과제"
                                  : "내가 추가"}
                                {t.done ? " · 완료" : " · 미완료"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DailyPlanner({
  date,
  tasks,
  setTasks,
  study,
  setStudy,
  onOpenTask,
  dateKey,
  comment,
  setComment,
  subjects,
  setSubjects,
  menteeId,
}) {
  const [newTask, setNewTask] = useState("");

  const totalMinutes = useMemo(() => {
    if (!study) return 0;
    return Object.values(study).reduce((a, b) => a + (Number(b) || 0), 0);
  }, [study]);

  const doneCount = useMemo(
    () => (tasks || []).filter((t) => t.done).length,
    [tasks],
  );

  const addSubject = () => {
    const base = "새 과목";
    let name = base;
    let i = 1;
    const set = new Set(subjects || []);
    while (set.has(name)) {
      i += 1;
      name = `${base}${i}`;
    }
    setSubjects((prev) => [...(prev || []), name]);
    setStudy((prev) => ({ ...(prev || {}), [name]: 0 }));
  };

  const renameSubject = (oldName, newNameRaw) => {
    const newName = newNameRaw.trim();
    if (!newName || newName === oldName) return;

    // 중복 방지
    if ((subjects || []).includes(newName)) return;

    setSubjects((prev) =>
      (prev || []).map((s) => (s === oldName ? newName : s)),
    );

    // study 키도 같이 옮기기
    setStudy((prev) => {
      const cur = prev || {};
      const value = cur[oldName] ?? 0;
      const { [oldName]: _, ...rest } = cur;
      return { ...rest, [newName]: value };
    });
  };

  const deleteSubject = (name) => {
    setSubjects((prev) => (prev || []).filter((s) => s !== name));
    setStudy((prev) => {
      const cur = prev || {};
      const { [name]: _, ...rest } = cur;
      return rest;
    });
  };

  const setStudyHM = (subject, hours, minutes) => {
    const h = Math.max(0, Math.min(24, Number(hours || 0)));
    const m = Math.max(0, Math.min(59, Number(minutes || 0)));
    setStudy((prev) => ({ ...(prev || {}), [subject]: h * 60 + m }));
  };

  const addTask = () => {
    const t = newTask.trim();
    if (!t) return;

    setTasks((prev) => [
      ...(prev || []),
      {
        id: `t_${Date.now()}`,
        text: t,
        done: false,
        assignedBy: "self",
        menteeId,
      },
    ]);

    setNewTask("");
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      // 멘토가 부여한 과제는 삭제 불가
      if (target?.assignedBy === "mentor") return prev;
      return prev.filter((t) => t.id !== id);
    });
  };

  const updateStudy = (subject, minutes) => {
    const m = clamp(Number(minutes || 0), 0, 24 * 60);
    setStudy((prev) => ({ ...prev, [subject]: m }));
  };

  return (
    <Section
      title="일일 플래너"
      icon={ClipboardList}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <StatPill
            icon={ListChecks}
            label="완료"
            value={`${doneCount}/${(tasks || []).length}`}
          />
          <StatPill
            icon={Clock}
            label="총 공부"
            value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
          />
        </div>
      }
    >
      <div className="mb-5 rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
        <div className="text-sm font-semibold">오늘의 코멘트 / 질문</div>
        <div className="mt-1 text-xs text-black/60">
          멘토에게 남길 질문이나 오늘 학습 상태를 적어두세요.
        </div>
        <textarea
          value={comment || ""}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="예: 영어 지문 2번이 왜 오답인지 설명 부탁해요."
          className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">할 일 목록</div>
            <div className="text-xs text-black/60">{ymd(date)}</div>
          </div>

          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="할 일을 입력하고 Enter"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
            <button
              onClick={addTask}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white"
              title="추가"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {(tasks || []).length === 0 ? (
              <div className="rounded-2xl bg-white px-3 py-6 text-center text-sm text-black/50 ring-1 ring-black/5">
                아직 할 일이 없어요.
              </div>
            ) : (
              (tasks || []).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTask(t, dateKey)}
                  className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-black/5"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(t.id);
                    }}
                    className={
                      "mt-0.5 grid h-7 w-7 place-items-center rounded-xl ring-1 transition " +
                      (t.done
                        ? "bg-emerald-500 text-white ring-emerald-500"
                        : "bg-white ring-black/10 hover:bg-black/5")
                    }
                    title={t.done ? "완료 취소" : "완료"}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className={
                        "text-sm font-medium " +
                        (t.done ? "line-through text-black/40" : "")
                      }
                    >
                      {t.text}
                    </div>
                    <div className="mt-1 text-xs text-black/45">
                      {t.assignedBy === "mentor" ? "멘토 과제" : "내가 추가"}
                    </div>
                  </div>
                  {t.assignedBy !== "mentor" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(t.id);
                      }}
                      className="rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                    >
                      삭제
                    </button>
                  ) : (
                    <div className="rounded-xl px-2 py-1 text-xs font-semibold text-black/40">
                      삭제 불가
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">과목별 공부시간 체크</div>
              <button
                onClick={addSubject}
                className="rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                과목 추가
              </button>
            </div>

            <div className="space-y-2">
              {(subjects || []).length === 0 ? (
                <div className="rounded-2xl bg-white/60 px-3 py-6 text-center text-sm text-black/50 ring-1 ring-black/5">
                  과목이 없어요. “과목 추가”를 눌러주세요.
                </div>
              ) : (
                (subjects || []).map((sub) => {
                  const totalMin = Number(study?.[sub] ?? 0);
                  const h = Math.floor(totalMin / 60);
                  const m = totalMin % 60;

                  return (
                    <div
                      key={sub}
                      className="grid grid-cols-12 items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/5"
                    >
                      {/* 과목명 수정 */}
                      <input
                        className="col-span-4 rounded-xl border border-black/10 bg-white px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-black/20"
                        defaultValue={sub}
                        onBlur={(e) => renameSubject(sub, e.target.value)}
                        title="과목명 수정: 입력 후 포커스 해제"
                      />

                      {/* 시간(h) */}
                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={h}
                          onChange={(e) => setStudyHM(sub, e.target.value, m)}
                          className="w-full rounded-xl border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-black/20"
                        />
                        <span className="text-xs text-black/60">h</span>
                      </div>

                      {/* 분(m) */}
                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={m}
                          onChange={(e) => setStudyHM(sub, h, e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-black/20"
                        />
                        <span className="text-xs text-black/60">m</span>
                      </div>

                      {/* 삭제 */}
                      <button
                        onClick={() => deleteSubject(sub)}
                        className="col-span-2 rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                        title="과목 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-xs text-black/60 ring-1 ring-black/5">
            팁: 오늘 계획한 총 공부시간을 먼저 대략 입력하고(과목 분배), 끝나고
            실제로 수정하면 좋아요.
          </div>
        </div>
      </div>
    </Section>
  );
}

function Reminders({
  reminders,
  setReminders,
  summary,
  unseenFeedbackCount,
  onMarkFeedbackSeen,
}) {
  const del = (id) => setReminders((prev) => prev.filter((r) => r.id !== id));

  return (
    <Section title="리마인더 알림" icon={Bell}>
      <div className="mb-4 rounded-2xl bg-black/3 px-4 py-3 ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">오늘 요약</div>
          {unseenFeedbackCount > 0 ? (
            <button
              onClick={onMarkFeedbackSeen}
              className="rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              새 피드백 {unseenFeedbackCount}개 · 확인함
            </button>
          ) : (
            <div className="text-xs font-semibold text-black/50">
              새 피드백 없음
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-black/5">
            <div className="text-xs font-semibold text-black/60">
              오늘 미완료 할 일
            </div>
            {summary.todayUndone.length === 0 ? (
              <div className="mt-2 text-sm text-black/60">없어요 🎉</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {summary.todayUndone.slice(0, 5).map((t) => (
                  <li key={t.id} className="truncate">
                    • {t.text}
                  </li>
                ))}
                {summary.todayUndone.length > 5 ? (
                  <li className="text-xs text-black/50">
                    외 {summary.todayUndone.length - 5}개
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-black/5">
            <div className="text-xs font-semibold text-black/60">
              내일 할 일
            </div>
            <div className="mt-2 text-sm">
              총 <span className="font-semibold">{summary.tomorrowCount}</span>
              개
            </div>
            <div className="mt-1 text-xs text-black/50">
              (내일 날짜에 등록된 할 일 기준)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-black/3 px-4 py-3 text-xs text-black/60">
        실제 서비스에서는 Web Push/알림 권한, 백엔드 스케줄러(예: cron), 또는
        모바일 푸시로 연동해요. 지금은 UI 프로토타입입니다.
      </div>
    </Section>
  );
}

function MenteeScreen({ state, setState, onOpenTask }) {
  const dateKey = ymd(state.selectedDate);

  const comment = state.menteeCommentByDate?.[dateKey] || "";
  const setCommentForDate = (nextValue) => {
    setState((prev) => ({
      ...prev,
      menteeCommentByDate: {
        ...(prev.menteeCommentByDate || {}),
        [dateKey]: nextValue,
      },
    }));
  };

  const tasks = state.tasksByDate[dateKey] || [];
  const subjects = state.subjects || [];
  const study =
    state.studyByDate[dateKey] ||
    subjects.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});

  const setTasksForDate = (updater) => {
    setState((prev) => {
      const current = prev.tasksByDate[dateKey] || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        tasksByDate: { ...prev.tasksByDate, [dateKey]: next },
      };
    });
  };

  const setStudyForDate = (updater) => {
    setState((prev) => {
      const current =
        prev.studyByDate[dateKey] ||
        seedSubjects.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        ...prev,
        studyByDate: { ...prev.studyByDate, [dateKey]: next },
      };
    });
  };

  // ✅ 주간(월~일) 범위
  const weekStart = startOfWeek(state.selectedDate);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekTaskItems = useMemo(() => {
    const menteeId = state.menteeId;
    return weekDays.flatMap((d) => {
      const dateKey = ymd(d);
      const arr = state.tasksByDate[dateKey] || [];
      return arr
        .filter((t) => !t.menteeId || t.menteeId === menteeId) // 멘티 본인 것만
        .map((t) => ({ ...t, dateKey }));
    });
  }, [state.tasksByDate, state.menteeId, weekDays]);

  const weekFeedbackItems = useMemo(() => {
    const menteeId = state.menteeId;
    const all = state.feedbackByMentee?.[menteeId] || [];
    const startKey = ymd(weekStart);
    const endKey = ymd(addDays(weekStart, 6));
    return all.filter((f) => f.date >= startKey && f.date <= endKey);
  }, [state.feedbackByMentee, state.menteeId, weekStart]);

  const moveDate = (delta) =>
    setState((p) => ({ ...p, selectedDate: addDays(p.selectedDate, delta) }));

  const [monthlyOpen, setMonthlyOpen] = useState(false);

  // ===== 리마인더 요약(오늘/내일/새 피드백) =====
  const today = new Date();
  const todayKey = ymd(today);
  const tomorrowKey = ymd(addDays(today, 1));

  const todayTasks = state.tasksByDate[todayKey] || [];
  const tomorrowTasks = state.tasksByDate[tomorrowKey] || [];

  const todayUndone = todayTasks.filter((t) => !t.done);

  const feedbackList = state.feedbackByMentee?.[state.menteeId] || [];
  const seenIds = state.seenFeedbackIdsByMentee?.[state.menteeId] || [];
  const unseenFeedback = feedbackList.filter((f) => !seenIds.includes(f.id));

  const reminderSummary = {
    todayUndone,
    tomorrowCount: tomorrowTasks.length,
  };

  const markFeedbackSeen = () => {
    setState((p) => {
      const list = p.feedbackByMentee?.[p.menteeId] || [];
      const allIds = list.map((f) => f.id);
      return {
        ...p,
        seenFeedbackIdsByMentee: {
          ...(p.seenFeedbackIdsByMentee || {}),
          [p.menteeId]: allIds,
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-black/60">멘티 화면</div>
          <div className="text-2xl font-bold">오늘도 계획대로 가보자</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => moveDate(-1)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/10 hover:bg-black/5"
            title="이전 날짜"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/10">
            {ymd(state.selectedDate)}
          </div>
          <button
            onClick={() => moveDate(1)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/10 hover:bg-black/5"
            title="다음 날짜"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DailyPlanner
            date={state.selectedDate}
            tasks={tasks}
            setTasks={setTasksForDate}
            study={study}
            setStudy={setStudyForDate}
            dateKey={dateKey}
            menteeId={state.menteeId}
            onOpenTask={onOpenTask}
            comment={comment}
            setComment={setCommentForDate}
            subjects={subjects}
            setSubjects={(updater) =>
              setState((p) => ({
                ...p,
                subjects:
                  typeof updater === "function"
                    ? updater(p.subjects || [])
                    : updater,
              }))
            }
          />

          {/* ✅ 주간 학습 리포트 */}
          <Section title="주간 학습 리포트" icon={ClipboardList}>
            <div className="text-xs text-black/60">
              {ymd(weekStart)} ~ {ymd(addDays(weekStart, 6))} (총{" "}
              {weekTaskItems.length}개)
            </div>

            <div className="mt-3 space-y-2">
              {weekTaskItems.length === 0 ? (
                <div className="rounded-2xl bg-black/3 px-3 py-6 text-center text-sm text-black/50">
                  이번 주 할 일이 아직 없어요.
                </div>
              ) : (
                weekTaskItems.map((t) => (
                  <button
                    key={`${t.dateKey}_${t.id}`}
                    onClick={() => onOpenTask(t, t.dateKey)}
                    className="w-full text-left rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 hover:bg-black/5 transition"
                    title="클릭하면 상세페이지"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={
                          "text-sm font-semibold " +
                          (t.done ? "line-through text-black/40" : "")
                        }
                      >
                        {t.text}
                      </div>
                      <div className="text-xs text-black/60">{t.dateKey}</div>
                    </div>
                    <div className="mt-1 text-xs text-black/60">
                      상태: {t.done ? "완료" : "미완료"} ·{" "}
                      {t.assignedBy === "mentor" ? "멘토 과제" : "내가 추가"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Section>

          {/* ✅ (3번) 주간 리포트 밑 멘토 피드백 */}
          <Section title="이번 주 멘토 피드백" icon={MessageSquareText}>
            <div className="mt-2 space-y-2">
              {weekFeedbackItems.length === 0 ? (
                <div className="rounded-2xl bg-black/3 px-3 py-6 text-center text-sm text-black/50">
                  이번 주에 받은 피드백이 없어요.
                </div>
              ) : (
                weekFeedbackItems.map((f) => (
                  <div key={f.id} className="rounded-2xl bg-black/3 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{f.title}</div>
                      <div className="text-xs text-black/60">{f.date}</div>
                    </div>
                    <div className="mt-2 text-sm text-black/75 whitespace-pre-wrap">
                      {f.body}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <MiniCalendar
            date={state.selectedDate}
            onSelectDate={(d) => setState((p) => ({ ...p, selectedDate: d }))}
            onToggleMonthly={() => setMonthlyOpen(true)}
            tasksByDate={state.tasksByDate}
            menteeId={state.menteeId}
          />

          <Reminders
            reminders={state.reminders}
            setReminders={(updater) =>
              setState((p) => ({
                ...p,
                reminders:
                  typeof updater === "function"
                    ? updater(p.reminders)
                    : updater,
              }))
            }
            summary={reminderSummary}
            unseenFeedbackCount={unseenFeedback.length}
            onMarkFeedbackSeen={markFeedbackSeen}
          />
        </div>
      </div>

      {monthlyOpen ? (
        <MonthlyCalendar
          date={state.selectedDate}
          onClose={() => setMonthlyOpen(false)}
          onSelectDate={(d) => {
            setState((p) => ({ ...p, selectedDate: d }));
            setMonthlyOpen(false);
          }}
          tasksByDate={state.tasksByDate}
          menteeId={state.menteeId}
        />
      ) : null}
    </div>
  );
}

function TaskDetailModal({ open, onClose, role, task, details, setDetails }) {
  if (!open || !task) return null;

  const canEditMentee = role === "mentee";
  const canEditMentor = role === "mentor";

  const isImageFile = (f) => {
    const typeOk = (f.type || "").startsWith("image/");
    const nameOk = /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name || "");
    return typeOk || nameOk;
  };

  const addFiles = (who, fileList) => {
    const files = Array.from(fileList || []).map((f) => ({
      id: `file_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
      previewUrl: isImageFile(f) ? URL.createObjectURL(f) : null,
    }));

    setDetails((p) => {
      const cur = p || {};
      const key = who === "mentee" ? "menteeFiles" : "mentorFiles";
      return { ...cur, [key]: [...(cur[key] || []), ...files] };
    });
  };

  const removeFile = (who, id) => {
    setDetails((p) => {
      const cur = p || {};
      const key = who === "mentee" ? "menteeFiles" : "mentorFiles";
      const arr = cur[key] || [];
      const target = arr.find((x) => x.id === id);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return { ...cur, [key]: arr.filter((x) => x.id !== id) };
    });
  };

  const downloadFile = (f) => {
    const url = URL.createObjectURL(f.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3 border-b border-black/5 px-6 py-5">
          <div className="min-w-0">
            <div className="text-xs text-black/60">할 일 상세</div>
            <div className="mt-1 text-lg font-bold break-words">
              {task.text}
            </div>
            <div className="mt-1 text-xs text-black/50">
              날짜: {task.dateKey} ·{" "}
              {task.assignedBy === "mentor" ? "멘토 과제" : "내가 추가"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-[var(--app-primary-text)]"
          >
            닫기
          </button>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2">
          {/* 멘티 제출 */}
          <div className="rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
            <div className="text-sm font-semibold">멘티 제출</div>
            <div className="mt-2 text-xs text-black/60">
              풀이/메모 + 파일 업로드
            </div>

            <textarea
              value={details?.menteeNote || ""}
              onChange={(e) =>
                setDetails((p) => ({
                  ...(p || {}),
                  menteeNote: e.target.value,
                }))
              }
              rows={6}
              placeholder="예: 3번에서 식 변형을 이렇게 했고, 틀린 이유는 ..."
              disabled={!canEditMentee}
              className={
                "mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 " +
                (!canEditMentee ? "opacity-70" : "")
              }
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <label
                className={
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ring-1 " +
                  (canEditMentee
                    ? "bg-white ring-black/10 hover:bg-black/5 cursor-pointer"
                    : "bg-white/60 ring-black/5 opacity-60 cursor-not-allowed")
                }
              >
                <input
                  type="file"
                  multiple
                  disabled={!canEditMentee}
                  className="hidden"
                  onChange={(e) => addFiles("mentee", e.target.files)}
                />
                파일 업로드
              </label>
              <div className="text-xs text-black/50">
                {details?.menteeFiles?.length || 0}개
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {(details?.menteeFiles || []).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {f.previewUrl ? (
                      <img
                        src={f.previewUrl}
                        alt={f.name}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/10"
                        onClick={() => window.open(f.previewUrl, "_blank")}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-black/5 ring-1 ring-black/10 grid place-items-center text-xs text-black/40">
                        FILE
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {f.name}
                      </div>
                      <div className="text-xs text-black/50">
                        {(f.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile(f)}
                      className="rounded-xl px-2 py-1 text-xs font-semibold hover:bg-black/5"
                    >
                      다운로드
                    </button>
                    {canEditMentee ? (
                      <button
                        onClick={() => removeFile("mentee", f.id)}
                        className="rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {(details?.menteeFiles || []).length === 0 ? (
                <div className="rounded-2xl bg-white/60 px-3 py-3 text-sm text-black/50 ring-1 ring-black/5">
                  업로드한 파일이 없어요.
                </div>
              ) : null}
            </div>
          </div>

          {/* 멘토 피드백 */}
          <div className="rounded-3xl bg-black/3 p-4 ring-1 ring-black/5">
            <div className="text-sm font-semibold">멘토 피드백</div>
            <div className="mt-2 text-xs text-black/60">
              코멘트 + (선택) 파일 첨부
            </div>

            <textarea
              value={details?.mentorNote || ""}
              onChange={(e) =>
                setDetails((p) => ({
                  ...(p || {}),
                  mentorNote: e.target.value,
                }))
              }
              rows={6}
              placeholder="예: 2번은 개념 적용이 좋아요. 다만 부호 실수가 있어서..."
              disabled={!canEditMentor}
              className={
                "mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 " +
                (!canEditMentor ? "opacity-70" : "")
              }
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <label
                className={
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ring-1 " +
                  (canEditMentor
                    ? "bg-white ring-black/10 hover:bg-black/5 cursor-pointer"
                    : "bg-white/60 ring-black/5 opacity-60 cursor-not-allowed")
                }
              >
                <input
                  type="file"
                  multiple
                  disabled={!canEditMentor}
                  className="hidden"
                  onChange={(e) => addFiles("mentor", e.target.files)}
                />
                파일 첨부
              </label>
              <div className="text-xs text-black/50">
                {details?.mentorFiles?.length || 0}개
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {(details?.mentorFiles || []).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {f.previewUrl ? (
                      <img
                        src={f.previewUrl}
                        alt={f.name}
                        className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/10"
                        onClick={() => window.open(f.previewUrl, "_blank")}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-black/5 ring-1 ring-black/10 grid place-items-center text-xs text-black/40">
                        FILE
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {f.name}
                      </div>
                      <div className="text-xs text-black/50">
                        {(f.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile(f)}
                      className="rounded-xl px-2 py-1 text-xs font-semibold hover:bg-black/5"
                    >
                      다운로드
                    </button>
                    {canEditMentor ? (
                      <button
                        onClick={() => removeFile("mentor", f.id)}
                        className="rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {(details?.mentorFiles || []).length === 0 ? (
                <div className="rounded-2xl bg-white/60 px-3 py-3 text-sm text-black/50 ring-1 ring-black/5">
                  첨부된 파일이 없어요.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-2xl bg-black/3 px-4 py-3 text-xs text-black/60">
            지금은 UI 프로토타입이라 파일/텍스트가 브라우저 메모리에만 저장돼요.
            나중에 백엔드 연결 시 DB/S3 같은 곳으로 저장하도록 바꾸면 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorScreen({ state, setState, onOpenTask, setTaskDetailsByKey }) {
  const [q, setQ] = useState("");
  const [selectedMentee, setSelectedMentee] = useState(state.menteeId);
  const [assignDate, setAssignDate] = useState(ymd(state.selectedDate));
  const [taskText, setTaskText] = useState("");
  const [assignFiles, setAssignFiles] = useState([]);

  const [fbTitle, setFbTitle] = useState("");
  const [fbBody, setFbBody] = useState("");

  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const selectedMenteeInfo = seedMentees.find((m) => m.id === selectedMentee);

  const selectedMenteeTasks = useMemo(() => {
    const entries = Object.entries(state.tasksByDate || {});

    const all = entries.flatMap(([dateKey, arr]) =>
      (arr || [])
        // 선택된 멘티 것만
        .filter((t) => t.menteeId === selectedMentee)
        .map((t) => ({ ...t, dateKey })),
    );

    all.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return all;
  }, [state.tasksByDate, selectedMentee]);

  const deleteFeedback = (id) => {
    setState((prev) => {
      const arr = prev.feedbackByMentee[selectedMentee] || [];
      return {
        ...prev,
        feedbackByMentee: {
          ...prev.feedbackByMentee,
          [selectedMentee]: arr.filter((f) => f.id !== id),
        },
      };
    });
  };

  const startEditFeedback = (f) => {
    setEditingFeedbackId(f.id);
    setEditTitle(f.title);
    setEditBody(f.body);
  };

  const saveEditFeedback = () => {
    const title = editTitle.trim();
    const body = editBody.trim();
    if (!title || !body) return;

    setState((prev) => {
      const arr = prev.feedbackByMentee[selectedMentee] || [];
      return {
        ...prev,
        feedbackByMentee: {
          ...prev.feedbackByMentee,
          [selectedMentee]: arr.map((f) =>
            f.id === editingFeedbackId ? { ...f, title, body } : f,
          ),
        },
      };
    });

    setEditingFeedbackId(null);
    setEditTitle("");
    setEditBody("");
  };

  const mentees = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return seedMentees;
    return seedMentees.filter((m) =>
      `${m.name} ${m.grade} ${m.goal}`.toLowerCase().includes(qq),
    );
  }, [q]);

  const addAssignment = () => {
    const text = taskText.trim();
    if (!text) return;

    const targetDate = assignDate;

    // ✅ 과제 객체 먼저 만들기
    const newTask = {
      id: `t_${Date.now()}`,
      text,
      done: false,
      assignedBy: "mentor",
      menteeId: selectedMentee,
    };

    // ✅ 과제 등록
    setState((prev) => {
      const prevTasks = prev.tasksByDate[targetDate] || [];
      return {
        ...prev,
        tasksByDate: {
          ...prev.tasksByDate,
          [targetDate]: [...prevTasks, newTask],
        },
        assignedTasks: [
          { ...newTask, date: targetDate },
          ...prev.assignedTasks,
        ],
      };
    });

    // ✅ 여기서 상세(details)에 멘토 파일을 저장 → 상세페이지에서 바로 보임
    if (assignFiles.length > 0) {
      const detailKey = `${targetDate}__${newTask.id}`;
      setTaskDetailsByKey((prev) => {
        const cur = prev[detailKey] || {};
        return {
          ...prev,
          [detailKey]: {
            ...cur,
            mentorFiles: [...(cur.mentorFiles || []), ...assignFiles],
          },
        };
      });
    }

    // 입력 초기화
    setTaskText("");
    setAssignFiles([]);
  };

  const addFeedback = () => {
    const title = fbTitle.trim();
    const body = fbBody.trim();
    if (!title || !body) return;

    setState((prev) => {
      const arr = prev.feedbackByMentee[selectedMentee] || [];
      const item = {
        id: `f_${Date.now()}`,
        date: ymd(prev.selectedDate),
        title,
        body,
      };
      return {
        ...prev,
        feedbackByMentee: {
          ...prev.feedbackByMentee,
          [selectedMentee]: [item, ...arr],
        },
      };
    });

    setFbTitle("");
    setFbBody("");
  };

  const activeMentee = seedMentees.find((m) => m.id === selectedMentee);
  const feedbackList = state.feedbackByMentee[selectedMentee] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-black/60">멘토 화면</div>
          <div className="text-2xl font-bold">멘티 관리</div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/10">
          <Search className="h-4 w-4 text-black/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="멘티 검색 (이름/학년/목표)"
            className="w-72 max-w-[60vw] bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Section title="담당 멘티 목록" icon={Users}>
            <div className="space-y-2">
              {mentees.map((m) => {
                const active = m.id === selectedMentee;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentee(m.id)}
                    className={
                      "w-full rounded-2xl p-3 text-left ring-1 transition " +
                      (active
                        ? "bg-black text-white ring-black"
                        : "bg-white ring-black/10 hover:bg-black/5")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div
                        className={
                          "text-xs " +
                          (active ? "text-white/70" : "text-black/50")
                        }
                      >
                        {m.grade}
                      </div>
                    </div>
                    <div
                      className={
                        "mt-1 text-xs " +
                        (active ? "text-white/70" : "text-black/60")
                      }
                    >
                      목표: {m.goal}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-black/3 px-4 py-3 text-xs text-black/60">
              이 목록은 예시 데이터입니다. 실제로는 멘토 계정의 “담당 멘티”를
              서버에서 불러옵니다.
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Section title="할 일 등록" icon={GraduationCap}>
            <Section title="멘티 학습 현황 (할 일 목록)" icon={ClipboardList}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* ✅ (선택 멘티) 불필요한 Section 제거하고 내용만 유지 */}
                <div className="md:col-span-2">
                  <div className="rounded-2xl bg-black/3 px-4 py-3 text-sm ring-1 ring-black/5">
                    <div className="font-semibold">
                      {selectedMenteeInfo?.name} ({selectedMenteeInfo?.grade})
                    </div>
                    <div className="text-xs text-black/60">
                      목표: {selectedMenteeInfo?.goal}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedMenteeTasks.length === 0 ? (
                      <div className="rounded-2xl bg-white/60 px-3 py-6 text-center text-sm text-black/50 ring-1 ring-black/5">
                        아직 이 멘티에게 부여된 과제가 없어요.
                      </div>
                    ) : (
                      selectedMenteeTasks.slice(0, 12).map((t) => (
                        <button
                          key={`${t.id}_${t.dateKey}`}
                          onClick={() => onOpenTask(t, t.dateKey)}
                          className="w-full text-left rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 hover:bg-black/5 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className={
                                "text-sm font-semibold " +
                                (t.done ? "line-through text-black/40" : "")
                              }
                            >
                              {t.text}
                            </div>
                            <div className="text-xs text-black/60">
                              {t.dateKey}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-black/60">
                            상태: {t.done ? "완료" : "미완료"} · 클릭해서
                            제출/피드백 보기
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Section>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="mb-1 text-xs text-black/60">학생 선택</div>
                <select
                  value={selectedMentee}
                  onChange={(e) => setSelectedMentee(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                >
                  {seedMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs text-black/60">날짜 선택</div>
                <input
                  type="date"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div className="md:col-span-3">
                <div className="mb-1 text-xs text-black/60">부여할 과제</div>
                <div className="flex gap-2">
                  <input
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addAssignment();
                    }}
                    placeholder="예: 수학 오답 10문제 + 개념노트 1장"
                    className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <button
                    onClick={addAssignment}
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white"
                    title="등록"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="md:col-span-3 mt-3">
                <div className="mb-1 text-xs text-black/60">
                  첨부 파일(선택)
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ring-1 bg-white ring-black/10 hover:bg-black/5 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = toDetailFiles(e.target.files);
                        setAssignFiles((prev) => [...prev, ...files]);
                        e.target.value = ""; // 같은 파일 다시 선택 가능하게
                      }}
                    />
                    파일 업로드
                  </label>
                  <div className="text-xs text-black/50">
                    {assignFiles.length}개
                  </div>
                </div>

                {/* 선택한 파일 미리보기/삭제 */}
                <div className="mt-2 space-y-2">
                  {assignFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {f.previewUrl ? (
                          <img
                            src={f.previewUrl}
                            alt={f.name}
                            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-black/10"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-black/5 ring-1 ring-black/10 grid place-items-center text-xs text-black/40">
                            FILE
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {f.name}
                          </div>
                          <div className="text-xs text-black/50">
                            {(f.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
                          setAssignFiles((prev) =>
                            prev.filter((x) => x.id !== f.id),
                          );
                        }}
                        className="rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                      >
                        삭제
                      </button>
                    </div>
                  ))}

                  {assignFiles.length === 0 ? (
                    <div className="rounded-2xl bg-white/60 px-3 py-3 text-sm text-black/50 ring-1 ring-black/5">
                      첨부된 파일이 없어요.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
              <div className="text-sm font-semibold">최근 등록한 과제</div>
              <div className="mt-2 space-y-2">
                {state.assignedTasks.length === 0 ? (
                  <div className="rounded-2xl bg-black/3 px-3 py-6 text-center text-sm text-black/50">
                    아직 등록한 과제가 없어요.
                  </div>
                ) : (
                  state.assignedTasks.slice(0, 5).map((t) => {
                    const m = seedMentees.find((x) => x.id === t.menteeId);
                    return (
                      <div
                        key={`${t.id}_${t.date}`}
                        className="rounded-2xl bg-black/3 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">{t.text}</div>
                          <div className="text-xs text-black/60">{t.date}</div>
                        </div>
                        <div className="mt-1 text-xs text-black/60">
                          대상: {m?.name || "-"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Section>

          <Section title="피드백 작성" icon={MessageSquareText}>
            <div className="rounded-2xl bg-black/3 px-4 py-3 text-sm">
              <div className="font-semibold">
                현재 선택된 멘티: {activeMentee?.name} ({activeMentee?.grade})
              </div>
              <div className="text-xs text-black/60">
                목표: {activeMentee?.goal}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={fbTitle}
                onChange={(e) => setFbTitle(e.target.value)}
                placeholder="피드백 제목 (예: 이번 주 루틴 좋아요)"
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
              />
              <textarea
                value={fbBody}
                onChange={(e) => setFbBody(e.target.value)}
                rows={5}
                placeholder="피드백 내용 (구체적으로: 잘한 점 + 다음 액션)"
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
              />
              <button
                onClick={addFeedback}
                className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-[var(--app-primary-text)] hover:opacity-90"
              >
                피드백 저장
              </button>
            </div>

            <Section title="피드백 관리" icon={MessageSquareText}>
              <div className="rounded-2xl bg-black/3 px-4 py-3 text-sm">
                <div className="font-semibold">
                  대상 멘티: {selectedMenteeInfo?.name} (
                  {selectedMenteeInfo?.grade})
                </div>
                <div className="text-xs text-black/60">
                  저장된 피드백을 수정/삭제할 수 있어요.
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(state.feedbackByMentee[selectedMentee] || []).length === 0 ? (
                  <div className="rounded-2xl bg-white/60 px-3 py-6 text-center text-sm text-black/50 ring-1 ring-black/5">
                    아직 피드백이 없어요.
                  </div>
                ) : (
                  (state.feedbackByMentee[selectedMentee] || [])
                    .slice(0, 10)
                    .map((f) => (
                      <div
                        key={f.id}
                        className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5"
                      >
                        {editingFeedbackId === f.id ? (
                          <>
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                            />
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={4}
                              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={saveEditFeedback}
                                className="rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingFeedbackId(null)}
                                className="rounded-2xl bg-black/5 px-3 py-2 text-xs font-semibold"
                              >
                                취소
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold">
                                {f.title}
                              </div>
                              <div className="text-xs text-black/60">
                                {f.date}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-black/75 whitespace-pre-wrap">
                              {f.body}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => startEditFeedback(f)}
                                className="rounded-xl px-2 py-1 text-xs font-semibold hover:bg-black/5"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => deleteFeedback(f.id)}
                                className="rounded-xl px-2 py-1 text-xs font-semibold text-black/60 hover:bg-black/5"
                              >
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                )}
              </div>
            </Section>
          </Section>
        </div>
      </div>
    </div>
  );
}

function TopNav({ role, setRole, menteeId, setMenteeId, themeId, setThemeId }) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-black/60">멘토-멘티 플래너</div>
            <div className="text-lg font-bold">Prototype</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/10">
            <button
              onClick={() => setRole("mentee")}
              className={
                "rounded-2xl px-4 py-2 text-sm font-semibold transition " +
                (role === "mentee" ? "bg-black text-white" : "hover:bg-black/5")
              }
            >
              멘티
            </button>
            <button
              onClick={() => setRole("mentor")}
              className={
                "rounded-2xl px-4 py-2 text-sm font-semibold transition " +
                (role === "mentor" ? "bg-black text-white" : "hover:bg-black/5")
              }
            >
              멘토
            </button>
          </div>

          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/10">
            <div className="flex items-center gap-2">
              <div className="text-xs text-black/60">테마</div>
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {role === "mentee" ? (
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-black/50" />
                <select
                  value={menteeId}
                  onChange={(e) => setMenteeId(e.target.value)}
                  className="bg-transparent text-sm font-semibold outline-none"
                >
                  {seedMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-px bg-black/5" />
    </div>
  );
}

export default function MentorMenteePlannerApp() {
  const [role, setRole] = useState("mentee");
  const [state, setState] = useState(buildInitialState);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState(null); // { id, text, dateKey ... }
  const [taskDetailsByKey, setTaskDetailsByKey] = useState({});
  // taskId -> { menteeNote, menteeFiles: [{id,name,size,file}], mentorNote, mentorFiles: [...] }

  const [themeId, setThemeId] = useState("white");
  const activeTheme = useMemo(
    () => themes.find((t) => t.id === themeId) || themes[0],
    [themeId],
  );

  const openTaskDetail = (task, dateKey) => {
    const detailKey = `${dateKey}__${task.id}`;
    setDetailTask({ ...task, dateKey, detailKey });
    setDetailOpen(true);
  };

  const closeTaskDetail = () => {
    setDetailOpen(false);
    setDetailTask(null);
  };

  const activeMentee = useMemo(
    () => seedMentees.find((m) => m.id === state.menteeId),
    [state.menteeId],
  );

  return (
    <div
      className="min-h-screen text-[var(--app-text)]"
      style={{
        background: `linear-gradient(to bottom, var(--app-bg-from), var(--app-bg-to))`,
        ...(activeTheme?.vars || {}),
      }}
    >
      <TopNav
        role={role}
        setRole={setRole}
        menteeId={state.menteeId}
        setMenteeId={(id) => setState((p) => ({ ...p, menteeId: id }))}
        themeId={themeId}
        setThemeId={setThemeId}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {role === "mentee" ? (
            <MenteeScreen
              state={state}
              setState={setState}
              onOpenTask={openTaskDetail}
            />
          ) : (
            <MentorScreen
              state={state}
              setState={setState}
              onOpenTask={openTaskDetail}
              setTaskDetailsByKey={setTaskDetailsByKey}
            />
          )}
        </motion.div>

        <footer className="mt-10 rounded-3xl bg-white px-6 py-5 text-sm text-black/60 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-black">
                다음 단계(백엔드 붙이기)
              </div>
              <div className="mt-1">
                사용자(멘토/멘티) 로그인 → DB에 날짜별 과제/공부시간/피드백 저장
                → 알림(스케줄러)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-black/5 px-3 py-2 text-xs">
                샘플 멘티: {activeMentee?.name}
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-2 text-xs">
                UI Prototype
              </div>
            </div>
          </div>
        </footer>
      </main>
      <TaskDetailModal
        open={detailOpen}
        onClose={closeTaskDetail}
        role={role}
        task={detailTask}
        details={detailTask ? taskDetailsByKey[detailTask.detailKey] : null}
        setDetails={(updater) => {
          if (!detailTask?.detailKey) return;
          setTaskDetailsByKey((prev) => {
            const cur = prev[detailTask.detailKey] || {};
            const next = typeof updater === "function" ? updater(cur) : updater;
            return { ...prev, [detailTask.detailKey]: next };
          });
        }}
      />
    </div>
  );
}

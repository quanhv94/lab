"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createPracticeResult,
  getPracticeResultByExam,
  listPracticeResults,
  practiceResultKeys,
  type CreatePracticeResultPayload,
  type PracticeResult,
} from "@/api";
import HsgExerciseView from "@/components/student/HsgExerciseView";
import { Loading } from "@/components/ui";

type SaveState = "idle" | "saving" | "saved" | "error";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function postRestore(iframe: HTMLIFrameElement | null, result: PracticeResult) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    {
      type: "practice-restore",
      payload: {
        score: result.score,
        maxScore: result.maxScore,
        items: result.items,
      },
    },
    window.location.origin,
  );
}

export default function PracticeExamClient({
  examNum,
  examTitle,
  exerciseSrc,
  hasEssayKey,
}: {
  examNum: number;
  examTitle: string;
  exerciseSrc: string;
  hasEssayKey: boolean;
}) {
  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [lastScore, setLastScore] = useState<{
    score: number;
    maxScore: number;
  } | null>(null);

  const progressQuery = useQuery({
    queryKey: practiceResultKeys.list(),
    queryFn: listPracticeResults,
  });

  const existingQuery = useQuery({
    queryKey: practiceResultKeys.byExam(examNum),
    queryFn: () => getPracticeResultByExam(examNum),
    retry: false,
  });

  const completed = new Set(
    (progressQuery.data ?? []).map((item) => item.examNum),
  );
  const unlocked = examNum === 1 || completed.has(examNum - 1);
  const existing =
    existingQuery.isSuccess && existingQuery.data
      ? existingQuery.data
      : null;
  const existingMissing =
    existingQuery.isError &&
    existingQuery.error instanceof ApiError &&
    existingQuery.error.status === 404;

  const restoreIfNeeded = useCallback(() => {
    if (!existing) return;
    postRestore(iframeRef.current, existing);
  }, [existing]);

  useEffect(() => {
    restoreIfNeeded();
  }, [restoreIfNeeded]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        payload?: CreatePracticeResultPayload;
      } | null;
      if (!data) return;

      if (data.type === "practice-ready") {
        restoreIfNeeded();
        return;
      }

      if (data.type !== "practice-result" || !data.payload) return;
      if (data.payload.examNum !== examNum) return;
      if (existing) return;

      setLastScore({
        score: data.payload.score,
        maxScore: data.payload.maxScore,
      });
      setSaveState("saving");
      setSaveError("");

      void createPracticeResult({
        ...data.payload,
        examTitle: data.payload.examTitle || examTitle,
      })
        .then((saved) => {
          setSaveState("saved");
          queryClient.setQueryData(practiceResultKeys.byExam(examNum), saved);
          void queryClient.invalidateQueries({
            queryKey: practiceResultKeys.lists(),
          });
        })
        .catch((err: Error) => {
          setSaveState("error");
          setSaveError(err.message || "Không lưu được kết quả");
        });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [examNum, examTitle, existing, queryClient, restoreIfNeeded]);

  if (progressQuery.isLoading || existingQuery.isLoading) {
    return <Loading />;
  }

  if (!hasEssayKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">Đề đang chờ cập nhật</p>
          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
            Chờ cập nhật
          </span>
        </div>
        <p className="mt-2 text-sm">
          {examTitle} chưa có đáp án tự luận nên tạm khóa. Vui lòng chọn đề khác.
        </p>
        <Link
          href="/practice"
          className="mt-4 inline-flex text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Quay lại danh sách đề
        </Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <p className="font-semibold">Chưa mở khóa đề này</p>
        <p className="mt-2 text-sm">
          Em cần hoàn thành <strong>Đề số {examNum - 1}</strong> trước khi làm{" "}
          {examTitle}.
        </p>
        <Link
          href={`/practice/${examNum - 1}`}
          className="mt-4 inline-flex text-sm font-medium text-[#1d6feb] hover:underline"
        >
          ← Về Đề số {examNum - 1}
        </Link>
      </div>
    );
  }

  if (existingQuery.isError && !existingMissing) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {(existingQuery.error as Error).message || "Không tải được đề"}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {existing ? (
        <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã nộp bài — điểm{" "}
          <strong>
            {formatScore(existing.score)}/{formatScore(existing.maxScore)}
          </strong>
          . Đang xem lại kết quả (không làm lại).
        </div>
      ) : null}

      {saveState !== "idle" && !existing ? (
        <div
          className={`shrink-0 rounded-xl px-4 py-3 text-sm ${
            saveState === "saved"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : saveState === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          {saveState === "saving" && "Đang lưu kết quả..."}
          {saveState === "saved" &&
            lastScore &&
            `Đã lưu kết quả: ${formatScore(lastScore.score)}/${formatScore(lastScore.maxScore)}. Đề tiếp theo đã mở khóa.`}
          {saveState === "error" && `Lưu kết quả thất bại: ${saveError}`}
        </div>
      ) : null}

      <HsgExerciseView
        exerciseSrc={exerciseSrc}
        exerciseTitle={examTitle}
        iframeRef={iframeRef}
        onIframeLoad={restoreIfNeeded}
      />
    </div>
  );
}

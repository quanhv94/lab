"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getUserPracticeResult,
  listUserPracticeResults,
  userKeys,
  type User,
} from "@/api";
import ResultsScoreChart from "@/components/student/ResultsScoreChart";
import { Alert, Button, Loading } from "@/components/ui";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function kindLabel(kind: string) {
  switch (kind) {
    case "mcq":
      return "Trắc nghiệm";
    case "tf":
      return "Đúng/Sai";
    case "short":
      return "Trả lời ngắn";
    case "fill":
      return "Điền khuyết";
    case "essay-radio":
      return "Tự luận (chọn)";
    default:
      return kind;
  }
}

export default function PracticeResultsModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: userKeys.practiceResults(user.id),
    queryFn: () => listUserPracticeResults(user.id),
  });

  const detailQuery = useQuery({
    queryKey: userKeys.practiceResult(user.id, selectedId ?? ""),
    queryFn: () => getUserPracticeResult(user.id, selectedId!),
    enabled: !!selectedId,
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Kết quả đề luyện</h2>
            <p className="text-sm text-slate-500">
              {user.fullName || user.username}
              {selectedId ? " · Chi tiết một lần nộp" : " · Tổng quan theo đề"}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedId && (
              <Button
                variant="secondary"
                className="px-3 py-1"
                onClick={() => setSelectedId(null)}
              >
                ← Danh sách
              </Button>
            )}
            <Button variant="secondary" className="px-3 py-1" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>

        <Alert>
          {(listQuery.error as Error | null)?.message ||
            (detailQuery.error as Error | null)?.message}
        </Alert>

        <div className="min-h-0 flex-1 overflow-auto">
          {listQuery.isPending ? (
            <Loading />
          ) : selectedId ? (
            detailQuery.isPending ? (
              <Loading />
            ) : detailQuery.data ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Đề
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {detailQuery.data.examTitle}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Điểm
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatScore(detailQuery.data.score)}/
                      {formatScore(detailQuery.data.maxScore)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Nộp lúc
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatWhen(detailQuery.data.submittedAt)}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                    Chi tiết từng ý
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {detailQuery.data.items.map((item, idx) => (
                      <li
                        key={`${item.name}-${idx}`}
                        className={`px-4 py-3 text-sm ${
                          item.correct ? "bg-emerald-50/50" : "bg-red-50/50"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500">
                              {kindLabel(item.kind)} · {item.name}
                            </p>
                            <p className="mt-1 text-slate-800">
                              Học sinh:{" "}
                              <span className="font-medium">
                                {item.userAnswer || "(trống)"}
                              </span>
                            </p>
                            {!item.correct && (
                              <p className="mt-0.5 text-emerald-700">
                                Đáp án:{" "}
                                <span className="font-semibold">
                                  {item.correctAnswer}
                                </span>
                              </p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              item.correct
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.correct ? "Đúng" : "Sai"} ·{" "}
                            {formatScore(item.earned)}/
                            {formatScore(item.points)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                Không tìm thấy kết quả
              </p>
            )
          ) : listQuery.data?.length ? (
            <div className="space-y-4">
              <div className="min-h-[20rem]">
                <ResultsScoreChart results={listQuery.data} />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-medium">Đề</th>
                      <th className="px-4 py-2 font-medium">Điểm</th>
                      <th className="px-4 py-2 font-medium">%</th>
                      <th className="px-4 py-2 font-medium">Nộp lúc</th>
                      <th className="px-4 py-2 text-right font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {listQuery.data.map((item) => {
                      const pct =
                        item.maxScore > 0
                          ? (item.score / item.maxScore) * 100
                          : 0;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-2 font-medium text-slate-900">
                            {item.examTitle}
                          </td>
                          <td className="px-4 py-2">
                            {formatScore(item.score)}/
                            {formatScore(item.maxScore)}
                          </td>
                          <td className="px-4 py-2 font-semibold">{pct.toFixed(0)}%</td>
                          <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                            {formatWhen(item.submittedAt)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              className="text-sm font-medium text-[#1d6feb] hover:underline"
                              onClick={() => setSelectedId(item.id)}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Học sinh chưa nộp đề luyện nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

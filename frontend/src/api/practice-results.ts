import { request } from "./client";
import type {
  CreatePracticeResultPayload,
  PracticeResult,
  PracticeResultSummary,
} from "./types";

export function createPracticeResult(payload: CreatePracticeResultPayload) {
  return request<PracticeResult>("/practice-results", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listPracticeResults() {
  return request<PracticeResultSummary[]>("/practice-results");
}

export function getPracticeResult(id: string) {
  return request<PracticeResult>(`/practice-results/${id}`);
}

export function getPracticeResultByExam(examNum: number) {
  return request<PracticeResult>(`/practice-results/exam/${examNum}`);
}

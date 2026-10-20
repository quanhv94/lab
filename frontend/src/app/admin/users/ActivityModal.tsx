"use client";

import { useQuery } from "@tanstack/react-query";
import { listUserActivity, userKeys, type User } from "@/api";
import { Alert, Button, Loading } from "@/components/ui";

export default function ActivityModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: userKeys.activity(user.id),
    queryFn: () => listUserActivity(user.id),
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Lịch sử hoạt động</h2>
            <p className="text-sm text-slate-500">
              {user.fullName || user.username} · 100 màn gần nhất
            </p>
          </div>
          <Button variant="secondary" className="px-3 py-1" onClick={onClose}>
            Đóng
          </Button>
        </div>

        <Alert>{(query.error as Error | null)?.message}</Alert>

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200">
          {query.isPending ? (
            <Loading />
          ) : query.data?.length ? (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Thời gian</th>
                  <th className="px-4 py-2 font-medium">Màn hình</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                      {new Date(item.visitedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">
                        {item.title || item.path}
                      </p>
                      <p className="text-xs text-slate-400">{item.path}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Chưa có lượt truy cập
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

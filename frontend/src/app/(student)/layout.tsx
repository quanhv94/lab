import StudentShell from "@/components/student/StudentShell";

/** Auth shell uses client URL hooks; do not require instant prerender. */
export const instant = false;

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}

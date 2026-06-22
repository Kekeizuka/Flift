"use client";

import { useParams } from "next/navigation";
import { RoutineBuilder } from "@/components/routines/RoutineBuilder";

export default function EditRoutinePage() {
  const { id } = useParams<{ id: string }>();
  return <RoutineBuilder routineId={id} />;
}

import { RecordEditor } from "@/components/editor/RecordEditor";
import { nowLocalInput } from "@/lib/timezone";

export const metadata = { title: "Nuevo registro" };
export const dynamic = "force-dynamic";

export default function NuevoRegistroPage() {
  return <RecordEditor initialDateLocal={nowLocalInput()} />;
}

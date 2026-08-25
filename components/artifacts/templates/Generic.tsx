import { formatLightMarkdown } from "@/lib/artifacts/formatText";

export function Generic({ output }: { output: string }) {
  return (
    <div className="flex flex-col gap-1 text-[14px] leading-relaxed">
      {formatLightMarkdown(output)}
    </div>
  );
}

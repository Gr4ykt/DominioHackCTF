import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { LabsPreview } from "@/components/home/labs-preview";
import { ModulesPreview } from "@/components/home/modules-preview";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Hero />
      <HowItWorks />
      <ModulesPreview />
      <LabsPreview />
    </div>
  );
}

import type { Metadata } from "next";
import { TechStackMixer } from "@/components/mixer/tech-stack-mixer";

export const metadata: Metadata = { title: "기술 스택 믹서" };
export default function MixerPage() {
  return <TechStackMixer />;
}

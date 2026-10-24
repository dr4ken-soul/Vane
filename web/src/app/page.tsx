import { Hero } from "@/components/sections/Hero";
import { OracleGapStatement } from "@/components/sections/OracleGapStatement";
import { DualEngineInspector } from "@/components/sections/DualEngineInspector";
import { VerificationPipeline } from "@/components/sections/VerificationPipeline";
import { LiveTelemetryMetrics } from "@/components/sections/LiveTelemetryMetrics";
import { ComparisonMatrix } from "@/components/sections/ComparisonMatrix";
import { StandardsSchematic } from "@/components/sections/StandardsSchematic";
import { FinalDispatchFooter } from "@/components/sections/FinalDispatchFooter";

/**
 * Landing page composed of the eight operational sections.
 *
 * @returns The full landing page.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <OracleGapStatement />
      <DualEngineInspector />
      <VerificationPipeline />
      <LiveTelemetryMetrics />
      <ComparisonMatrix />
      <StandardsSchematic />
      <FinalDispatchFooter />
    </>
  );
}

import { EvaluationCenterView } from "@/components/environmental-evaluation/EvaluationCenterView";
import {
  buildEnvironmentalEvaluation,
  getDefaultEvaluationFilters,
  getEvaluationOptions,
} from "@/lib/repositories/environmental-evaluation.repository";

export default function EvaluacionAmbientalPage() {
  const filters = getDefaultEvaluationFilters();
  const initialEvaluation = buildEnvironmentalEvaluation(filters);
  const options = getEvaluationOptions();

  return <EvaluationCenterView initialEvaluation={initialEvaluation} options={options} />;
}

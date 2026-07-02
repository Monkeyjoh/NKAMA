import { S } from "@/styles/sharedStyles";
import { scoreColor, scoreLabel } from "@/lib/utils";

/**
 * Barre de score de fiabilité (locataire).
 * @param {{ score: number, withLabel?: boolean }} props
 */
export default function ScoreBar({ score, withLabel = true }) {
  const color = scoreColor(score);
  return (
    <div style={S.scoreRow}>
      {withLabel && <div style={S.scoreLabel}>Score de fiabilité</div>}
      <div style={S.scoreTrack}>
        <div style={{ ...S.scoreFill, width: `${score}%`, background: color }} />
      </div>
      {withLabel && (
        <div style={{ ...S.scoreValue, color }}>
          {score} · {scoreLabel(score)}
        </div>
      )}
    </div>
  );
}

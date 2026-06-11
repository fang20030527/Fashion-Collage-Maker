import { useId, useState } from "react";

import { formatExportFilename } from "../exportFilename";
import styles from "../FashionCollageMaker.module.css";

type ResultStepProps = {
  exportBlobUrl: string;
  onBackToEdit: () => void;
  onFeedbackChange: (feedback: {
    rating: number | null;
    hasNotes: boolean;
  }) => void;
  onStartOver: () => void;
};

export function ResultStep({
  exportBlobUrl,
  onBackToEdit,
  onFeedbackChange,
  onStartOver
}: ResultStepProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const feedbackId = useId();
  const filename = formatExportFilename();

  function handleRatingChange(nextRating: number) {
    setRating(nextRating);
    onFeedbackChange({
      rating: nextRating,
      hasNotes: feedback.trim().length > 0
    });
  }

  function handleFeedbackChange(nextFeedback: string) {
    setFeedback(nextFeedback);
    onFeedbackChange({
      rating,
      hasNotes: nextFeedback.trim().length > 0
    });
  }

  return (
    <section className={styles.resultScreen} aria-labelledby="result-title">
      <div className={styles.resultHeader}>
        <div>
          <p className={styles.kicker}>Export ready</p>
          <h1 id="result-title">Fashion Collage Maker</h1>
        </div>
        <div className={styles.resultActions}>
          <a
            className={styles.continueButton}
            href={exportBlobUrl}
            download={filename}
          >
            Download PNG
          </a>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onBackToEdit}
          >
            Back to edit
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onStartOver}
          >
            Start over
          </button>
        </div>
      </div>

      <div className={styles.resultWorkspace}>
        <div className={styles.resultPreviewShell}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={exportBlobUrl} alt="Exported fashion collage preview" />
        </div>

        <aside className={styles.feedbackPanel} aria-labelledby="feedback-title">
          <h2 id="feedback-title">How did it look?</h2>
          <div className={styles.ratingGroup} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className={`${styles.ratingButton} ${
                  rating === value ? styles.ratingButtonSelected : ""
                }`}
                type="button"
                role="radio"
                aria-checked={rating === value}
                onClick={() => handleRatingChange(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label className={styles.feedbackLabel} htmlFor={feedbackId}>
            Notes
          </label>
          <textarea
            id={feedbackId}
            className={styles.feedbackTextarea}
            value={feedback}
            rows={5}
            placeholder="Optional"
            onChange={(event) => handleFeedbackChange(event.currentTarget.value)}
          />
          <p className={styles.mutedText}>Feedback stays on this device.</p>
        </aside>
      </div>
    </section>
  );
}

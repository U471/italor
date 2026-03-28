/**
 * StepProgress — horizontal step indicator for the suit configurator.
 *
 * Props:
 *   steps        — array of { id, label }
 *   currentStep  — 0-based index of the active step
 *   completedSteps — Set or array of completed step indexes
 *   onStepClick  — optional callback(index) — only fires for completed steps
 */
function StepProgress({ steps, currentStep, completedSteps = [], onStepClick }) {
  const completedSet = new Set(completedSteps);

  return (
    <nav aria-label="Configurator progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSet.has(index);
          const isActive = index === currentStep;
          const isClickable = isCompleted && typeof onStepClick === 'function';

          let circleClass = 'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors';
          if (isCompleted) {
            circleClass += ' bg-brand-600 text-white';
          } else if (isActive) {
            circleClass += ' bg-brand-600 text-white ring-4 ring-brand-100';
          } else {
            circleClass += ' bg-gray-100 text-gray-400';
          }

          const labelClass = `mt-1 text-xs font-medium transition-colors ${
            isActive ? 'text-brand-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'
          }`;

          return (
            <li key={step.id} className="flex flex-col items-center relative flex-1">
              {/* Connector line (all except first) */}
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    isCompleted || isActive ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                />
              )}

              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? ' (completed)' : ''}`}
                disabled={!isClickable}
                onClick={isClickable ? () => onStepClick(index) : undefined}
                className={`relative z-10 flex flex-col items-center focus:outline-none ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className={circleClass}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <span className={labelClass}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepProgress;

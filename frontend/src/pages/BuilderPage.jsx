import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useSuitStore, { BUILDER_STEPS } from '../store/suitStore';
import StepProgress from '../components/StepProgress/StepProgress';
import { getFabricById } from '../services/api';

/**
 * BuilderPage — /builder
 *
 * Multi-step suit configurator shell.
 * Reads ?fabric=:id to pre-load the selected fabric into the store.
 * Step content components are added ticket by ticket (SCRUM-24 through SCRUM-28).
 */
function BuilderPage() {
  const [searchParams] = useSearchParams();
  const fabricId = searchParams.get('fabric');

  const {
    currentStep,
    config,
    goNext,
    goPrev,
    setFabric,
    isStepComplete,
    reset,
  } = useSuitStore();

  // Pre-load fabric from URL param
  useEffect(() => {
    if (!fabricId || config.fabric?._id === fabricId) { return; }

    let cancelled = false;
    async function load() {
      try {
        const data = await getFabricById(fabricId);
        if (!cancelled && data?.fabric) {
          setFabric(data.fabric);
        }
      } catch (_err) {
        // If fabric fetch fails, user can select manually
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fabricId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset store when leaving the page
  useEffect(() => () => reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const completedSteps = BUILDER_STEPS
    .map((_, i) => i)
    .filter((i) => isStepComplete(i));

  const isFirst = currentStep === 0;
  const isLast = currentStep === BUILDER_STEPS.length - 1;
  const stepId = BUILDER_STEPS[currentStep].id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-serif font-bold text-gray-900">
            iTailor
          </Link>
          <span className="text-sm text-gray-500">Suit Configurator</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Step progress bar */}
        <div className="mb-10">
          <StepProgress
            steps={BUILDER_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(i) => useSuitStore.getState().goToStep(i)}
          />
        </div>

        {/* Step content */}
        <section
          aria-label={`Step ${currentStep + 1}: ${BUILDER_STEPS[currentStep].label}`}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[320px]"
        >
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
            {BUILDER_STEPS[currentStep].label}
          </h2>

          {stepId === 'fabric' && <FabricStep fabric={config.fabric} fabricId={fabricId} />}
          {stepId === 'style' && <PlaceholderStep label="Style" next="SCRUM-24" />}
          {stepId === 'lapel' && <PlaceholderStep label="Lapel" next="SCRUM-25" />}
          {stepId === 'lining' && <PlaceholderStep label="Lining" next="SCRUM-26" />}
          {stepId === 'details' && <PlaceholderStep label="Details" next="SCRUM-27" />}
          {stepId === 'monogram' && <PlaceholderStep label="Monogram" next="SCRUM-28" />}
          {stepId === 'review' && <ReviewStep config={config} />}
        </section>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              type="button"
              className="px-8 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Add to Cart
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Step sub-components ──────────────────────────────────────────────────────

function FabricStep({ fabric, fabricId }) {
  if (fabric) {
    return (
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {fabric.thumbnailUrl ? (
            <img src={fabric.thumbnailUrl} alt={fabric.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🧵</div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{fabric.name}</h3>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {fabric.material} · {fabric.color}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            £{fabric.price?.toLocaleString()}
            <span className="text-xs font-normal text-gray-500 ml-1">/ meter</span>
          </p>
          <Link
            to="/fabrics"
            className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-800 underline"
          >
            Change fabric
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">
        {fabricId ? 'Loading fabric…' : 'No fabric selected yet.'}
      </p>
      <Link
        to="/fabrics"
        className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        Browse Fabrics
      </Link>
    </div>
  );
}

function PlaceholderStep({ label, next }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-2xl">✂️</span>
      </div>
      <p className="text-gray-500 text-sm">
        <strong>{label}</strong> configuration coming in {next}.
      </p>
    </div>
  );
}

function ReviewStep({ config }) {
  const sections = [
    { label: 'Fabric', value: config.fabric?.name },
    { label: 'Style', value: config.style ? `${config.style.breasting}-breasted` : null },
    { label: 'Lapel', value: config.lapel?.style },
    { label: 'Lining', value: config.lining ? `${config.lining.color} ${config.lining.pattern}` : null },
    { label: 'Details', value: config.details?.pocketStyle ? `${config.details.pocketStyle} pockets` : null },
    { label: 'Monogram', value: config.monogram?.text || null },
  ];

  return (
    <div className="space-y-3">
      {sections.map(({ label, value }) => (
        <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-sm font-medium text-gray-900 capitalize">
            {value || <span className="text-gray-300">—</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export default BuilderPage;

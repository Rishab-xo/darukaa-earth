import { useState, useEffect, useCallback, useRef } from "react";
import {
  Rocket,
  FolderPlus,
  Globe2,
  PenTool,
  Save,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  Sparkles,
  PartyPopper,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/* ─── Step Definitions ─── */
const WALKTHROUGH_STEPS = [
  {
    id: "welcome",
    target: null,
    icon: Rocket,
    title: "Welcome to Darukaa.Earth",
    description:
      "Your environmental analytics command center. This interactive walkthrough will guide you through each step — and let you try it hands-on!",
    hint: "Takes about 2 minutes",
    position: "center",
    actionType: "click-next", // User just clicks Next
  },
  {
    id: "create-project",
    target: "#walkthrough-projects",
    icon: FolderPlus,
    title: "Step 1 — Create a Project",
    description:
      'Type a project name in the input field and hit the "+" button to create your first project. Go ahead — try it now!',
    hint: "Type a name and press +",
    position: "right",
    actionType: "user-action", // Wait for user to actually do it
    waitingLabel: "Waiting for you to create a project…",
    successLabel: "Project created!",
  },
  {
    id: "explore-map",
    target: "#walkthrough-map",
    icon: Globe2,
    title: "Step 2 — Explore the Satellite Map",
    description:
      "Navigate the satellite map — scroll to zoom, drag to pan. Find the land area you want to monitor.",
    hint: "Zoom into forests, wetlands, or any area of interest",
    position: "left",
    actionType: "click-next",
  },
  {
    id: "draw-polygon",
    target: "#walkthrough-map",
    icon: PenTool,
    title: "Step 3 — Draw a Site Boundary",
    description:
      "Click the polygon tool (⬠) in the top-right map controls, then click points on the map to outline your conservation area. Double-click to complete the shape.",
    hint: "Click ⬠ on map top-right, then draw on the map",
    position: "left",
    actionType: "user-action",
    waitingLabel: "Waiting for you to draw a polygon…",
    successLabel: "Polygon drawn!",
  },
  {
    id: "save-boundary",
    target: "#walkthrough-save-btn",
    icon: Save,
    title: "Step 4 — Save Your Boundary",
    description:
      'Now click the "Save Polygon" button to store your site boundary. This will generate 12 months of environmental analytics data automatically.',
    hint: "Click the green button above",
    position: "bottom",
    actionType: "user-action",
    waitingLabel: "Waiting for you to save the polygon…",
    successLabel: "Site saved successfully!",
  },
  {
    id: "view-analytics",
    target: "#walkthrough-analytics",
    icon: BarChart3,
    title: "Step 5 — Your Analytics Are Ready!",
    description:
      "Scroll down to explore carbon sequestration metrics, biodiversity indices, and interactive charts. You've completed the full workflow!",
    hint: "Data is generated via PostGIS spatial analysis",
    position: "top",
    actionType: "click-next",
  },
  {
    id: "complete",
    target: null,
    icon: PartyPopper,
    title: "You're All Set! 🎉",
    description:
      "You've mastered the Darukaa.Earth workflow. Create more projects, draw additional sites, and track your environmental impact over time.",
    hint: "Click the ? button anytime to replay this guide",
    position: "center",
    actionType: "click-next",
  },
];

const STORAGE_KEY = "darukaa_walkthrough_completed";

/* ─── Walkthrough Component ─── */
export default function InteractiveWalkthrough({
  forceOpen = false,
  onClose,
  onStepChange,
  advanceRef,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [animating, setAnimating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false); // Brief green flash on action complete
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);

  const step = WALKTHROUGH_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === WALKTHROUGH_STEPS.length - 1;
  const isActionStep = step?.actionType === "user-action";
  const StepIcon = step?.icon;

  const handleClose = useCallback(() => {
    // Clean up any active target highlights
    document.querySelectorAll(".walkthrough-target-active").forEach((el) => {
      el.classList.remove("walkthrough-target-active");
    });
    setIsOpen(false);
    setActionSuccess(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onClose?.();
    onStepChange?.(null);
  }, [onClose, onStepChange]);

  const goToNextStep = useCallback(() => {
    if (animating) return;
    if (isLast) {
      handleClose();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setAnimating(false);
    }, 200);
  }, [isLast, animating, handleClose]);

  const goToPrevStep = useCallback(() => {
    if (animating || isFirst) return;
    setAnimating(true);
    setActionSuccess(false);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setAnimating(false);
    }, 200);
  }, [isFirst, animating]);

  // Position the tooltip and spotlight on each step change
  const positionTooltip = useCallback(() => {
    if (!isOpen) return;

    const currentStepData = WALKTHROUGH_STEPS[currentStep];
    if (!currentStepData) return;

    // Centered steps (welcome / complete)
    if (!currentStepData.target) {
      setSpotlightStyle({ display: "none" });
      setTooltipStyle({
        position: "fixed",
        top: "42%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const el = document.querySelector(currentStepData.target);
    if (!el) {
      setSpotlightStyle({ display: "none" });
      setTooltipStyle({
        position: "fixed",
        top: "42%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 12;

    // Spotlight
    setSpotlightStyle({
      display: "block",
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: "12px",
    });

    // Tooltip positioning
    const pos = currentStepData.position;
    const tooltipW = Math.min(400, window.innerWidth - 32);
    const tooltipH = 300;
    let top, left;

    if (pos === "right") {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + padding + 16;
      if (left + tooltipW > window.innerWidth - 16) {
        left = Math.max(16, rect.left + rect.width / 2 - tooltipW / 2);
        top = rect.bottom + padding + 16;
      }
    } else if (pos === "left") {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - padding - tooltipW - 16;
      if (left < 16) {
        left = Math.max(16, rect.left + rect.width / 2 - tooltipW / 2);
        top = rect.bottom + padding + 16;
      }
    } else if (pos === "bottom") {
      top = rect.bottom + padding + 16;
      left = rect.left + rect.width / 2 - tooltipW / 2;
    } else if (pos === "top") {
      top = rect.top - padding - tooltipH - 16;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      if (top < 16) {
        top = rect.bottom + padding + 16;
      }
    }

    // Clamp to viewport
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 80));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));

    setTooltipStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
    });
  }, [isOpen, currentStep]);

  // Expose the advance function to the parent via ref
  useEffect(() => {
    if (advanceRef) {
      advanceRef.current = () => {
        if (!isOpen) return;
        // Show success flash, then advance
        setActionSuccess(true);
        setTimeout(() => {
          setActionSuccess(false);
          goToNextStep();
        }, 1000);
      };
    }
    return () => {
      if (advanceRef) advanceRef.current = null;
    };
  }, [isOpen, advanceRef, goToNextStep]);

  // Notify parent of step changes
  useEffect(() => {
    if (isOpen && step) {
      onStepChange?.(step.id);
    } else {
      onStepChange?.(null);
    }
  }, [isOpen, step, onStepChange]);

  // Auto-open on first visit
  useEffect(() => {
    if (forceOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
        setActionSuccess(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(positionTooltip);
    const handleResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(positionTooltip);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [positionTooltip]);

  // Scroll target into view
  useEffect(() => {
    if (!isOpen) return;
    const currentStepData = WALKTHROUGH_STEPS[currentStep];
    if (currentStepData?.target) {
      const el = document.querySelector(currentStepData.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const timer = setTimeout(positionTooltip, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, currentStep, positionTooltip]);

  // Raise target element z-index for action steps (so user can interact with it)
  useEffect(() => {
    if (!isOpen) return;
    const currentStepData = WALKTHROUGH_STEPS[currentStep];
    if (
      currentStepData?.target &&
      currentStepData.actionType === "user-action"
    ) {
      const el = document.querySelector(currentStepData.target);
      if (el) {
        el.classList.add("walkthrough-target-active");
        return () => el.classList.remove("walkthrough-target-active");
      }
    }
  }, [isOpen, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (
        (e.key === "ArrowRight" || e.key === "Enter") &&
        !isActionStep
      ) {
        e.preventDefault();
        goToNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isActionStep, handleClose, goToNextStep, goToPrevStep]);

  if (!isOpen) return null;

  return (
    <div className="walkthrough-overlay" aria-modal="true" role="dialog">
      {/* Spotlight cutout — creates dark background everywhere EXCEPT the highlighted element */}
      {step.target && spotlightStyle.display !== "none" ? (
        <div
          className={`walkthrough-spotlight ${actionSuccess ? "walkthrough-spotlight-success" : ""}`}
          style={spotlightStyle}
        />
      ) : (
        /* Full backdrop ONLY for centered welcome / complete steps */
        <div className="walkthrough-backdrop" onClick={handleClose} />
      )}

      {/* Tooltip Card */}
      <div
        ref={tooltipRef}
        className={`walkthrough-tooltip ${animating ? "walkthrough-tooltip-exit" : "walkthrough-tooltip-enter"} ${step.target ? "" : "walkthrough-tooltip-center"}`}
        style={tooltipStyle}
      >
        {/* Close button */}
        <button
          className="walkthrough-close"
          onClick={handleClose}
          aria-label="Close walkthrough"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div
          className={`walkthrough-icon-wrap ${isFirst ? "walkthrough-icon-welcome" : ""} ${actionSuccess ? "walkthrough-icon-success" : ""}`}
        >
          {actionSuccess ? (
            <CheckCircle2 size={22} />
          ) : (
            <StepIcon size={isFirst ? 28 : 22} />
          )}
        </div>

        {/* Content */}
        <div className="walkthrough-content">
          <h3 className="walkthrough-title">{step.title}</h3>
          <p className="walkthrough-desc">{step.description}</p>

          {/* Action status indicator */}
          {isActionStep && !actionSuccess && (
            <div className="walkthrough-action-status">
              <Loader2 size={13} className="walkthrough-spinner" />
              <span>{step.waitingLabel}</span>
            </div>
          )}

          {/* Success indicator */}
          {actionSuccess && (
            <div className="walkthrough-action-success">
              <CheckCircle2 size={13} />
              <span>{step.successLabel}</span>
            </div>
          )}

          {/* Hint (show only when not in success state) */}
          {step.hint && !actionSuccess && (
            <div className="walkthrough-hint">
              <Sparkles size={12} />
              <span>{step.hint}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="walkthrough-footer">
          {/* Step dots */}
          <div className="walkthrough-dots">
            {WALKTHROUGH_STEPS.map((_, i) => (
              <span
                key={i}
                className={`walkthrough-dot ${i === currentStep ? "active" : ""} ${i < currentStep ? "completed" : ""}`}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="walkthrough-counter">
            {currentStep + 1} of {WALKTHROUGH_STEPS.length}
          </span>

          {/* Nav buttons */}
          <div className="walkthrough-nav">
            {isFirst ? (
              <button className="walkthrough-btn-skip" onClick={handleClose}>
                Skip Tour
              </button>
            ) : (
              <button className="walkthrough-btn-back" onClick={goToPrevStep}>
                <ChevronLeft size={14} />
                Back
              </button>
            )}

            {/* Only show Next button for click-next steps */}
            {!isActionStep && (
              <button className="walkthrough-btn-next" onClick={goToNextStep}>
                {isLast ? (
                  <>
                    <PartyPopper size={14} />
                    Get Started
                  </>
                ) : isFirst ? (
                  <>
                    Let's Go
                    <ChevronRight size={14} />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            )}

            {/* For action steps, show a pulsing "your turn" label instead of Next */}
            {isActionStep && !actionSuccess && (
              <span className="walkthrough-your-turn">Your turn →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Help Button (to re-trigger walkthrough) ─── */
export function WalkthroughHelpButton({ onClick }) {
  return (
    <button
      className="walkthrough-help-btn"
      onClick={onClick}
      title="Launch guided walkthrough"
      aria-label="Help - Launch walkthrough"
    >
      <HelpCircle size={18} />
    </button>
  );
}

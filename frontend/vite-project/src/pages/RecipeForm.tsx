import { useState, useMemo, useContext } from "react";
import { createRecipe, updateRecipe } from "../api";
import { PageContext } from "../PageContext";
import { useMachine } from "../context/useMachine";

export interface RecipeFormData {
  name: string;
  curingTemp: number;
  tempBandPlus: number;
  tempBandMinus: number;
  pressure: number;
  pressureBandPlus: number;
  pressureBandMinus: number;
  curingTime: number;
  exhaustDelay: number;
  purgingCycles: number;
  high1: number;
  low1: number;
  high2: number;
  low2: number;
  high3: number;
  low3: number;
  high4: number;
  low4: number;
  high5: number;
  low5: number;
  scheduledAt: string;
}

export interface RecipeFormProps {
  initial?: Partial<RecipeFormData> & { id?: number; status?: string };
  onSubmit: (data: RecipeFormData) => void;
}

export default function RecipeForm({ initial, onSubmit }: RecipeFormProps) {
  const { selectedMachine } = useMachine();
  const defaultFormData: RecipeFormData = {
    name: "",
    curingTemp: 0,
    tempBandPlus: 0,
    tempBandMinus: 0,
    pressure: 0,
    pressureBandPlus: 0,
    pressureBandMinus: 0,
    curingTime: 0,
    exhaustDelay: 0,
    purgingCycles: 0,
    high1: 0,
    low1: 0,
    high2: 0,
    low2: 0,
    high3: 0,
    low3: 0,
    high4: 0,
    low4: 0,
    high5: 0,
    low5: 0,
    scheduledAt: "",
  };

  const [form, setForm] = useState<RecipeFormData>({
    ...defaultFormData,
    ...initial,
  });

  // Store the original initial data for change detection
  const originalData = useMemo(
    () => ({
      ...defaultFormData,
      ...initial,
    }),
    [initial],
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof RecipeFormData, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if any parameter (excluding name and scheduledAt) has changed
  const hasParameterChanges = useMemo(() => {
    if (!initial) return true; // New recipe always allows scheduling

    const parameterKeys: (keyof RecipeFormData)[] = [
      "curingTemp",
      "tempBandPlus",
      "tempBandMinus",
      "pressure",
      "pressureBandPlus",
      "pressureBandMinus",
      "curingTime",
      "exhaustDelay",
      "purgingCycles",
      "high1",
      "low1",
      "high2",
      "low2",
      "high3",
      "low3",
      "high4",
      "low4",
      "high5",
      "low5",
    ];

    return parameterKeys.some((key) => form[key] !== originalData[key]);
  }, [form, originalData, initial]);

  // Check if editing an activated recipe
  const isEditingActivated = initial?.status === "activated";

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Recipe name is required";
    if (form.curingTemp <= 0)
      newErrors.curingTemp = "Curing temperature must be > 0";
    if (form.pressure < 0) newErrors.pressure = "Pressure cannot be negative";
    if (form.curingTime <= 0) newErrors.curingTime = "Curing time must be > 0";
    if (form.purgingCycles < 0)
      newErrors.purgingCycles = "Purging cycles cannot be negative";

    // Check if scheduledAt is in the future
    if (form.scheduledAt) {
      const scheduledTime = new Date(form.scheduledAt);
      if (scheduledTime <= new Date()) {
        newErrors.scheduledAt = "Scheduled time must be in the future";
      }

      // If editing activated recipe and trying to schedule, must have parameter changes
      if (isEditingActivated && !hasParameterChanges) {
        newErrors.scheduledAt =
          "You must modify at least one parameter to schedule a new version";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = (key: keyof RecipeFormData, value: string | number) => {
    setForm({ ...form, [key]: value } as RecipeFormData);
    if (errors[key]) {
      setErrors({ ...errors, [key]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      // Normalize payload: convert empty scheduledAt to null and ensure ISO-8601 format
      let scheduledAtValue: string | null = null;
      if (form.scheduledAt) {
        // If it's a datetime-local string (YYYY-MM-DDTHH:mm), convert to ISO-8601
        const dateStr = form.scheduledAt;
        const date = new Date(dateStr);
        scheduledAtValue = date.toISOString();
      }

      const payload = {
        ...form,
        scheduledAt: scheduledAtValue,
      };

      if (initial && initial.id) {
        const id = Number(initial.id);
        await updateRecipe(
          id,
          payload as Partial<RecipeFormData>,
          selectedMachine,
        );
      } else {
        await createRecipe(payload as RecipeFormData, selectedMachine);
      }

      setSubmitted(true);
      onSubmit(form);
      setTimeout(() => setSubmitted(false), 2000);
    } catch (err: unknown) {
      setSubmitError(
        (err instanceof Error ? err.message : String(err)) ??
          "Failed to save recipe. Please try again later.",
      );
    } finally {
      setSaving(false);
    }
  };
  const ctx = useContext(PageContext);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {initial ? "Edit Recipe" : "Create New Recipe"}
        </h1>
        <p className="text-gray-600 mt-2">
          Define vulcanizer machine parameters and schedule activation
        </p>
        {isEditingActivated && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ You are editing an <strong>activated recipe</strong>. The
              recipe name cannot be changed. Modify at least one parameter and
              set a schedule to create a new version.
            </p>
          </div>
        )}
      </div>

      {/* Status message */}
      {submitted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Recipe saved successfully!
        </div>
      )}

      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}

      {/* ========== SECTION 1: BASIC SETTINGS ========== */}
      <section className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            1
          </span>
          Basic Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recipe Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recipe Name <span className="text-red-500">*</span>
              {isEditingActivated && (
                <span className="text-amber-600 text-xs ml-2">
                  (Cannot be changed)
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g., Summer_Batch_A"
              disabled={isEditingActivated}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isEditingActivated
                  ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                  : errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
              }`}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Curing Temperature */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Curing Temperature (°C) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="150"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.curingTemp
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              value={form.curingTemp}
              onChange={(e) =>
                update("curingTemp", parseFloat(e.target.value) || 0)
              }
            />
            {errors.curingTemp && (
              <p className="text-red-500 text-sm mt-1">{errors.curingTemp}</p>
            )}
          </div>

          {/* Temperature Band */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Temperature Band ±(°C)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="+2"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tempBandPlus}
                onChange={(e) =>
                  update("tempBandPlus", parseFloat(e.target.value) || 0)
                }
              />
              <input
                type="number"
                step="0.1"
                placeholder="-2"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tempBandMinus}
                onChange={(e) =>
                  update("tempBandMinus", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Pressure */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Curing Pressure (PSI) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="100"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.pressure
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              value={form.pressure}
              onChange={(e) =>
                update("pressure", parseFloat(e.target.value) || 0)
              }
            />
            {errors.pressure && (
              <p className="text-red-500 text-sm mt-1">{errors.pressure}</p>
            )}
          </div>

          {/* Pressure Band */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pressure Band ±(PSI)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="+5"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.pressureBandPlus}
                onChange={(e) =>
                  update("pressureBandPlus", parseFloat(e.target.value) || 0)
                }
              />
              <input
                type="number"
                step="0.1"
                placeholder="-5"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.pressureBandMinus}
                onChange={(e) =>
                  update("pressureBandMinus", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: TIMING PARAMETERS ========== */}
      <section className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            2
          </span>
          Timing Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Curing Time (Minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="30"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.curingTime
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
              value={form.curingTime}
              onChange={(e) =>
                update("curingTime", parseInt(e.target.value) || 0)
              }
            />
            {errors.curingTime && (
              <p className="text-red-500 text-sm mt-1">{errors.curingTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exhaust Delay (Minutes)
            </label>
            <input
              type="number"
              min="0"
              placeholder="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.exhaustDelay}
              onChange={(e) =>
                update("exhaustDelay", parseInt(e.target.value) || 0)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Purging Cycles <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              placeholder="3"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.purgingCycles
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
              value={form.purgingCycles}
              onChange={(e) =>
                update("purgingCycles", parseInt(e.target.value) || 0)
              }
            />
            {errors.purgingCycles && (
              <p className="text-red-500 text-sm mt-1">
                {errors.purgingCycles}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: 5-STEP PURGING PRESSURES ========== */}
      <section className="bg-white shadow-md rounded-lg p-6 border-l-4 border-orange-500">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            3
          </span>
          5-Step Purging Pressures
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">
                Step {n}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    High (PSI)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-semibold"
                    value={form[`high${n}` as keyof RecipeFormData]}
                    onChange={(e) =>
                      update(
                        `high${n}` as keyof RecipeFormData,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Low (PSI)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center font-semibold"
                    value={form[`low${n}` as keyof RecipeFormData]}
                    onChange={(e) =>
                      update(
                        `low${n}` as keyof RecipeFormData,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== SECTION 4: SCHEDULING ========== */}
      <section className="bg-white shadow-md rounded-lg p-6 border-l-4 border-purple-500">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            4
          </span>
          Schedule Activation
        </h2>

        <div className="max-w-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Activation Date & Time
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Leave empty to save as draft. Fill to schedule automatic activation.
          </p>

          {isEditingActivated && !hasParameterChanges && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ You must modify at least one parameter to schedule a new
                version of this activated recipe.
              </p>
            </div>
          )}

          <input
            type="datetime-local"
            disabled={isEditingActivated && !hasParameterChanges}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              isEditingActivated && !hasParameterChanges
                ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                : errors.scheduledAt
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-purple-500"
            }`}
            value={form.scheduledAt}
            onChange={(e) => update("scheduledAt", e.target.value)}
          />
          {errors.scheduledAt && (
            <p className="text-red-500 text-sm mt-1">{errors.scheduledAt}</p>
          )}

          {form.scheduledAt && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">
                ✓ This recipe will activate at:{" "}
                <strong>{new Date(form.scheduledAt).toLocaleString()}</strong>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========== SUBMIT BUTTON ========== */}
      <div className="flex gap-4 justify-center pt-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update Recipe" : "Create Recipe"}
        </button>
        <button
          type="button"
          onClick={() => ctx?.setPage?.("recipes")}
          className="bg-gray-400 hover:bg-gray-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

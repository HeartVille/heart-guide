"use client";

import { useState } from "react";

type Question = { label: string; question: string; placeholder: string };
type GuideFormValues = {
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: Question[];
};

const EMPTY_QUESTION: Question = { label: "", question: "", placeholder: "" };
const EMPTY_VALUES: GuideFormValues = {
  title: "",
  category: "Relationships",
  description: "",
  colour: "jade",
  symbol: "✦",
  questions: [EMPTY_QUESTION, EMPTY_QUESTION, EMPTY_QUESTION, EMPTY_QUESTION],
};

export default function GuideForm({
  action,
  submitLabel,
  initial,
}: {
  action: (formData: FormData) => void;
  submitLabel: string;
  initial?: GuideFormValues;
}) {
  const [values, setValues] = useState<GuideFormValues>(
    initial && initial.questions?.length === 4 ? initial : EMPTY_VALUES,
  );
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  async function generateWithAI() {
    if (!topic.trim()) {
      setAiError("Describe what this guide should help with first.");
      return;
    }
    setGenerating(true);
    setAiError("");
    try {
      const response = await fetch("/api/creator/generate-guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to generate a guide right now.");
      setValues(data.guide);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to generate a guide right now.");
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(index: number, field: keyof Question, value: string) {
    setValues((current) => ({
      ...current,
      questions: current.questions.map((question, i) => (i === index ? { ...question, [field]: value } : question)),
    }));
  }

  return (
    <form className="auth-form guide-form" action={action}>
      <div className="ai-assist">
        <label>
          What should this guide help someone with?
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="For example: help new coaches get clear on their first offer"
            rows={2}
          />
        </label>
        <button type="button" className="button secondary" onClick={() => void generateWithAI()} disabled={generating}>
          {generating ? "Writing your guide…" : "✦ Generate with AI"}
        </button>
        {aiError && <p className="auth-error">{aiError}</p>}
        <p className="guide-form-hint">This drafts a title, description and four reflective questions below, which you can edit before saving.</p>
      </div>

      <label>
        Guide title
        <input
          name="title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Connection Clarity"
          required
        />
      </label>
      <label>
        Category
        <select
          name="category"
          value={values.category}
          onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
          required
        >
          <option value="Relationships">Relationships</option>
          <option value="Business">Business</option>
          <option value="Wellbeing">Wellbeing</option>
        </select>
      </label>
      <label>
        Description
        <textarea
          name="description"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="One or two sentences describing what this guide helps someone with."
          rows={3}
          required
        />
      </label>
      <div className="field-grid">
        <label>
          Colour
          <select
            name="colour"
            value={values.colour}
            onChange={(event) => setValues((current) => ({ ...current, colour: event.target.value }))}
          >
            <option value="jade">Jade</option>
            <option value="violet">Violet</option>
            <option value="aqua">Aqua</option>
            <option value="gold">Gold</option>
            <option value="rose">Rose</option>
            <option value="sage">Sage</option>
          </select>
        </label>
        <label>
          Symbol
          <input
            name="symbol"
            value={values.symbol}
            onChange={(event) => setValues((current) => ({ ...current, symbol: event.target.value }))}
            maxLength={2}
          />
        </label>
      </div>

      <h2 className="guide-form-heading">The four reflective steps</h2>
      <p className="guide-form-hint">Each Heart Guide walks someone through four short reflective questions, one step at a time.</p>
      {values.questions.map((step, index) => (
        <fieldset className="guide-step-fieldset" key={index}>
          <legend>Step {index + 1}</legend>
          <label>
            Step label
            <input
              name={`q${index}Label`}
              value={step.label}
              onChange={(event) => updateQuestion(index, "label", event.target.value)}
              placeholder="Arrive"
              required
            />
          </label>
          <label>
            Question
            <textarea
              name={`q${index}Question`}
              value={step.question}
              onChange={(event) => updateQuestion(index, "question", event.target.value)}
              placeholder="What would you like clarity about today?"
              rows={2}
              required
            />
          </label>
          <label>
            Placeholder text
            <input
              name={`q${index}Placeholder`}
              value={step.placeholder}
              onChange={(event) => updateQuestion(index, "placeholder", event.target.value)}
              placeholder="For example…"
            />
          </label>
        </fieldset>
      ))}

      <button className="button primary full-button" type="submit">{submitLabel} <span>→</span></button>
    </form>
  );
}

type GuideFormValues = {
  title: string;
  category: string;
  description: string;
  colour: string;
  symbol: string;
  questions: { label: string; question: string; placeholder: string }[];
};

const EMPTY_QUESTION = { label: "", question: "", placeholder: "" };

export default function GuideForm({
  action,
  submitLabel,
  initial,
}: {
  action: (formData: FormData) => void;
  submitLabel: string;
  initial?: GuideFormValues;
}) {
  const questions = initial?.questions?.length === 4 ? initial.questions : [EMPTY_QUESTION, EMPTY_QUESTION, EMPTY_QUESTION, EMPTY_QUESTION];

  return (
    <form className="auth-form guide-form" action={action}>
      <label>
        Guide title
        <input name="title" defaultValue={initial?.title ?? ""} placeholder="Connection Clarity" required autoFocus />
      </label>
      <label>
        Category
        <select name="category" defaultValue={initial?.category ?? "Relationships"} required>
          <option value="Relationships">Relationships</option>
          <option value="Business">Business</option>
          <option value="Wellbeing">Wellbeing</option>
        </select>
      </label>
      <label>
        Description
        <textarea name="description" defaultValue={initial?.description ?? ""} placeholder="One or two sentences describing what this guide helps someone with." rows={3} required />
      </label>
      <div className="field-grid">
        <label>
          Colour
          <select name="colour" defaultValue={initial?.colour ?? "jade"}>
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
          <input name="symbol" defaultValue={initial?.symbol ?? "✦"} maxLength={2} />
        </label>
      </div>

      <h2 className="guide-form-heading">The four reflective steps</h2>
      <p className="guide-form-hint">Each Heart Guide walks someone through four short reflective questions, one step at a time.</p>
      {questions.map((step, index) => (
        <fieldset className="guide-step-fieldset" key={index}>
          <legend>Step {index + 1}</legend>
          <label>
            Step label
            <input name={`q${index}Label`} defaultValue={step.label} placeholder="Arrive" required />
          </label>
          <label>
            Question
            <textarea name={`q${index}Question`} defaultValue={step.question} placeholder="What would you like clarity about today?" rows={2} required />
          </label>
          <label>
            Placeholder text
            <input name={`q${index}Placeholder`} defaultValue={step.placeholder} placeholder="For example…" />
          </label>
        </fieldset>
      ))}

      <button className="button primary full-button" type="submit">{submitLabel} <span>→</span></button>
    </form>
  );
}

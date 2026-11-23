const byId = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const rupees = (value) => currency.format(value);
const duration = (n) => n + (n === 1 ? ' month' : ' months');

const modes = {
  reserve: {
    name: 'Emergency fund', label: 'Target reserve',
    fields: [['Essential monthly expenses', 25000, 0, 10000000], ['Months of expenses', 6, 1, 60], ['Already set aside', 40000, 0, 1000000000]],
    rules: 'The target covers the expenses and number of months you enter.',
    calculate([expenses, months, saved]) {
      const target = expenses * months;
      return [rupees(target), [['Still to set aside', rupees(Math.max(0, target - saved))], ['Already set aside', rupees(saved)]]];
    },
  },
  goal: {
    name: 'Savings goal', label: 'Time to reach goal',
    fields: [['Target amount', 150000, 0, 1000000000], ['Already saved', 30000, 0, 1000000000], ['Monthly contribution', 10000, 1, 10000000]],
    rules: 'Assumes a fixed monthly contribution and zero interest. Partial months round up.',
    calculate([target, saved, monthly]) {
      const remaining = Math.max(0, target - saved);
      const months = Math.ceil(remaining / monthly);
      return [duration(months), [['Remaining amount', rupees(remaining)], ['Monthly contribution', rupees(monthly)]]];
    },
  },
  loan: {
    name: 'Loan EMI', label: 'Estimated monthly EMI',
    fields: [['Loan principal', 500000, 0, 1000000000], ['Annual interest rate (%)', 9, 0, 100, '0.01'], ['Repayment term (months)', 60, 1, 600]],
    rules: 'Fixed-rate monthly repayment estimate. Excludes processing fees and other charges.',
    calculate([principal, annual, months]) {
      const monthlyRate = annual / 1200;
      const emi = monthlyRate ? principal * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate)) : principal / months;
      const total = emi * months;
      return [rupees(emi), [['Total interest', rupees(Math.max(0, total - principal))], ['Total repayment', rupees(total)]]];
    },
  },
};

const form = byId('planner-form');
const fields = byId('plan-fields');
const buttons = [...document.querySelectorAll('[data-plan]')];
const stored = new Map();
let mode;
let rows;

function update() {
  const inputs = [...fields.querySelectorAll('input')];
  byId('export-plan').disabled = !form.checkValidity();
  if (byId('export-plan').disabled) {
    byId('plan-total').value = 'Check inputs';
    byId('plan-breakdown').replaceChildren();
    return;
  }
  const values = inputs.map((input) => input.valueAsNumber);
  const [result, breakdown] = mode.calculate(values);
  byId('plan-total').value = result;
  byId('plan-breakdown').replaceChildren(...breakdown.map(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const amount = document.createElement('dd');
    term.textContent = label;
    amount.textContent = value;
    row.append(term, amount);
    return row;
  }));
  rows = [['Scenario', mode.name], ...mode.fields.map(([label], i) => [label, values[i]]), [mode.label, result], ...breakdown];
}

function activate(key) {
  if (mode) stored.set(mode, [...fields.querySelectorAll('input')].map((input) => input.value));
  mode = modes[key];
  const previous = stored.get(mode);
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.plan === key));
  fields.replaceChildren(...mode.fields.map(([label, initial, min, max, step = '1'], index) => {
    const field = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.max = max;
    input.step = step;
    input.required = true;
    input.value = previous?.[index] ?? initial;
    field.append(label, input);
    return field;
  }));
  byId('plan-result-label').textContent = mode.label;
  byId('plan-rules').textContent = mode.rules;
  update();
}

for (const button of buttons) button.addEventListener('click', () => activate(button.dataset.plan));
form.addEventListener('input', update);
form.addEventListener('submit', (event) => event.preventDefault());
byId('export-plan').addEventListener('click', () => {
  const csv = rows.map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rupeepilot-' + mode.name.toLowerCase().replaceAll(' ', '-') + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
activate('reserve');

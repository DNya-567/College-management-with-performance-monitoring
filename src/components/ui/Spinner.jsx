// Reusable loading spinner component.
// Use instead of bare "Loading..." text everywhere.
const Spinner = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center gap-2 py-8">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#0052FF]" />
    <span className="text-sm text-slate-500">{text}</span>
  </div>
);

export default Spinner;


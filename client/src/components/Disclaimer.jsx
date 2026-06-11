import { Scale } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="alert alert-info">
      <Scale size={18} />
      <p>
        <strong>LeaseLand provides general information, not legal advice.</strong>
        {' '}For advice about your situation, contact your state's tenancy authority or a qualified professional.
      </p>
    </div>
  );
}

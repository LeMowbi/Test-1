// Moyens de paiement proposés (Côte d'Ivoire). Dans le prototype, le paiement
// est SIMULÉ — à brancher plus tard sur un agrégateur (CinetPay / PayDunya).

import type { IconName } from '@/components/ui';

export type PaymentMethod = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  accent: string;
};

export const paymentMethods: PaymentMethod[] = [
  { id: 'wave', label: 'Wave', hint: 'Mobile money', icon: 'phone-portrait', accent: '#1DC4FF' },
  { id: 'orange', label: 'Orange Money', hint: 'Mobile money', icon: 'phone-portrait', accent: '#FF7900' },
  { id: 'mtn', label: 'MTN MoMo', hint: 'Mobile money', icon: 'phone-portrait', accent: '#FFCC00' },
  { id: 'moov', label: 'Moov Money', hint: 'Mobile money', icon: 'phone-portrait', accent: '#1466B8' },
  { id: 'carte', label: 'Carte bancaire', hint: 'Visa · Mastercard', icon: 'card', accent: '#C9A24B' },
  { id: 'espece', label: 'Payer au club', hint: 'Espèces sur place', icon: 'cash', accent: '#1FB57A' },
];

export function paymentLabel(id: string | null): string {
  return paymentMethods.find((m) => m.id === id)?.label ?? '—';
}

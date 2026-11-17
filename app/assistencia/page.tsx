import type { Metadata } from 'next';
import { AssistenciaView } from '@/components/AssistenciaView';

export const metadata: Metadata = {
  title: 'Assistência Técnica em Volta Redonda',
  description:
    'Assistência técnica especializada para iPhone e Android na Verri Imports. Troca de tela, bateria, conector e orçamento rápido pelo WhatsApp. Av. Paulo de Frontin, 590, Loja 07, Aterrado.',
  openGraph: {
    title: 'Assistência Técnica — Verri Imports',
    description:
      'Manutenção especializada para smartphones em Volta Redonda. Av. Paulo de Frontin, 590, Plaza Business Center, Loja 07.',
    type: 'website',
  },
};

export default function AssistenciaPage() {
  return <AssistenciaView />;
}

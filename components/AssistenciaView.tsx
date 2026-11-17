'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BatteryCharging,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  MapPin,
  Phone,
  Smartphone,
  Usb,
  Wrench,
} from 'lucide-react';
import { useStore } from '@/components/StoreProvider';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { buildTechnicalSupportWhatsAppMessage } from '@/lib/format';
import { DEFAULT_STORE_SETTINGS } from '@/lib/defaults';

interface RepairService {
  id: string;
  number: string;
  title: string;
  categoryLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REPAIR_SERVICES: RepairService[] = [
  {
    id: 'tela',
    number: '01.',
    title: 'Troca de tela e vidro',
    categoryLabel: 'Display e touch',
    description:
      'Substituição de frontal completa ou vidro para iPhone e Android, com conferência de brilho, toque e sensores após a montagem.',
    icon: Smartphone,
  },
  {
    id: 'bateria',
    number: '02.',
    title: 'Substituição de bateria',
    categoryLabel: 'Energia e autonomia',
    description:
      'Troca para aparelhos com queda rápida de carga, aquecimento ou desligamentos repentinos, com teste de consumo em bancada.',
    icon: BatteryCharging,
  },
  {
    id: 'conector',
    number: '03.',
    title: 'Conector de carga e áudio',
    categoryLabel: 'USB-C, Lightning e som',
    description:
      'Limpeza técnica especializada ou troca de conector de carga, microfone, auricular e alto-falante.',
    icon: Usb,
  },
  {
    id: 'camera',
    number: '04.',
    title: 'Câmeras, lentes e tampa traseira',
    categoryLabel: 'Óptica e carcaça',
    description:
      'Reparo de módulos de câmera, falha de foco, troca do vidro protetor de lente e substituição de tampa traseira.',
    icon: Camera,
  },
  {
    id: 'placa',
    number: '05.',
    title: 'Análise em placa e oxidação',
    categoryLabel: 'Microeletrônica',
    description:
      'Diagnóstico técnico para aparelhos que não ligam, tiveram contato com líquido ou apresentam falhas de carga e sinal.',
    icon: Cpu,
  },
  {
    id: 'software',
    number: '06.',
    title: 'Sistema, backup e restauração',
    categoryLabel: 'Software e dados',
    description:
      'Atualização de sistema, correção de travamentos na inicialização e transferência segura de dados entre aparelhos.',
    icon: Wrench,
  },
];

const BRAND_OPTIONS = ['iPhone', 'Samsung', 'Xiaomi', 'Motorola', 'Outro'] as const;

export function AssistenciaView() {
  const { settings } = useStore();
  const quoteBoxRef = useRef<HTMLDivElement | null>(null);

  const [selectedBrand, setSelectedBrand] = useState<string>('iPhone');
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>(
    REPAIR_SERVICES[0].title
  );
  const [problemNotes, setProblemNotes] = useState<string>('');
  const [benchImageError, setBenchImageError] = useState(false);

  const whatsAppMessage = useMemo(
    () =>
      buildTechnicalSupportWhatsAppMessage({
        brand: selectedBrand,
        model: deviceModel,
        service: selectedService,
        notes: problemNotes,
      }),
    [selectedBrand, deviceModel, selectedService, problemNotes]
  );

  const displayAddress = settings.address || DEFAULT_STORE_SETTINGS.address;
  const accentColor = settings.accentColor || '#00C9A7';

  const handleSelectService = (serviceTitle: string) => {
    setSelectedService(serviceTitle);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      quoteBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main>
      {/* 1. Hero Section */}
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-sm font-medium text-zinc-400">
                Assistência Técnica {settings.storeName} · Volta Redonda, RJ
              </p>

              <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.15rem)] font-bold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
                Manutenção especializada para iPhone e Android.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                Diagnóstico em bancada, troca de tela, bateria, conector e reparos
                com orçamento claro antes da execução. Atendimento presencial no
                Plaza Business Center ou pré-avaliação direta pelo WhatsApp.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#orcamento-tecnico"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors whitespace-nowrap"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>Solicitar orçamento</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <WhatsAppButton
                  variant="dark-outline"
                  label="Falar com a bancada"
                  customMessage="Olá! Gostaria de falar com a assistência técnica sobre o reparo de um aparelho."
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 border-t border-zinc-800/80 pt-6 text-sm text-zinc-300 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="whitespace-pre-line">{displayAddress}</span>
                </div>
                <div className="space-y-2">
                  {settings.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="font-mono-nums">{settings.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span>Orçamento conferido antes do reparo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 sm:h-80 lg:h-full lg:min-h-[360px]">
                {!benchImageError ? (
                  <img
                    src="/images/boutique_inspection_bench.jpg"
                    alt={`Bancada de assistência técnica da ${settings.storeName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setBenchImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-900 p-6 text-center text-zinc-400">
                    <Wrench className="h-8 w-8" />
                    <p className="text-sm font-medium text-zinc-300">
                      Bancada Técnica {settings.storeName}
                    </p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Services Grid + Interactive WhatsApp Quote Builder */}
      <section
        id="orcamento-tecnico"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: Selectable Services */}
          <div className="lg:col-span-7">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Serviços de assistência técnica
              </h2>
              <p className="mt-1.5 text-sm text-zinc-600">
                Selecione o tipo de reparo abaixo para preencher o pré-orçamento e
                enviar diretamente pelo WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {REPAIR_SERVICES.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.title;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service.title)}
                    aria-pressed={isSelected}
                    className={`group flex flex-col items-start rounded-2xl border p-5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 ${
                      isSelected
                        ? 'border-zinc-950 bg-white shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono-nums font-semibold text-zinc-950">
                          {service.number}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{service.categoryLabel}</span>
                      </div>
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isSelected
                            ? 'text-zinc-950'
                            : 'text-zinc-400 group-hover:text-zinc-700'
                        }`}
                      />
                    </div>

                    <h3 className="mt-3 font-display text-lg font-bold text-zinc-950">
                      {service.title}
                    </h3>

                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                      {service.description}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-950">
                      <span>
                        {isSelected ? 'Selecionado para orçamento' : 'Selecionar serviço'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Sticky Quote Form + Drop-off Address */}
          <div ref={quoteBoxRef} className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
              <h2 className="font-display text-xl font-bold text-zinc-950">
                Pré-orçamento no WhatsApp
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Informe o modelo e o problema para agilizar o atendimento com nossa
                equipe técnica.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Marca do aparelho
                  </label>
                  <div className="flex flex-wrap gap-1.5 rounded-xl bg-zinc-100 p-1">
                    {BRAND_OPTIONS.map((brand) => {
                      const active = selectedBrand === brand;
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setSelectedBrand(brand)}
                          className={`min-h-[38px] flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-white text-zinc-950 shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="repair-device-model"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Modelo do aparelho
                  </label>
                  <input
                    id="repair-device-model"
                    type="text"
                    maxLength={80}
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="Ex: iPhone 13, Galaxy S23, Redmi Note 13"
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="repair-service-select"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Serviço ou sintoma principal
                  </label>
                  <select
                    id="repair-service-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  >
                    {REPAIR_SERVICES.map((service) => (
                      <option key={service.id} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                    <option value="Diagnóstico geral em bancada">
                      Diagnóstico geral em bancada
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="repair-notes"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Detalhes adicionais (opcional)
                  </label>
                  <textarea
                    id="repair-notes"
                    rows={3}
                    maxLength={400}
                    value={problemNotes}
                    onChange={(e) => setProblemNotes(e.target.value)}
                    placeholder="Ex: Vidro trincado mas o toque funciona normalmente / bateria descarregando rápido."
                    className="w-full rounded-xl border border-zinc-200 bg-white p-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <WhatsAppButton
                    variant="accent"
                    fullWidth
                    label="Enviar orçamento no WhatsApp"
                    customMessage={whatsAppMessage}
                  />
                </div>
              </div>

              {/* Hairline-separated physical store drop-off info */}
              <div className="mt-6 border-t border-zinc-200 pt-5 space-y-2.5 text-sm text-zinc-600">
                <p className="text-xs font-semibold text-zinc-950">
                  Atendimento presencial para entrega e retirada
                </p>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="whitespace-pre-line">{displayAddress}</span>
                </div>
                {settings.openingHours && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    <span>{settings.openingHours}</span>
                  </div>
                )}
                {settings.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="font-mono-nums">{settings.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Transparent 3-Step Process */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-bold text-zinc-950 sm:text-2xl">
              Como funciona o atendimento técnico
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600">
              Processo direto, da avaliação inicial até a conferência final na loja.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="border-t border-zinc-200 pt-4">
              <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                01.
              </span>
              <h3 className="mt-2 font-display text-base font-bold text-zinc-950">
                Pré-avaliação ou balcão
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Envie o modelo pelo WhatsApp para tirar dúvidas iniciais ou leve o
                aparelho até a Loja 07 no Plaza Business Center.
              </p>
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                02.
              </span>
              <h3 className="mt-2 font-display text-base font-bold text-zinc-950">
                Diagnóstico e aprovação
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Nossa equipe confere os componentes afetados e informa o valor e o
                prazo antes de iniciar qualquer manutenção.
              </p>
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                03.
              </span>
              <h3 className="mt-2 font-display text-base font-bold text-zinc-950">
                Testes e retirada na loja
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Após o reparo, realizamos conferência de tela, carga, áudio,
                câmeras e conectividade para entrega segura.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-[#FAFAFA] p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-base font-bold text-zinc-950">
                Avaliando trocar de aparelho?
              </p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Veja os iPhones, Androids e acessórios disponíveis no catálogo da{' '}
                {settings.storeName}.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getDict } from '@/lib/i18n/server';
import en from '@/lib/i18n/en';
import pt from '@/lib/i18n/pt';

// One share image per language: /en gets the English text, /pt the Portuguese.

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> | { lang: string } }) {
  const { lang } = await params;
  const t = lang === 'pt' ? pt : en;  // called without a lang while the build collects routes
  return [{ id: 'og', alt: t.og.alt, size, contentType }];
}

const C = { bg: '#0c0d0e', panel: '#141516', edge: '#222426', line: '#3d4144', ink: '#868b8f', hi: '#f4f5f5', glow: '#ff7a1a', glowHi: '#ffb070' };

// A flat half adder with A = 1 and B = 0: the A wires and the Sum LED are lit.
function Schematic() {
  const hot = (d: string) => [
    <path key={`${d}u`} d={d} stroke={C.glow} strokeOpacity={0.22} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    <path key={d} d={d} stroke={C.glowHi} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  ];
  const cold = (d: string) => <path key={d} d={d} stroke={C.line} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <svg width={500} height={400} viewBox="0 0 500 400">
      {hot('M110 118 H170 V95 H220')}
      {hot('M170 118 V275 H220')}
      {cold('M110 278 H190 V125 H220')}
      {cold('M190 278 V305 H220')}
      {hot('M350 110 H418')}
      {cold('M350 290 H418')}
      <rect x={20} y={90} width={90} height={56} rx={10} fill={C.panel} stroke={C.edge} strokeWidth={2} />
      <rect x={40} y={110} width={52} height={16} rx={8} fill={C.bg} />
      <rect x={70} y={104} width={26} height={28} rx={6} fill={C.glow} />
      <rect x={20} y={250} width={90} height={56} rx={10} fill={C.panel} stroke={C.edge} strokeWidth={2} />
      <rect x={40} y={270} width={52} height={16} rx={8} fill={C.bg} />
      <rect x={36} y={264} width={26} height={28} rx={6} fill={C.line} />
      <rect x={220} y={70} width={130} height={80} rx={10} fill="#17181a" stroke={C.line} strokeWidth={2} />
      <rect x={220} y={250} width={130} height={80} rx={10} fill="#17181a" stroke={C.line} strokeWidth={2} />
      <circle cx={440} cy={110} r={34} fill={C.glow} fillOpacity={0.18} />
      <circle cx={440} cy={110} r={22} fill={C.glow} stroke={C.glowHi} strokeWidth={3} />
      <circle cx={440} cy={290} r={22} fill={C.panel} stroke={C.line} strokeWidth={3} />
    </svg>
  );
}

const label = (x: number, y: number, text: string, color = C.ink, fontSize = 22) => (
  <div style={{ position: 'absolute', left: x, top: y, fontSize, color, letterSpacing: 2 }}>{text}</div>
);

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { t } = await getDict(params);
  const L = t.landing;
  const [regular, light] = await Promise.all([
    readFile(join(process.cwd(), 'assets/DMMono-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/DMMono-Light.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'DM Mono', color: C.hi,
          backgroundColor: C.bg,
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff12 1px, transparent 0), radial-gradient(700px 320px at 50% 120%, ${C.glow}26, transparent 70%)`,
          backgroundSize: '24px 24px, 100% 100%',
        }}
      >
        <div style={{ position: 'absolute', left: 400, top: 0, bottom: 0, width: 1, backgroundColor: C.edge }} />
        <div style={{ position: 'absolute', left: 800, top: 0, bottom: 0, width: 1, backgroundColor: C.edge }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '64px 0 64px 72px', width: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: `3px solid ${C.hi}` }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: C.glow }} />
            </div>
            {t.brand}
          </div>
          <div style={{ marginTop: 'auto', fontSize: 20, letterSpacing: 4, textTransform: 'uppercase', color: C.ink }}>{L.eyebrow}</div>
          <div style={{ marginTop: 20, fontSize: 78, fontWeight: 300, lineHeight: 1.04, letterSpacing: -3 }}>{L.title}</div>
          <div style={{ marginTop: 36, fontSize: 22, color: C.ink }}>board-logic.vercel.app</div>
        </div>

        <div style={{ position: 'absolute', right: 56, top: 115, width: 500, height: 400, display: 'flex' }}>
          <Schematic />
          {label(58, 60, 'A', C.hi)}
          {label(58, 220, 'B', C.hi)}
          {label(258, 98, 'XOR', C.hi)}
          {label(258, 278, 'AND', C.hi)}
          {label(432, 150, 'S', C.glowHi)}
          {label(432, 330, 'C')}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'DM Mono', data: regular, weight: 400, style: 'normal' },
        { name: 'DM Mono', data: light, weight: 300, style: 'normal' },
      ],
    },
  );
}

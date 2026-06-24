// app/(marketing)/us/business-banking/programmatic-financial-firewall/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const alt =
  'The Programmatic Financial Firewall — isolate and automate your LLC cash flow with Mercury';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'linear-gradient(135deg, rgba(34,211,238,0.16) 0%, rgba(9,9,11,0) 45%), linear-gradient(315deg, rgba(16,185,129,0.14) 0%, rgba(9,9,11,0) 45%)',
          padding: '72px 80px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#a1a1aa',
          }}
        >
          <div style={{ display: 'flex', letterSpacing: 4 }}>
            US BANKING INFRASTRUCTURE PROTOCOL · v2.6
          </div>
          <div style={{ display: 'flex', fontWeight: 700, color: '#ffffff' }}>SmartFinPro</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 86,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2,
            }}
          >
            The Programmatic
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 86,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2,
              color: '#22d3ee',
            }}
          >
            Financial Firewall
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 32,
              color: '#d4d4d8',
              lineHeight: 1.3,
              maxWidth: 940,
            }}
          >
            Isolate and automate your LLC&apos;s cash flow with Mercury — virtual-card firewalls,
            API receipt reconciliation, and hardware-key access.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: 16,
                height: 16,
                borderRadius: 8,
                marginRight: 14,
                backgroundColor: '#22d3ee',
              }}
            />
            <div style={{ display: 'flex', color: '#a1a1aa' }}>
              smartfinpro.com/us/business-banking
            </div>
          </div>
          <div style={{ display: 'flex', color: '#34d399', fontWeight: 700 }}>
            $250 founder bonus
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

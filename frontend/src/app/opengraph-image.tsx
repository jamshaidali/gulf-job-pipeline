import { ImageResponse } from 'next/og';

export const alt = 'RateYourCV: free resume builder and ATS resume checker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0b1120 0%, #0e3a5f 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#22d3ee',
              color: '#0b1120',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            RC
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>RateYourCV</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, marginTop: 48, lineHeight: 1.1, display: 'flex' }}>
          Free resume builder and ATS resume checker
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: '#a5f3fc', display: 'flex' }}>
          500+ templates · PDF and Word download · Tailor your CV to any job
        </div>
      </div>
    ),
    { ...size }
  );
}

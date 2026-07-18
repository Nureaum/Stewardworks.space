import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      playerName, 
      characterKey, 
      certOrg, 
      certFacilitator, 
      certFacTitle, 
      certSponsor, 
      certSponsorOrg, 
      certMessage,
      deliverables,
      characterSpriteUri
    } = body

    // Read logo files and convert to base64
    const { readFileSync, existsSync } = await import('fs')
    const { join } = await import('path')
    
    const publicPath = join(process.cwd(), 'public', 'images', 'cert')
    
    let caJobsFirstLogo = ''
    let sdsuRfLogo = ''
    let becomingLogo = ''
    let stewardSealLogo = ''
    
    try {
      if (existsSync(join(publicPath, 'logo-ca-jobs-first.png')))
        caJobsFirstLogo = readFileSync(join(publicPath, 'logo-ca-jobs-first.png'), 'base64')
      if (existsSync(join(publicPath, 'logo-sdsu-rf.png')))
        sdsuRfLogo = readFileSync(join(publicPath, 'logo-sdsu-rf.png'), 'base64')
      if (existsSync(join(publicPath, 'logo-becoming.webp')))
        becomingLogo = readFileSync(join(publicPath, 'logo-becoming.webp'), 'base64')
      if (existsSync(join(publicPath, 'steward-seal.png')))
        stewardSealLogo = readFileSync(join(publicPath, 'steward-seal.png'), 'base64')
    } catch (e) {
      console.warn('Some cert logos not found, continuing without them')
    }

    // Try to use puppeteer (works locally) or fallback to HTML response
    let pdf: Buffer | null = null
    
    try {
      const puppeteer = (await import('puppeteer')).default
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 2 })

      const certificateHTML = buildCertificateHTML({
        playerName, characterKey, certOrg, certFacilitator, certFacTitle,
        certSponsor, certSponsorOrg, certMessage, deliverables, characterSpriteUri,
        caJobsFirstLogo, sdsuRfLogo, becomingLogo, stewardSealLogo
      })

      await page.setContent(certificateHTML, { waitUntil: 'load' })
      
      try {
        await page.waitForFunction(() => document.fonts.ready, { timeout: 5000 })
      } catch (e) {}
      await new Promise(resolve => setTimeout(resolve, 300))

      pdf = Buffer.from(await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        preferCSSPageSize: false
      }))

      await browser.close()
    } catch (puppeteerError) {
      console.error('Puppeteer failed, returning HTML certificate:', puppeteerError)
      
      // Fallback: return the certificate as printable HTML
      const certificateHTML = buildCertificateHTML({
        playerName, characterKey, certOrg, certFacilitator, certFacTitle,
        certSponsor, certSponsorOrg, certMessage, deliverables, characterSpriteUri,
        caJobsFirstLogo, sdsuRfLogo, becomingLogo, stewardSealLogo
      })
      
      return new NextResponse(certificateHTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="certificate-${playerName?.replace(/\s+/g, '-') || 'steward'}.html"`
        }
      })
    }

    if (pdf) {
      return new NextResponse(pdf as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate-${playerName?.replace(/\s+/g, '-') || 'steward'}-${Date.now()}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF' },
      { status: 500 }
    )
  }
}

function buildCertificateHTML(opts: any) {
  const { playerName, characterKey, certOrg, certFacilitator, certFacTitle,
    certSponsor, certSponsorOrg, certMessage, deliverables, characterSpriteUri,
    caJobsFirstLogo, sdsuRfLogo, becomingLogo, stewardSealLogo } = opts

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;background:#f7f1e0;padding:0;margin:0;width:210mm;min-height:297mm}
.cert{width:100%;min-height:297mm;background:#f7f1e0;border:3px solid #b58a2e;border-radius:5px;box-shadow:0 0 0 9px #f8f0da,0 0 0 11px #c9a24a;color:#3a2c14;position:relative;padding:48px 56px;text-align:center}
.fp{font-family:'Courier Prime','Courier New',monospace;font-weight:bold}
.divider{height:2px;width:130px;background:#c9a24a;margin:18px auto}
.sig{font-family:'Segoe Script','Snell Roundhand','Brush Script MT',cursive;font-size:27px;color:#1a1206;line-height:1}
.sig-title{border-top:2px solid #3a2c14;margin-top:5px;padding-top:6px;font-size:11px;letter-spacing:1px;color:#5a4626;text-transform:uppercase}
.seal{width:88px;height:88px;border-radius:50%;background:radial-gradient(circle at 38% 30%,#f6dd8c 0%,#e6bd54 46%,#c69528 78%,#9c7015 100%);border:3px solid #8a6a2a;box-shadow:0 3px 10px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.4),inset 0 -6px 14px rgba(120,84,18,.5);overflow:hidden;display:flex;align-items:center;justify-content:center;margin:0 auto}
.seal img{width:85%;height:85%;object-fit:contain;opacity:.9}
@media print{body{margin:0;padding:0}.cert{box-shadow:none;border:none}}
</style>
</head>
<body>
<div class="cert">
  <div class="fp" style="font-size:8px;letter-spacing:3px;color:#a07d2c">✦ ${(certOrg || 'STEWARDWORKS').toUpperCase()} ✦</div>
  <div style="font-size:13px;letter-spacing:5px;color:#8a6a2a;margin-top:9px;text-transform:uppercase">Pilot Workshops · The Steward's Journey</div>
  <div class="divider"></div>
  <div style="font-size:42px;font-weight:700;letter-spacing:2px;color:#241a08">Certificate of Completion</div>
  <div style="font-size:17px;color:#5a4626;margin-top:22px;font-style:italic">This certifies that</div>
  <div style="display:flex;align-items:center;justify-content:center;gap:15px;margin:12px 0 6px;flex-wrap:wrap">
    ${characterSpriteUri ? `<img src="${characterSpriteUri}" alt="" width="48" height="48" style="image-rendering:pixelated;flex:none"/>` : ''}
    <div style="font-size:36px;font-weight:700;color:#1a1206;border-bottom:2px solid #c9a24a;padding:0 18px 6px">${playerName || 'Student'}</div>
  </div>
  <div style="font-size:13px;color:#8a6a2a;letter-spacing:2px;margin-bottom:22px;text-transform:uppercase">Steward · Certified Steward</div>
  <div style="font-size:17px;line-height:1.75;color:#3a2c14;max-width:580px;margin:0 auto">${certMessage || `has journeyed the full three-day intensive of <strong>The Steward's Journey</strong>, practicing <em>Active Production over Passive Consumption</em> and banking three original deliverables into the <strong>${certOrg || 'StewardWorks'}</strong> portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of <strong>12 Steward Principles</strong> carried forward — this steward is hereby conferred the standing of <strong>Certified Steward</strong>.`}</div>
  
  ${deliverables && deliverables.length > 0 ? `
  <div style="border-top:2px solid #dcc890;border-bottom:2px solid #dcc890;margin:26px auto;padding:18px 0;max-width:580px;text-align:left">
    <div class="fp" style="font-size:8px;color:#a07d2c;letter-spacing:2px;text-align:center;margin-bottom:15px">◆ DELIVERABLES OF RECORD ◆</div>
    ${deliverables.map((d: any, idx: number) => `
    <div style="display:flex;gap:14px;align-items:baseline;margin-bottom:11px">
      <div class="fp" style="flex:none;font-size:10px;font-weight:700;color:#8a6a2a;min-width:52px">DAY ${String(idx + 1).padStart(2, '0')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;color:#241a08;font-weight:700">${d.title || 'Deliverable ' + (idx + 1)}</div>
      </div>
    </div>`).join('')}
  </div>` : ''}

  <div style="display:flex;flex-wrap:wrap;gap:22px;justify-content:space-between;align-items:flex-end;max-width:580px;margin:30px auto 0">
    <div style="flex:1;min-width:160px;text-align:center">
      <div class="sig">${certFacilitator || 'Marisol Vega'}</div>
      <div class="sig-title">${certFacTitle || 'Program Director'} · ${certOrg || 'StewardWorks'}</div>
    </div>
    <div style="flex:none;text-align:center">
      <div class="seal">${stewardSealLogo ? `<img src="data:image/png;base64,${stewardSealLogo}" alt="Seal"/>` : ''}</div>
      <div class="fp" style="font-size:6px;color:#8a6a2a;margin-top:7px;letter-spacing:2px">OFFICIAL SEAL</div>
    </div>
    <div style="flex:1;min-width:160px;text-align:center">
      <div class="sig">${playerName || 'Student'}</div>
      <div class="sig-title">THE STEWARD</div>
    </div>
  </div>
  <div style="max-width:300px;margin:24px auto 0;text-align:center">
    <div class="sig">${certSponsor || 'Authorized Signatory'}</div>
    <div class="sig-title">FISCAL SPONSOR · ${certSponsorOrg || 'SDSU Research Foundation'}</div>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;max-width:580px;margin:26px auto 0;font-size:11px;color:#8a6a2a;letter-spacing:1px;font-family:'Courier New',monospace">
    <div>ISSUED ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div>CERTIFICATE NO. SW-${(characterKey || 'TEST').toUpperCase()}-${Date.now().toString().slice(-4)}</div>
  </div>
  <div style="border-top:1px solid rgba(138,106,42,.3);margin:24px auto 0;padding-top:20px;max-width:580px;text-align:center">
    <div class="fp" style="font-size:8px;color:#a07d2c;letter-spacing:2px;margin-bottom:12px">WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
    <div style="display:flex;justify-content:center;align-items:center;gap:40px">
      ${caJobsFirstLogo ? `<img src="data:image/png;base64,${caJobsFirstLogo}" alt="CA Jobs First" style="height:38px;object-fit:contain"/>` : ''}
      ${sdsuRfLogo ? `<img src="data:image/png;base64,${sdsuRfLogo}" alt="SDSU RF" style="height:38px;object-fit:contain"/>` : ''}
      ${becomingLogo ? `<img src="data:image/webp;base64,${becomingLogo}" alt="Becoming" style="height:38px;object-fit:contain"/>` : ''}
    </div>
  </div>
</div>
</body>
</html>`
}

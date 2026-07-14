import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { join } from 'path'

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
      characterSpriteUri // Pass the sprite URI from client
    } = body

    // Read logo files and convert to base64
    const publicPath = join(process.cwd(), 'public', 'images', 'cert')
    const caJobsFirstLogo = readFileSync(join(publicPath, 'logo-ca-jobs-first.png'), 'base64')
    const sdsuRfLogo = readFileSync(join(publicPath, 'logo-sdsu-rf.png'), 'base64')
    const becomingLogo = readFileSync(join(publicPath, 'logo-becoming.webp'), 'base64')
    const stewardSealLogo = readFileSync(join(publicPath, 'steward-seal.png'), 'base64')

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 2
    })

    // Build the certificate HTML
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Georgia, 'Times New Roman', serif;
              background: #f7f1e0;
              padding: 0;
              margin: 0;
              width: 210mm;
              height: 297mm;
            }
            
            .certificate-container {
              width: 100%;
              height: 100%;
              max-width: none;
              margin: 0;
              background: #f7f1e0;
              border: 3px solid #b58a2e;
              border-radius: 5px;
              box-shadow: 0 0 0 9px #f8f0da, 0 0 0 11px #c9a24a;
              color: #3a2c14;
              position: relative;
              page-break-inside: avoid;
              padding: 36px 52px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .certificate-content {
              text-align: center;
              position: relative;
              width: 100%;
            }
            
            .font-pixel {
              font-family: 'Courier Prime', 'Courier New', monospace;
              font-weight: bold;
            }
            
            .cert-header {
              margin-bottom: 12px;
            }
            
            .cert-body {
              margin-bottom: 22px;
            }
            
            .cert-footer {
              padding-top: 0;
            }
            
            .org-header {
              font-size: 8px;
              letter-spacing: 3px;
              color: #a07d2c;
            }
            
            .program-title {
              font-size: 13px;
              letter-spacing: 5px;
              color: #8a6a2a;
              margin-top: 9px;
              text-transform: uppercase;
            }
            
            .divider {
              height: 2px;
              width: 130px;
              background: #c9a24a;
              margin: 18px auto;
            }
            
            .cert-title {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #241a08;
            }
            
            .certifies-text {
              font-size: 15px;
              color: #5a4626;
              margin-top: 14px;
              font-style: italic;
            }
            
            .student-name-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin: 8px 0 4px;
              flex-wrap: wrap;
            }
            
            .student-name {
              font-size: 32px;
              font-weight: 700;
              color: #1a1206;
              border-bottom: 2px solid #c9a24a;
              padding: 0 18px 6px;
            }
            
            .character-title {
              font-size: 13px;
              color: #8a6a2a;
              letter-spacing: 2px;
              margin-bottom: 16px;
              text-transform: uppercase;
            }
            
            .cert-message {
              font-size: 15px;
              line-height: 1.6;
              color: #3a2c14;
              max-width: 580px;
              margin: 0 auto 12px;
              white-space: pre-wrap;
            }
            
            .deliverables-section {
              border-top: 2px solid #dcc890;
              border-bottom: 2px solid #dcc890;
              margin: 14px auto 20px;
              padding: 12px 0;
              max-width: 580px;
              text-align: left;
            }
            
            .deliverables-header {
              font-size: 8px;
              color: #a07d2c;
              letter-spacing: 2px;
              text-align: center;
              margin-bottom: 10px;
            }
            
            .deliverable-row {
              display: flex;
              gap: 14px;
              align-items: baseline;
              margin-bottom: 9px;
            }
            
            .deliverable-label {
              flex: none;
              font-weight: 700;
              color: #8a6a2a;
              min-width: 52px;
            }
            
            .deliverable-content {
              flex: 1;
              min-width: 0;
            }
            
            .deliverable-title {
              font-size: 16px;
              color: #241a08;
              font-weight: 700;
            }
            
            .deliverable-url {
              font-size: 13px;
              color: #6a542c;
              word-break: break-all;
              font-family: 'Courier New', monospace;
            }
            
            .signatures-section {
              display: flex;
              flex-wrap: wrap;
              gap: 18px;
              justify-content: space-between;
              align-items: flex-end;
              max-width: 580px;
              margin: 0 auto 12px;
              page-break-inside: avoid;
            }
            
            .signature-box {
              flex: 1;
              min-width: 160px;
              text-align: center;
            }
            
            .signature-name {
              font-family: 'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive;
              font-size: 27px;
              color: #1a1206;
              line-height: 1;
            }
            
            .signature-title {
              border-top: 2px solid #3a2c14;
              margin-top: 5px;
              padding-top: 6px;
              font-size: 11px;
              letter-spacing: 1px;
              color: #5a4626;
              text-transform: uppercase;
            }
            
            .seal-container {
              flex: none;
              text-align: center;
            }
            
            .seal {
              width: 76px;
              height: 76px;
              border-radius: 50%;
              background: radial-gradient(circle at 38% 30%, #f6dd8c 0%, #e6bd54 46%, #c69528 78%, #9c7015 100%);
              border: 3px solid #8a6a2a;
              box-shadow: 0 3px 10px rgba(0,0,0,.35), inset 0 0 0 3px rgba(255,255,255,.4), inset 0 -6px 14px rgba(120,84,18,.5);
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
            }
            
            .seal img {
              width: 85%;
              height: 85%;
              object-fit: contain;
              opacity: 0.9;
            }
            
            .seal-label {
              font-size: 6px;
              color: #8a6a2a;
              margin-top: 5px;
              letter-spacing: 2px;
            }
            
            .sponsor-section {
              max-width: 300px;
              margin: 10px auto 0;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .metadata-footer {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              justify-content: space-between;
              max-width: 580px;
              margin: 12px auto 0;
              font-size: 11px;
              color: #8a6a2a;
              letter-spacing: 1px;
              font-family: 'Courier New', monospace;
            }
            
            .funding-section {
              border-top: 1px solid rgba(138,106,42,.3);
              margin: 10px auto 0;
              padding-top: 12px;
              max-width: 580px;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .funding-header {
              font-size: 7px;
              color: #a07d2c;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            
            .funding-logos {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 32px;
              flex-wrap: wrap;
            }
            
            .funding-logos img {
              height: 42px;
              object-fit: contain;
              max-width: 140px;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-content">
              <div class="cert-header">
                <div class="font-pixel org-header">✦ ${(certOrg || 'STEWARDWORKS').toUpperCase()} ✦</div>
                <div class="program-title">Pilot Workshops · The Steward's Journey</div>
                <div class="divider"></div>
                <div class="cert-title">Certificate of Completion</div>
              </div>
              
              <div class="cert-body">
                <div class="certifies-text">This certifies that</div>
                <div class="student-name-container">
                  ${characterSpriteUri ? `<img src="${characterSpriteUri}" alt="Character" width="48" height="48" style="image-rendering: pixelated; flex: none;" />` : ''}
                  <div class="student-name">${playerName || 'Student Name'}</div>
                </div>
                <div class="character-title">Steward · Certified Steward</div>
                
                ${certMessage ? 
                  `<div class="cert-message">${certMessage}</div>` :
                  `<div class="cert-message">has journeyed the full three-day intensive of <strong>The Steward's Journey</strong>, practicing <em>Active Production over Passive Consumption</em> and banking three original deliverables into the <strong>${certOrg || 'StewardWorks'}</strong> portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of <strong>12 Steward Principles</strong> carried forward — this steward is hereby conferred the standing of <strong>Certified Steward</strong>.</div>`
                }

                ${deliverables && deliverables.length > 0 ? `
                  <div class="deliverables-section">
                    <div class="font-pixel deliverables-header">◆ DELIVERABLES OF RECORD ◆</div>
                    ${deliverables.map((d: any, idx: number) => `
                      <div class="deliverable-row">
                        <div class="deliverable-label">D${idx + 1}</div>
                        <div class="deliverable-content">
                          <div class="deliverable-title">${d.title || `Deliverable ${idx + 1}`}</div>
                          ${d.url ? `<div class="deliverable-url">${d.url}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <div class="cert-footer">
                <div class="signatures-section">
                  <div class="signature-box">
                    <div class="signature-name">${certFacilitator || 'Marisol Vega'}</div>
                    <div class="signature-title">${certFacTitle || 'Program Director'} · ${certOrg || 'StewardWorks'}</div>
                  </div>
                  <div class="seal-container">
                    <div class="seal">
                      <img src="data:image/png;base64,${stewardSealLogo}" alt="Seal" style="width: 85%; height: 85%; object-fit: contain; opacity: 0.9;" />
                    </div>
                    <div class="font-pixel seal-label">OFFICIAL SEAL</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-name">${playerName || 'Student Name'}</div>
                    <div class="signature-title">THE STEWARD</div>
                  </div>
                </div>

                <div class="sponsor-section">
                  <div class="signature-name">${certSponsor || 'Dr. Jane Smith'}</div>
                  <div class="signature-title">FISCAL SPONSOR · ${certSponsorOrg || 'SDSU Research Foundation'}</div>
                </div>

                <div class="metadata-footer">
                  <div>ISSUED ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div>CERTIFICATE NO. SW-${characterKey?.toUpperCase() || 'TEST'}-${Date.now().toString().slice(-4)}</div>
                </div>

                <div class="funding-section">
                  <div class="font-pixel funding-header">WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
                  <div class="funding-logos">
                    <img src="data:image/png;base64,${caJobsFirstLogo}" alt="CA Jobs First" />
                    <img src="data:image/png;base64,${sdsuRfLogo}" alt="SDSU Research Foundation" />
                    <img src="data:image/webp;base64,${becomingLogo}" alt="The Becoming Project" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Set the HTML content
    await page.setContent(certificateHTML, {
      waitUntil: 'domcontentloaded'
    })

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      },
      preferCSSPageSize: false
    })

    await browser.close()

    // Return the PDF
    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${playerName?.replace(/\s+/g, '-') || 'steward'}-${Date.now()}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF' },
      { status: 500 }
    )
  }
}

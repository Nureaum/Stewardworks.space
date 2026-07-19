'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

function TermsContent() {
  return (
    <div className="space-y-8 text-left">
      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">1. About This Program</h3>
        <p className="text-sm leading-relaxed mb-3">
          StewardWorks is a platform of <strong>Nureaum</strong>, operating the <em>AI Content Creation &amp; Environmental Literacy Hub</em> — a project funded through the <strong>California Jobs First Catalyst Pre-Development Fund</strong> (Grant No. 5B591A 7805 E0024947), administered by the San Diego State University Research Foundation as fiscal agent for the Southern Border Coalition, with The Becoming Project, Inc. serving as fiscal sponsor and Eden.art as technical partner. The grant period runs through September 30, 2026.
        </p>
        <p className="text-sm leading-relaxed">
          This is a community workforce-development and environmental literacy initiative, not a state government website, and does not represent an official offer of employment, state benefits, or state services.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">2. Eligibility</h3>
        <p className="text-sm leading-relaxed">
          Participants must be 18 years of age or older to create an account independently. If you are between 15–24 and participating under a program's youth pathway, see Section 12 (Minors &amp; Youth Participants) below — a separate parent/guardian or facilitator consent process applies before you may proceed.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">3. Acceptable Use</h3>
        <p className="text-sm leading-relaxed mb-3">By using StewardWorks, you agree not to:</p>
        <ul className="list-disc pl-5 text-sm space-y-1 opacity-90">
          <li>Upload or generate content that is unlawful, harassing, hateful, sexually explicit, or that infringes another person's rights;</li>
          <li>Attempt to access another participant's account, impersonate another person, or misrepresent your identity or eligibility;</li>
          <li>Use the AI Lab (Eden.art integration) to generate content unrelated to program purposes, or to circumvent Eden.art's own usage policies;</li>
          <li>Attempt to interfere with, reverse-engineer, or disrupt the platform's operation;</li>
          <li>Use the platform to collect or store other participants' personal information without consent.</li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">
          Violation of this section may result in suspension or termination of your account under Section 10.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">4. Account Security</h3>
        <p className="text-sm leading-relaxed">
          You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us promptly at nureaum@proton.me if you suspect unauthorized access. Please provide accurate information when creating your account — program eligibility and reporting depend on it.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">5. Data Collection &amp; Use</h3>
        <p className="text-sm leading-relaxed mb-3">
          Information you provide (including workshop participation, feedback, deliverables, and any content created through the AI Lab) with this consent may be:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 opacity-90">
          <li>Used internally by Nureaum and The Becoming Project, Inc. for program administration, reporting, and compliance with the Catalyst grant agreement;</li>
          <li>Shared with San Diego State University Research Foundation and the California Jobs First Southern Border Coalition as required for grant reporting and audit purposes;</li>
          <li>Retained and made available consistent with the grant's data-sharing terms: regional planning process data and research results produced under this award may be made publicly available for a minimum of five (5) years from final payment of the grant, and may be used by community members, educational institutions, and nonprofits for educational, research, and funding purposes.</li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">We will not sell your personal information.</p>
        <p className="text-sm leading-relaxed mt-3">
          <strong>Note on platform availability:</strong> The five-year public-availability requirement above applies to the underlying program data and research results, not to the StewardWorks platform itself. Nureaum does not guarantee that stewardworks.space will remain active for the full retention period. After the grant period ends, required data may be migrated to or archived in alternative accessible formats (e.g., a published report, data repository, or successor site) to satisfy this requirement.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">6. Data Sovereignty &amp; Sub-Processors</h3>
        <p className="text-sm leading-relaxed mb-3">
          StewardWorks relies on the following third-party infrastructure and service providers to operate the platform:
        </p>
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold border-b">Provider</th>
                <th className="px-3 py-2 text-left font-bold border-b">Role</th>
                <th className="px-3 py-2 text-left font-bold border-b">Data Involved</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium">Supabase</td>
                <td className="px-3 py-2">Database / backend storage</td>
                <td className="px-3 py-2">Account records, program data, submitted content</td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium">Clerk</td>
                <td className="px-3 py-2">Authentication</td>
                <td className="px-3 py-2">Login credentials, session data</td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-medium">Vercel</td>
                <td className="px-3 py-2">Hosting</td>
                <td className="px-3 py-2">Site delivery, technical logs</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Eden.art</td>
                <td className="px-3 py-2">AI Lab (embedded, iframe)</td>
                <td className="px-3 py-2">Content you create/submit within the AI Lab tool</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 text-sm space-y-2 opacity-90">
          <li><strong>Hosting location:</strong> StewardWorks infrastructure is hosted on U.S.-based cloud servers via Vercel and Supabase.</li>
          <li><strong>Cross-border participants:</strong> This program engages communities across the Imperial Valley and Mexicali Valley region. If you are located outside the United States when using StewardWorks, your information will still be transferred to and processed in the United States, and by using the platform you consent to that transfer.</li>
          <li><strong>Sub-processor access:</strong> Eden.art operates as an independent technical partner; content you generate within the embedded AI Lab is also subject to Eden.art's own privacy policy and terms, which we encourage you to review separately.</li>
          <li><strong>Grant data-sharing exception:</strong> Notwithstanding the above, data collected as part of the Catalyst grant's community engagement and research components is subject to the public-availability terms described in Section 5, regardless of hosting location.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">7. Your Privacy Rights (California Residents)</h3>
        <p className="text-sm leading-relaxed mb-3">
          If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 opacity-90">
          <li>Know what personal information we have collected about you;</li>
          <li>Request deletion of your personal information (subject to the grant's public-data retention terms in Section 5, which may limit deletion of program/research data during the retention period);</li>
          <li>Opt out of the sale of personal information — we do not sell personal information, so no opt-out action is needed.</li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">
          To exercise these rights, contact nureaum@proton.me. We will respond within the timeframe required by law.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">8. Data Retention &amp; Deletion</h3>
        <p className="text-sm leading-relaxed">
          Account and platform data is retained for the duration of your program participation and for the period required by the Catalyst grant's reporting and public-availability terms (minimum five years post-final-payment for research/planning data, per Section 5). Outside of that grant-required retention, you may request deletion of personal account data not subject to those terms by contacting us.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">9. Ownership of Work Product &amp; Intellectual Property</h3>
        <p className="text-sm leading-relaxed mb-3">
          The StewardWorks platform, its design, curriculum materials, and underlying software are owned by Nureaum and its licensors, except where otherwise noted.
        </p>
        <p className="text-sm leading-relaxed">
          Materials you create as part of Pilot Workshops or curriculum activities may be used by Nureaum and its grant partners for program evaluation, reporting to the Foundation, and future educational/community use, consistent with the grant's Rights in Work Product terms. If you do not wish specific personal content to be used this way, contact us before submitting it (see Section 14).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">10. Account Termination</h3>
        <p className="text-sm leading-relaxed">
          We may suspend or terminate your account if you violate this notice, misuse the platform, or if required by grant compliance obligations. You may also request deactivation of your own account at any time by contacting us.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">11. Third-Party Services Disclaimer</h3>
        <p className="text-sm leading-relaxed">
          StewardWorks embeds or links to third-party tools, including Eden.art's AI Lab. We are not responsible for the availability, content, or practices of third-party services, and your use of them is governed by their own terms.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">12. Minors &amp; Youth Participants</h3>
        <p className="text-sm leading-relaxed mb-3">
          Some program pathways engage youth participants ages 15–24. If you are under 18:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 opacity-90">
          <li>You may only create an account or participate with the involvement of a parent/guardian or authorized program facilitator, who must complete a separate consent process before your participation begins;</li>
          <li>We limit the collection of personal information from minors to what is necessary for program administration and reporting;</li>
          <li>A parent or guardian may request review or deletion of a minor's information (subject to grant retention terms in Section 5) by contacting nureaum@proton.me.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">13. No Guarantee of Employment or Outcomes</h3>
        <p className="text-sm leading-relaxed">
          StewardWorks is an exploratory, pre-development workforce program. Participation does not guarantee job placement, certification, or any specific economic outcome. Program content is designed to build skills and inform a feasibility study; it is not a promise of future employment.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">14. Disclaimer of Warranties &amp; Limitation of Liability</h3>
        <p className="text-sm leading-relaxed">
          StewardWorks is provided "as is" without warranties of any kind, express or implied. To the fullest extent permitted by law, Nureaum, The Becoming Project, Inc., and their partners are not liable for indirect, incidental, or consequential damages arising from your use of the platform, including interruptions, data loss, or third-party service failures (including Eden.art, Supabase, Clerk, or Vercel outages).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">15. Nondiscrimination</h3>
        <p className="text-sm leading-relaxed">
          Consistent with the Fair Employment and Housing Act and the program's grant terms, Nureaum and its partners do not discriminate on the basis of race, religion, color, national origin, ancestry, disability, medical condition, marital status, age, sex, sexual orientation, or gender identity in program participation.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">16. Governing Law</h3>
        <p className="text-sm leading-relaxed">
          This notice is governed by the laws of the State of California, consistent with the governing law provisions of the underlying Catalyst Pre-Development Fund Grant Agreement.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">17. Changes to This Notice</h3>
        <p className="text-sm leading-relaxed">
          We may update this notice from time to time to reflect changes in the platform, our partners, or applicable law. Material changes will be posted on the site with an updated "Last updated" date; continued use of the platform after changes take effect constitutes acceptance.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">18. Bilingual Access</h3>
        <p className="text-sm leading-relaxed">
          Program materials and this notice are available in English and Spanish. Este aviso está disponible en español a petición.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-steward-blue mb-3">19. Contact</h3>
        <p className="text-sm leading-relaxed">
          Questions about this notice, your data, or the program can be directed to: <strong>Nureaum</strong> — nureaum@proton.me
        </p>
      </section>
    </div>
  );
}

export default function AgreementsPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [termsError, setTermsError] = useState('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Track scroll position in terms content
  useEffect(() => {
    const el = termsScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const threshold = 50;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
        setHasScrolledToBottom(true);
      }
    };
    el.addEventListener('scroll', handleScroll);
    // Check immediately in case content fits without scrolling
    if (el.scrollHeight <= el.clientHeight) {
      setHasScrolledToBottom(true);
    }
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAcceptTerms = () => {
    if (!termsAccepted) {
      setTermsError('You must check the box to accept the terms.');
      return;
    }
    if (!signature.trim()) {
      setTermsError('Please type your full name as your signature.');
      return;
    }
    setTermsError('');
    sessionStorage.setItem('terms_signature', signature.trim());
    sessionStorage.setItem('terms_accepted_at', new Date().toISOString());
    router.push('/signup?termsAccepted=true');
  };

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4 py-8 relative z-10">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-steward-dark px-6 md:px-8 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-steward-blue rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            SW
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Site Notice &amp; Terms of Participation
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              Please read and accept before creating your account
            </p>
          </div>
        </div>

        {/* Terms Content - Scrollable */}
        <div
          ref={termsScrollRef}
          className="px-6 md:px-10 py-8 overflow-y-auto max-h-[50vh] border-b border-gray-100"
        >
          <TermsContent />
        </div>

        {/* Scroll indicator */}
        {!hasScrolledToBottom && (
          <div className="flex items-center justify-center py-2 bg-steward-blue/5 border-b border-gray-100">
            <ChevronDown size={16} className="text-steward-blue animate-bounce mr-1" />
            <span className="text-xs text-steward-blue font-medium">Scroll down to read the full terms</span>
          </div>
        )}

        {/* Acceptance Area */}
        <div className="px-6 md:px-10 py-6 bg-gray-50/50 space-y-5">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (termsError) setTermsError('');
              }}
              className="mt-0.5 w-5 h-5 rounded border-2 border-steward-blue text-steward-blue focus:ring-steward-blue/30 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm font-medium text-steward-dark leading-snug group-hover:text-steward-blue transition-colors">
              I have read and accept the StewardWorks Site Notice &amp; Terms of Participation.
            </span>
          </label>

          {/* Signature */}
          <div>
            <label className="block text-xs font-bold text-steward-dark/60 uppercase tracking-wider mb-2">
              Signature (type your full name)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                if (termsError) setTermsError('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-dashed border-steward-blue/30 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-medium text-steward-dark placeholder:text-gray-400 text-sm"
              placeholder="Type your full name here..."
            />
          </div>

          {/* Error */}
          {termsError && (
            <p className="text-red-500 text-xs font-bold">{termsError}</p>
          )}

          {/* Button */}
          <button
            onClick={handleAcceptTerms}
            disabled={!hasScrolledToBottom}
            className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-steward-blue"
          >
            Accept &amp; Continue to Sign Up
          </button>

          {!hasScrolledToBottom && (
            <p className="text-center text-xs text-steward-dark/50">
              Please scroll through the entire terms to continue
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-10 py-4 bg-white border-t border-gray-100 text-center">
          <p className="text-xs text-steward-dark/50">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-steward-blue hover:text-steward-orange transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

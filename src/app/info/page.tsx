'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getSystemBulletins } from '@/app/actions/bulletins';
import { Mail, Phone, MapPin } from 'lucide-react';
import ContactFormModal from '@/components/ContactFormModal';

export default function InfoPage() {
  const { t } = useLanguage();
  const [aboutHtml, setAboutHtml] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemBulletins();
        if (data) {
          // Prefer rich HTML content, fallback to plain text
          setAboutHtml(data.about_content_html || '');
          setAboutText(data.about_content || '');
          // Use new contact fields, fallback to legacy contact_details
          setContactEmail(data.contact_email || data.contact_details || '');
          setContactPhone(data.contact_phone || '');
          setContactAddress(data.contact_address || '');
        }
      } catch (err) {
        console.error("Failed to load about info:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Determine which content to display
  const hasRichContent = aboutHtml && aboutHtml.trim().length > 0;
  const hasAnyContact = contactEmail || contactPhone || contactAddress;

  // Default content if nothing is set
  const defaultContent = t('mission.body.long');

  return (
    <main className="min-h-screen bg-steward-offwhite text-steward-dark font-exo">
      {/* Header area with back button */}
      <div className="max-w-4xl mx-auto px-8 pt-8 md:pt-16">
        <Link href="/" className="inline-flex items-center text-steward-gold hover:text-steward-orange transition-colors font-medium">
          <span className="mr-2">←</span> Back to Home
        </Link>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-8 py-12 md:py-16 space-y-12">
        {/* Title Section - Always static */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-steward-green">
            About StewardWorks
          </h1>
          <div className="h-1 w-24 bg-steward-orange" />
        </div>

        {/* Dynamic Content Section */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-steward-gold/20 rounded w-3/4"></div>
            <div className="h-4 bg-steward-gold/20 rounded w-full"></div>
            <div className="h-4 bg-steward-gold/20 rounded w-5/6"></div>
          </div>
        ) : hasRichContent ? (
          // Rich HTML content from admin
          <div 
            className="prose prose-xl prose-steward max-w-none text-steward-dark opacity-90 leading-relaxed
              [&_p]:mb-6 [&_p]:leading-relaxed
              [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-steward-green [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-steward-green [&_h2]:mb-3
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-steward-dark [&_h3]:mb-2
              [&_a]:text-steward-green [&_a]:underline [&_a]:hover:text-steward-orange
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6
              [&_li]:mb-2 [&_li]:leading-relaxed
              [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:my-8 [&_img]:max-w-full
              [&_blockquote]:border-l-4 [&_blockquote]:border-steward-gold [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:my-6
              [&_strong]:font-bold [&_strong]:text-steward-dark
              [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
        ) : (
          // Plain text content (legacy support) or default
          <div className="prose prose-xl text-steward-dark opacity-90 leading-relaxed whitespace-pre-line">
            {aboutText || defaultContent}
          </div>
        )}

        {/* Contact Section */}
        {hasAnyContact && (
          <div className="pt-12 border-t border-steward-gold/20">
            <div className="bg-white rounded-2xl shadow-lg border border-steward-gold/10 p-8 max-w-xl">
              <h2 className="text-lg font-bold text-steward-green uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="text-2xl">📬</span> Contact Us
              </h2>
              
              <div className="space-y-5">
                {/* Email */}
                {contactEmail && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-steward-green/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-steward-green" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-steward-gold uppercase tracking-wider mb-1">Email</div>
                      <a 
                        href={`mailto:${contactEmail}`}
                        className="text-steward-green hover:text-steward-orange transition-colors font-medium text-lg"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Phone */}
                {contactPhone && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-steward-orange/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-steward-orange" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-steward-gold uppercase tracking-wider mb-1">Phone</div>
                      <a 
                        href={`tel:${contactPhone.replace(/\s/g, '')}`}
                        className="text-steward-dark hover:text-steward-green transition-colors font-medium text-lg"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Address */}
                {contactAddress && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-steward-gold/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-steward-gold" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-steward-gold uppercase tracking-wider mb-1">Location</div>
                      <address className="text-steward-dark font-medium text-lg not-italic whitespace-pre-line leading-relaxed">
                        {contactAddress}
                      </address>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Button */}
              {contactEmail && (
                <div className="mt-8 pt-6 border-t border-steward-gold/10">
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-steward-green text-white font-bold rounded-full hover:bg-steward-orange transition-all shadow-lg text-lg"
                  >
                    <Mail size={20} />
                    Send us an Email
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="flex justify-center pt-8">
          <Link href="/login">
            <button className="px-12 py-4 bg-steward-green text-steward-offwhite font-bold rounded-full hover:bg-steward-orange transition-all shadow-lg text-xl">
              {t('enter.site')}
            </button>
          </Link>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-16" />

      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={showContactForm} 
        onClose={() => setShowContactForm(false)} 
      />
    </main>
  );
}

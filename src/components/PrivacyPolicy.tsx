import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>

          <div className="text-gray-700 space-y-6">
            <p className="text-sm text-gray-500">Last Updated: January 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                At RivoBook, we are committed to protecting your privacy. We collect information to provide and
                improve our services. The types of information we collect include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, and payment details
                  when you create an account or make a booking
                </li>
                <li>
                  <strong>Usage Information:</strong> Details about how you use our platform, including pages
                  visited, booking history, and preferences
                </li>
                <li>
                  <strong>Technical Information:</strong> IP address, browser type, device information, and
                  cookies
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use your information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Processing and managing your bookings</li>
                <li>Sending booking confirmations and important updates</li>
                <li>Improving our platform and services</li>
                <li>Personalizing your experience</li>
                <li>Communicating with you about promotions and new features (with your consent)</li>
                <li>Preventing fraud and ensuring platform security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p className="mb-3">
                We respect your privacy and do not sell your personal information. We may share your information
                in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>With Venue Operators:</strong> We share your booking details with the relevant venue
                  to facilitate your reservation
                </li>
                <li>
                  <strong>Service Providers:</strong> We work with trusted third-party service providers for
                  payment processing, email services, and analytics
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information when required by law or to
                  protect our rights and safety
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information from
                unauthorized access, disclosure, alteration, or destruction. This includes encryption of sensitive
                data, secure servers, and regular security audits. However, no method of transmission over the
                internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
                remember your preferences. You can control cookie settings through your browser, but disabling
                cookies may affect functionality of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <p className="mb-3">You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal data</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain types of data processing</li>
                <li>Request a copy of your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services and comply
                with legal obligations. Booking records are typically kept for 7 years for accounting and tax
                purposes. You can request deletion of your account at any time, subject to our legal retention
                requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under the age of 16. We do not knowingly collect
                personal information from children. If you believe we have inadvertently collected information
                from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal
                requirements. We will notify you of significant changes via email or through a notice on our
                platform. Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices, please contact
                us at:
              </p>
              <p className="mt-2">
                Email: support@rivobook.com<br />
                Phone: +94 11 234 5678<br />
                Address: 62/1, Dudley Senanayake Mawatha, Dehiwala - Mount Lavinia, Colombo
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

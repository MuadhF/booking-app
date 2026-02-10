import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>

          <div className="text-gray-700 space-y-6">
            <p className="text-sm text-gray-500">Last Updated: January 2025</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                Welcome to RivoBook. These Terms and Conditions govern your use of our football pitch booking services.
                By accessing or using our platform, you agree to be bound by these terms. Please read them carefully
                before making any bookings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Booking Terms</h2>
              <p className="mb-3">
                When you make a booking through RivoBook, you enter into a binding agreement to use the pitch at the
                specified date and time. All bookings are subject to availability and confirmation.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bookings must be made at least 24 hours in advance</li>
                <li>Payment is required at the time of booking</li>
                <li>You will receive a confirmation email with your booking details</li>
                <li>Please arrive 15 minutes before your scheduled time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
              <p className="mb-3">As a user of RivoBook services, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information when making bookings</li>
                <li>Use the facilities responsibly and respectfully</li>
                <li>Follow all venue rules and safety guidelines</li>
                <li>Not exceed the maximum capacity limits</li>
                <li>Leave the pitch in good condition after use</li>
                <li>Report any damages or incidents immediately to venue staff</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Payment and Pricing</h2>
              <p>
                All prices are displayed in the local currency and include applicable taxes unless otherwise stated.
                Payment is processed securely through our payment partners. We reserve the right to modify pricing
                at any time, but changes will not affect confirmed bookings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Liability and Insurance</h2>
              <p>
                RivoBook acts as a booking platform connecting users with venue operators. While we strive to ensure
                all venues meet safety standards, users participate in activities at their own risk. We recommend
                having appropriate sports insurance coverage. RivoBook is not liable for injuries, accidents, or
                loss of personal property during pitch use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Venue Rights</h2>
              <p>
                Venue operators reserve the right to refuse service or cancel bookings in cases of inappropriate
                behavior, safety concerns, or violation of venue rules. In such cases, refunds will be issued at
                the venue's discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p>
                All content on the RivoBook platform, including logos, text, images, and software, is the property
                of RivoBook or its content suppliers and is protected by intellectual property laws. Unauthorized
                use is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective
                immediately upon posting on our platform. Your continued use of our services after changes
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <p className="mt-2">
                Email: support@rivobook.com<br />
                Phone: +94 11 234 5678
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

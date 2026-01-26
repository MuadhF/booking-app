import React from 'react';
import { XCircle } from 'lucide-react';

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8">
            <XCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Cancellation Policy</h1>
          </div>

          <div className="text-gray-700 space-y-6">
            <p className="text-sm text-gray-500">Last Updated: January 2025</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Overview</h2>
              <p>
                At RivoBook, we understand that plans can change. This cancellation policy outlines the terms
                and conditions for modifying or canceling your pitch bookings. We aim to be fair to both our
                customers and venue partners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Cancellation Time Frames</h2>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  More than 24 Hours Before Booking
                </h3>
                <p className="text-green-800 text-sm">
                  Full refund to your original payment method. No cancellation fee applies. Refunds are
                  typically processed within 5-7 business days.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  12-24 Hours Before Booking
                </h3>
                <p className="text-yellow-800 text-sm">
                  50% refund to your original payment method. A 50% cancellation fee will be retained to
                  compensate the venue for late notice.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="font-semibold text-red-900 mb-2">
                  Less than 12 Hours Before Booking
                </h3>
                <p className="text-red-800 text-sm">
                  No refund available. The full booking amount will be retained as the venue has reserved
                  the pitch and turned away other potential bookings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">How to Cancel Your Booking</h2>
              <p className="mb-3">You can cancel your booking through the following methods:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>Online:</strong> Log into your account, go to 'My Bookings', and click the 'Cancel
                  Booking' button
                </li>
                <li>
                  <strong>Email:</strong> Send a cancellation request to bookings@rivobook.com with your
                  booking reference number
                </li>
                <li>
                  <strong>Phone:</strong> Call our support team at +94 11 234 5678 during business hours
                  (8 AM - 10 PM)
                </li>
              </ol>
              <p className="mt-3">
                Please note: The cancellation timestamp is based on when we receive and process your
                cancellation request, not when you initiated it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Modifying Your Booking</h2>
              <p>
                If you need to change the date, time, or pitch for your booking, this is treated as a
                cancellation followed by a new booking. The same cancellation time frames and fees apply.
                However, if you reschedule more than 24 hours in advance and to a time within the same week,
                we may waive the cancellation fee at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Weather-Related Cancellations</h2>
              <p className="mb-3">
                We understand that severe weather can impact outdoor sports activities:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  If extreme weather conditions make play unsafe or impossible, you may reschedule or receive
                  a full refund
                </li>
                <li>
                  Weather-related cancellations must be initiated by the venue operator and communicated to
                  customers
                </li>
                <li>
                  Light rain or minor weather inconveniences do not qualify for automatic cancellation rights
                </li>
                <li>
                  For covered or indoor pitches, weather-related cancellations typically do not apply
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Venue-Initiated Cancellations</h2>
              <p>
                In rare cases, a venue may need to cancel your booking due to unforeseen circumstances such as
                facility damage, maintenance emergencies, or other operational issues. In such cases:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>You will receive a full refund immediately</li>
                <li>We will assist in finding an alternative venue at a comparable price if possible</li>
                <li>You may receive a discount voucher for future bookings as compensation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">No-Show Policy</h2>
              <p>
                If you do not show up for your booking and have not canceled in advance, the full booking
                amount will be forfeited. We will not be able to offer any refunds or credits for no-shows.
                Please contact us as soon as possible if you know you cannot make your booking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Group Bookings and Events</h2>
              <p>
                Special cancellation terms may apply to large group bookings, tournaments, or corporate events.
                These will be communicated and agreed upon at the time of booking. Generally, group bookings
                require longer notice periods for cancellations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Refund Processing</h2>
              <p>
                All eligible refunds are processed to the original payment method used for the booking.
                Processing times vary by payment provider:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Credit/Debit Cards: 5-7 business days</li>
                <li>Digital Wallets: 3-5 business days</li>
                <li>Bank Transfers: 7-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Exceptional Circumstances</h2>
              <p>
                We recognize that exceptional circumstances may arise, such as medical emergencies, natural
                disasters, or other situations beyond your control. Please contact our support team with
                documentation, and we will review your case individually. While we cannot guarantee exceptions,
                we will do our best to accommodate genuine hardships.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p>
                If you have questions about our cancellation policy or need assistance with a cancellation,
                please contact us:
              </p>
              <p className="mt-2">
                Email: bookings@rivobook.com<br />
                Phone: +94 11 234 5678<br />
                Hours: Monday-Sunday, 8 AM - 10 PM
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Refunds() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Refund Policy</CardTitle>
            <p className="text-sm text-gray-500">Last updated: January 16, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Overview</h2>
            <p>
              We want you to be satisfied with your Date-Locked Plus subscription. This policy outlines our refund practices for subscription payments.
            </p>

            <h2>2. Subscription Refunds</h2>
            <p>
              Monthly subscriptions may be eligible for refunds under the following conditions:
            </p>
            <ul>
              <li>Request made within 7 days of initial purchase</li>
              <li>No previous refund requests on the account</li>
              <li>Account has not violated our Terms of Use</li>
              <li>Service has been materially unavailable or defective</li>
            </ul>

            <h2>3. No Refund Situations</h2>
            <p>Refunds will not be provided in the following cases:</p>
            <ul>
              <li>Account suspension or termination due to policy violations</li>
              <li>User's decision to no longer use the service</li>
              <li>Requests made after the 7-day window</li>
              <li>Partial month refunds (subscriptions are billed monthly)</li>
              <li>Technical issues on the user's device or internet connection</li>
            </ul>

            <h2>4. Beta Period</h2>
            <p>
              During the beta trial period, users have free access to premium features. No refunds apply to beta access as no charges are incurred.
            </p>

            <h2>5. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ol>
              <li>Contact our support team through the App</li>
              <li>Provide your account email and reason for refund</li>
              <li>Include payment transaction details</li>
              <li>Allow 5-7 business days for review</li>
            </ol>

            <h2>6. Refund Processing</h2>
            <p>
              Approved refunds will be processed within 10 business days to the original payment method. Processing times may vary by payment provider.
            </p>

            <h2>7. Subscription Cancellation</h2>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No prorated refunds for partial months.
            </p>

            <h2>8. Service Credits</h2>
            <p>
              In cases where a refund is not applicable, we may offer service credits or subscription extensions at our discretion.
            </p>

            <h2>9. Dispute Resolution</h2>
            <p>
              If your refund request is denied and you wish to dispute the decision, you may escalate through our support channels within 30 days.
            </p>

            <h2>10. Policy Changes</h2>
            <p>
              We reserve the right to modify this Refund Policy. Changes will be communicated via email or in-app notification. Continued use constitutes acceptance.
            </p>

            <h2>11. Contact</h2>
            <p>
              For refund inquiries or questions about this policy, contact our support team through the App.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
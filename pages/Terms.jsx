import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
            <CardTitle className="text-3xl">Terms of Use</CardTitle>
            <p className="text-sm text-gray-500">Last updated: January 16, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Date-Locked ("the App"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use the App for personal, non-commercial purposes. This is the grant of a license, not a transfer of title.
            </p>

            <h2>3. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul>
              <li>Provide accurate and current information</li>
              <li>Be at least 18 years of age</li>
              <li>Not upload inappropriate, explicit, or illegal content</li>
              <li>Respect other users and their privacy</li>
              <li>Not engage in harassment, abuse, or threatening behavior</li>
            </ul>

            <h2>4. Content Policy</h2>
            <p>
              All content uploaded must comply with our community guidelines. We prohibit:
            </p>
            <ul>
              <li>Nudity or sexually explicit content</li>
              <li>Content involving minors</li>
              <li>Violence or graphic content</li>
              <li>Harassment or abusive content</li>
              <li>Spam or misleading information</li>
            </ul>

            <h2>5. Account Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to the App immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>

            <h2>6. Strike System</h2>
            <p>
              Content policy violations result in strikes. Three strikes will lead to account suspension. Severe violations may result in immediate account termination.
            </p>

            <h2>7. Disclaimer</h2>
            <p>
              The App is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the App's operation or availability.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              Date-Locked shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the modified terms.
            </p>

            <h2>10. Contact</h2>
            <p>
              For questions about these Terms, please contact us through the App's support channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

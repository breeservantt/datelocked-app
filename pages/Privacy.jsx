import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-gray-500">Last updated: January 16, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, date of birth)</li>
              <li>Profile information (photos, location, relationship status)</li>
              <li>Content you upload (photos, videos, captions)</li>
              <li>Communication data (messages, interactions)</li>
              <li>Usage data (features used, time spent in app)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Provide and maintain the App's services</li>
              <li>Verify your age and identity</li>
              <li>Enable relationship features (Date-Lock, memories, goals)</li>
              <li>Moderate content for safety and policy compliance</li>
              <li>Send notifications and updates</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>

            <h2>3. Content Moderation</h2>
            <p>
              Uploaded content is analyzed using AI moderation to ensure compliance with our content policy. Moderation results are stored with your content.
            </p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul>
              <li>Your relationship partner (when Date-Locked)</li>
              <li>Service providers (hosting, analytics, payment processing)</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement security measures to protect your data, including encryption, secure storage, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of certain data processing</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active. After account deletion, some data may be retained for legal compliance or dispute resolution.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              The App is not intended for users under 18. We do not knowingly collect information from minors. If we discover such collection, we will delete it immediately.
            </p>

            <h2>9. International Users</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. By using the App, you consent to such transfers.
            </p>

            <h2>10. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us through the App's support channels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
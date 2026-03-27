/**
 * Brevo (formerly Sendinblue) Transactional Email Client
 *
 * Key priority:
 *  1. Encrypted key stored in Supabase (via Settings → API Keys)
 *  2. BREVO_API_KEY environment variable
 */

import { getActiveApiKey } from '@/lib/api-keys/resolver';

export async function sendTransactionalEmail(params: {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { email: string; name: string };
  replyTo?: { email: string; name?: string };
  attachment?: { content: string; name: string }[];
}) {
  const { to, subject, htmlContent, textContent, sender, replyTo, attachment } = params;

  // Resolve key: Supabase-stored key takes priority over environment variable
  const BREVO_API_KEY = await getActiveApiKey('brevo');

  if (!BREVO_API_KEY) {
    console.warn('Brevo API key is not configured. Email sending skipped.');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: sender || {
          name: "Touch Teqniques",
          email: process.env.SALES_EMAIL || "sales@touchteq.co.za"
        },
        replyTo,
        to,
        subject,
        htmlContent,
        textContent,
        attachment
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error('Brevo Email Error:', error);
    return { success: false, error: error.message };
  }
}

export async function addContactToBrevo(params: {
  email: string;
  name: string;
  company?: string;
  tags?: string[];
}) {
  const { email, name, company, tags } = params;

  // Resolve key: Supabase-stored key takes priority over environment variable
  const BREVO_API_KEY = await getActiveApiKey('brevo');

  if (!BREVO_API_KEY) {
    console.warn('Brevo API key is not configured. Contact addition skipped.');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        company: company || '',
        attributes: {
          COMPANY: company || ''
        },
        tags: tags || []
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'duplicate_parameter') {
        return { success: true, message: 'Contact already exists, updated' };
      }
      throw new Error(data.message || 'Failed to add contact');
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('Brevo Contact Error:', error);
    return { success: false, error: error.message };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, quoteNumber, clientName, declineReason, declinedAt } = body;

    const supabase = await createClient();
    
    // Get business profile for email settings
    const { data: profile } = await supabase
      .from('business_profile')
      .select('email')
      .single();

    // Send notification email to Thabo
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: 'info@touchteq.co.za',
        subject: `Quote Declined - ${quoteNumber} by ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Quote Declined</h2>
            <p>A client has declined their quote.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quote Number</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${quoteNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Client</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${clientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Declined At</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(declinedAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Reason</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${declineReason || 'No reason provided'}</td>
              </tr>
            </table>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification email');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClients() {
    console.log('Checking clients in database...\n');

    // Check total clients
    const { count: totalClients, error: countError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting clients:', countError);
        return;
    }

    console.log(`Total clients in database: ${totalClients}`);

    // Check clients with opening balance
    const { data: clientsWithBalance, error: balanceError } = await supabase
        .from('clients')
        .select('id, company_name, opening_balance, opening_balance_settled')
        .not('opening_balance', 'eq', 0)
        .limit(10);

    if (balanceError) {
        console.error('Error fetching clients with balance:', balanceError);
        return;
    }

    console.log(`\nClients with opening balance (showing first 10):`);
    if (clientsWithBalance && clientsWithBalance.length > 0) {
        clientsWithBalance.forEach(c => {
            console.log(`  - ${c.company_name}: R ${c.opening_balance} (Settled: ${c.opening_balance_settled})`);
        });
    } else {
        console.log('  No clients with opening balance found.');
    }

    // Check client_outstanding_summary view
    const { data: summary, error: summaryError } = await supabase
        .from('client_outstanding_summary')
        .select('*')
        .limit(5);

    if (summaryError) {
        console.error('\nError fetching from client_outstanding_summary:', summaryError);
    } else {
        console.log(`\nclient_outstanding_summary view (first 5 rows):`);
        if (summary && summary.length > 0) {
            summary.forEach(s => {
                console.log(`  - ${s.company_name}: Invoice=${s.invoice_balance}, Opening=${s.opening_balance}, Total=${s.total_outstanding}`);
            });
        } else {
            console.log('  No data in view.');
        }
    }
}

checkClients().catch(console.error);
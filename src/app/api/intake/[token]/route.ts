import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/* GET — Public: Fetch form info by token (no auth) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const result = await query(
      `SELECT f.id, f.client_id, f.token, f.status, f.sent_via, f.form_data, f.created_at,
              c.name AS client_name, c.phone AS client_phone, c.email AS client_email
       FROM al_intake_forms f
       LEFT JOIN al_clients c ON c.id = f.client_id
       WHERE f.token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = result.rows[0];

    return NextResponse.json({
      id: form.id,
      token: form.token,
      status: form.status,
      sent_via: form.sent_via,
      client_name: form.client_name || '',
      client_phone: form.client_phone || '',
      client_email: form.client_email || '',
      form_data: form.form_data || null,
      created_at: form.created_at,
    });
  } catch (err) {
    console.error('[api/intake/[token]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* POST — Public: Submit intake form (no auth) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await req.json();

    // Find the form
    const formResult = await query(
      `SELECT id, client_id, status FROM al_intake_forms WHERE token = $1`,
      [token],
    );

    if (formResult.rows.length === 0) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formResult.rows[0];

    if (form.status !== 'pending') {
      return NextResponse.json(
        { error: form.status === 'completed' ? 'Form already submitted' : 'Form has expired' },
        { status: 400 },
      );
    }

    const formData = body.form_data;
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ error: 'form_data is required' }, { status: 400 });
    }

    // Sanitize string values in form_data to prevent stored XSS
    for (const key of Object.keys(formData)) {
      if (typeof formData[key] === 'string') {
        formData[key] = formData[key].replace(/<[^>]*>/g, '').trim().slice(0, 2000);
      }
    }

    // Update intake form
    await query(
      `UPDATE al_intake_forms
       SET form_data = $1, status = 'completed', submitted_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(formData), form.id],
    );

    // If linked to a client, update their medical fields
    if (form.client_id) {
      const medicalHistory: Record<string, string> = {};
      if (formData.conditions) medicalHistory.conditions = formData.conditions;
      if (formData.medications) medicalHistory.medications = formData.medications;
      if (formData.previous_treatments) medicalHistory.previous_treatments = formData.previous_treatments;
      if (formData.skin_concerns) medicalHistory.skin_concerns = formData.skin_concerns;

      const updates: string[] = [];
      const values: unknown[] = [];

      if (formData.allergies) {
        values.push(formData.allergies);
        updates.push(`allergies = $${values.length}`);
      }
      if (formData.skin_type) {
        values.push(formData.skin_type);
        updates.push(`skin_type = $${values.length}`);
      }
      if (formData.gender) {
        values.push(formData.gender);
        updates.push(`gender = $${values.length}`);
      }
      if (formData.date_of_birth) {
        values.push(formData.date_of_birth);
        updates.push(`date_of_birth = $${values.length}`);
      }
      if (Object.keys(medicalHistory).length > 0) {
        values.push(JSON.stringify(medicalHistory));
        updates.push(`medical_history = $${values.length}`);
      }
      if (formData.photo_consent !== undefined) {
        values.push(formData.photo_consent);
        updates.push(`photo_consent = $${values.length}`);
      }
      if (formData.wa_consent !== undefined) {
        values.push(formData.wa_consent);
        updates.push(`wa_opted_in = $${values.length}`);
      }

      if (updates.length > 0) {
        values.push(form.client_id);
        await query(
          `UPDATE al_clients SET ${updates.join(', ')} WHERE id = $${values.length}`,
          values,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/intake/[token]] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

// GET: Fetch certificate settings for a cohort (public - anyone can view)
export async function GET(
  request: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const cohortId = params.cohortId
    const supabase = createServerSupabaseClient()

    const { data: cohort, error } = await supabase
      .from('cohorts')
      .select('cert_org, cert_facilitator, cert_fac_title, cert_sponsor, cert_sponsor_org, cert_message')
      .eq('id', cohortId)
      .single()

    if (error || !cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      )
    }

    // Return certificate settings with defaults
    return NextResponse.json({
      certOrg: cohort.cert_org || 'StewardWorks',
      certFacilitator: cohort.cert_facilitator || 'Marisol Vega',
      certFacTitle: cohort.cert_fac_title || 'Program Director',
      certSponsor: cohort.cert_sponsor || 'Dr. Jane Smith',
      certSponsorOrg: cohort.cert_sponsor_org || 'SDSU Research Foundation',
      certMessage: cohort.cert_message || '',
    })
  } catch (error) {
    console.error('Error fetching certificate settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificate settings' },
      { status: 500 }
    )
  }
}

// POST: Update certificate settings for a cohort (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const cohortId = params.cohortId
    const supabase = createServerSupabaseClient()

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      certOrg,
      certFacilitator,
      certFacTitle,
      certSponsor,
      certSponsorOrg,
      certMessage,
    } = body

    // Update cohort with certificate settings
    const { error: updateError } = await supabase
      .from('cohorts')
      .update({
        cert_org: certOrg,
        cert_facilitator: certFacilitator,
        cert_fac_title: certFacTitle,
        cert_sponsor: certSponsor,
        cert_sponsor_org: certSponsorOrg,
        cert_message: certMessage,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq('id', cohortId)

    if (updateError) {
      console.error('Error updating certificate settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update certificate settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating certificate settings:', error)
    return NextResponse.json(
      { error: 'Failed to update certificate settings' },
      { status: 500 }
    )
  }
}

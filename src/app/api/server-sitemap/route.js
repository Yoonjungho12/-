import { getServerSideSitemap } from 'next-sitemap'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 파트너십 데이터 가져오기
    const { data: partnerships } = await supabase
      .from('partnershipsubmit')
      .select('id, created_at')
      .eq('status', 'approved')

    // 사이트맵 필드 생성
    const fields = partnerships.map((partnership) => ({
      loc: `https://yeogidot.com/board/details/${partnership.id}`,
      lastmod: new Date(partnership.created_at).toISOString(),
      changefreq: 'daily',
      priority: 0.7,
    }))

    return getServerSideSitemap(fields)
  } catch (error) {
    console.error('Error generating server sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
} 
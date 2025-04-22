import { getServerSideSitemap } from 'next-sitemap'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    // 승인된 게시물 데이터 가져오기
    const { data: posts, error } = await supabase
      .from('partnershipsubmit')
      .select('id, created_at, region, subregion')
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // URL 필드 생성
    const fields = []

    // 게시물 URL 추가
    for (const post of posts) {
      fields.push({
        loc: `https://yeogidot.com/board/${post.region}/${post.subregion}/${post.id}`,
        lastmod: new Date(post.created_at).toISOString(),
        changefreq: 'daily',
        priority: 0.8,
      })
    }

    // 지역별 URL 추가
    const regions = [...new Set(posts.map(post => post.region))]
    const subregions = [...new Set(posts.map(post => post.subregion))]

    for (const region of regions) {
      for (const subregion of subregions) {
        fields.push({
          loc: `https://yeogidot.com/board/${region}/${subregion}`,
          changefreq: 'daily',
          priority: 0.7,
        })
      }
    }

    return getServerSideSitemap(fields)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
} 
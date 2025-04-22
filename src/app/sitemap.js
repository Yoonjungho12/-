import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function sitemap() {
  try {
    // 게시물 데이터 가져오기
    const { data: posts, error } = await supabase
      .from('partnershipsubmit')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    // 게시물 URL 생성
    const postUrls = posts?.map((post) => ({
      url: `https://yeogidot.com/board/details/${post.id}`,
      lastModified: new Date(post.created_at),
      changeFrequency: 'daily',
      priority: 0.8,
    })) || [];

    // 정적 페이지 URL
    const staticUrls = [
      {
        url: 'https://yeogidot.com',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: 'https://yeogidot.com/board',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];

    return [...staticUrls, ...postUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
} 
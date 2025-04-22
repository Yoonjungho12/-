import { getServerSideSitemap } from 'next-sitemap';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data: posts, error } = await supabase
      .from('partnershipsubmit')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return new Response('Error generating sitemap', { status: 500 });
    }

    const postFields = posts.map((post) => ({
      loc: `https://yeogidot.com/board/details/${post.id}`,
      lastmod: new Date(post.created_at).toISOString(),
      changefreq: 'daily',
      priority: 0.7,
    }));

    return getServerSideSitemap(postFields);
  } catch (e) {
    console.error('Error in sitemap generation:', e);
    return new Response('Error generating sitemap', { status: 500 });
  }
} 
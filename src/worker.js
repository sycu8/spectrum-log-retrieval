export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    
    if (request.method === 'GET') {
      // List logs endpoint
      if (url.pathname === '/20241223/') {
        try {
          const prefix = url.searchParams.get('prefix') || '';
          const limit = parseInt(url.searchParams.get('limit')) || 100;
          
          const objects = await env.LOG_BUCKET.list({
            prefix: prefix,
            limit: limit,
          });

          const logs = objects.objects.map(obj => ({
            name: obj.key,
            size: obj.size,
            uploaded: obj.uploaded,
          }));

          return new Response(JSON.stringify(logs), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to list logs' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }
      
      // Get specific log endpoint
      if (url.pathname.startsWith('/api/logs/')) {
        try {
          const logKey = decodeURIComponent(url.pathname.replace('/api/logs/', ''));
          const object = await env.LOG_BUCKET.get(logKey);
          
          if (!object) {
            return new Response(JSON.stringify({ error: 'Log not found' }), {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          const headers = new Headers(corsHeaders);
          headers.set('Content-Type', object.httpMetadata.contentType || 'text/plain');
          headers.set('Content-Length', object.size);
          
          return new Response(object.body, { headers });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Failed to retrieve log' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  },
};
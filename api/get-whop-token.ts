export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  const token = request.headers.get('x-whop-user-token');
  
  return new Response(JSON.stringify({ token: token || null }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'private, no-store, max-age=0',
      'vary': 'x-whop-user-token',
    },
  });
}

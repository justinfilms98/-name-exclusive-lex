export async function GET(request, { params }) {
  return new Response(`Echo: ${params.slug}`);
} 
// Type declarations to satisfy Next.js typed routes imports
// This prevents build errors when Next.js generates route type imports

declare module '../../app/account/page.js' {
  const Page: any;
  export default Page;
}

declare module '../app/account/page.js' {
  const Page: any;
  export default Page;
}

declare module '@/app/account/page' {
  const Page: any;
  export default Page;
}

// Wildcard for any app route page.js imports
declare module '../../app/**/page.js' {
  const Page: any;
  export default Page;
}

declare module '../app/**/page.js' {
  const Page: any;
  export default Page;
}


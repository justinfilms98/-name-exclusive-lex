const fetch = require('node-fetch');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // Set this in your env
const PROJECT = 'exclusive-lex'; // Your project name
const DOMAIN = 'exclusivelex.com'; // Your custom domain
const TEAM = ''; // Optional: your team slug, if using a team

const base = TEAM
  ? `https://api.vercel.com/v9/projects/${PROJECT}/domains?teamId=${TEAM}`
  : `https://api.vercel.com/v9/projects/${PROJECT}/domains`;

async function checkDomain() {
  const res = await fetch(base, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  const data = await res.json();
  const found = data.domains.find((d) => d.name === DOMAIN);
  return found;
}

async function addDomain() {
  const res = await fetch(base, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: DOMAIN }),
  });
  const data = await res.json();
  return data;
}

async function main() {
  let domain = await checkDomain();
  if (!domain) {
    console.log('Domain not found, adding...');
    domain = await addDomain();
    if (domain.error) {
      console.error('Error adding domain:', domain.error);
      process.exit(1);
    }
  }
  if (domain.verified) {
    console.log('Domain is already verified!');
    return;
  }
  if (domain.verification) {
    console.log('Domain not verified. Please add the following DNS record:');
    console.log(domain.verification);
  } else {
    console.log('Domain not verified. Please check your DNS settings.');
  }
}

main(); 
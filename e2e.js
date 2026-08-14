const baseUrl = 'http://localhost:8080/api/v1';

async function run() {
  console.log('1. Authentication');
  const res = await fetch(`${baseUrl}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'superadmin@venturo.id', password: 'password' })
  });
  const data = await res.json();
  console.log(data);
}

run();

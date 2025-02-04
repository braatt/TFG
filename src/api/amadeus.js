const amadeusAuthUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';

export const getAccessToken = async (apiKey, apiSecret) => {
  const response = await fetch(amadeusAuthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  const data = await response.json();
  return data.access_token; 
};
